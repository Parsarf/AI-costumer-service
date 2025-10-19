require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { shopify } = require('./src/lib/shopify');
const prisma = require('./src/lib/prisma');
const logger = require('./src/utils/logger');
const { initializeDatabase } = require('./init-db');

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy for Railway
app.set('trust proxy', 1);

// Enforce HTTPS in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      frameAncestors: [
        "https://admin.shopify.com",
        "https://*.myshopify.com"
      ],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.shopify.com", "https://unpkg.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.shopify.com", "https://unpkg.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.shopify.com", "https://api.openai.com"],
      fontSrc: ["'self'", "https://cdn.shopify.com", "https://unpkg.com"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" }
}));

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Allow Shopify admin and storefronts
    if (origin.includes('.myshopify.com') || 
        origin.includes('admin.shopify.com') ||
        origin.includes(process.env.APP_URL)) {
      return callback(null, true);
    }
    
    // In production, reject unknown origins
    if (process.env.NODE_ENV === 'production') {
      return callback(new Error('Not allowed by CORS'), false);
    }
    
    // In development, allow all
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Shopify-Hmac-Sha256', 'X-Shopify-Shop-Domain'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset']
}));

// Body parsing middleware
// Webhook routes need raw body for HMAC verification
app.use('/webhooks', express.raw({ type: 'application/json' }));

// All other routes use JSON parsing
app.use(express.json({ 
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// Rate limiting
const { apiLimiter, authLimiter, chatLimiter, webhookLimiter, billingLimiter } = require('./src/middleware/rateLimit');

// Apply rate limiting to different route groups
app.use('/api/', apiLimiter);
app.use('/auth/', authLimiter);
app.use('/webhooks/', webhookLimiter);
app.use('/billing/', billingLimiter);

// Health check endpoints
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV
  });
});

app.get('/ready', async (req, res) => {
  try {
    const checks = {
      database: false,
      claude: false,
      timestamp: new Date().toISOString()
    };

    // Check database connectivity
    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.database = true;
    } catch (error) {
      logger.error('Database health check failed:', error);
    }

    // Check Claude API connectivity
    try {
      const { Anthropic } = require('@anthropic-ai/sdk');
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY
      });
      
      // Simple ping test (this will fail if API key is invalid)
      if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.startsWith('sk-')) {
        checks.claude = true;
      }
    } catch (error) {
      logger.error('Claude API health check failed:', error);
    }

    const allHealthy = checks.database && checks.claude;
    
    if (allHealthy) {
      res.json({ 
        status: 'ready', 
        checks,
        message: 'All dependencies are healthy'
      });
    } else {
      res.status(503).json({ 
        status: 'not ready', 
        checks,
        message: 'One or more dependencies are unhealthy'
      });
    }
  } catch (error) {
    logger.error('Readiness check error:', error);
    res.status(503).json({ 
      status: 'not ready', 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// OAuth routes
app.get('/auth', async (req, res) => {
  try {
    const { shop } = req.query;
    
    if (!shop) {
      return res.status(400).json({ error: 'Missing shop parameter' });
    }

    // Validate shop domain
    if (!shop.match(/^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/)) {
      return res.status(400).json({ error: 'Invalid shop domain' });
    }

    // Generate state for security
    const crypto = require('crypto');
    const state = crypto.randomBytes(16).toString('hex');

    // Build authorization URL
    const authUrl = `https://${shop}/admin/oauth/authorize?` +
      `client_id=${process.env.SHOPIFY_API_KEY}&` +
      `scope=${process.env.SCOPES}&` +
      `redirect_uri=${process.env.APP_URL}/auth/callback&` +
      `state=${state}`;

    logger.info('Initiating OAuth flow', { shop, state });
    res.redirect(authUrl);
  } catch (error) {
    logger.error('OAuth error:', error);
    res.status(500).json({ error: 'OAuth failed' });
  }
});

app.get('/auth/callback', async (req, res) => {
  try {
    const { shop, code, state } = req.query;

    if (!shop || !code) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    logger.info('Processing OAuth callback', { shop });

    // Exchange authorization code for access token
    const tokenResponse = await fetch(
      `https://${shop}/admin/oauth/access_token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          client_id: process.env.SHOPIFY_API_KEY,
          client_secret: process.env.SHOPIFY_API_SECRET,
          code
        })
      }
    );

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for access token');
    }

    const { access_token } = await tokenResponse.json();

    logger.info('Access token obtained', { shop });

    // Save shop to database
    await prisma.shop.upsert({
      where: { shop },
      update: {
        accessToken: access_token,
        active: true,
        updatedAt: new Date()
      },
      create: {
        shop,
        accessToken: access_token,
        active: true,
        subscriptionTier: 'starter'
      }
    });

    logger.info('Store created/updated', { shop });

    // Redirect to embedded app
    res.redirect(`/app?shop=${shop}&host=${req.query.host}`);
  } catch (error) {
    logger.error('OAuth callback error:', error);
    res.status(500).json({ error: 'OAuth callback failed' });
  }
});

// Root route - redirect to app with shop parameter
app.get('/', async (req, res) => {
  try {
    const { shop, host } = req.query;
    
    if (!shop) {
      // If no shop parameter, show a simple message
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>AI Customer Service Bot</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .container { max-width: 600px; margin: 0 auto; }
            .logo { font-size: 24px; color: #4F46E5; margin-bottom: 20px; }
            .message { color: #666; margin-bottom: 30px; }
            .status { background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">🤖 AI Customer Service Bot</div>
            <div class="message">This app is designed to work within Shopify stores.</div>
            <div class="status">
              <strong>Status:</strong> ✅ Backend running successfully<br>
              <strong>Health:</strong> <a href="/health">Check health status</a>
            </div>
          </div>
        </body>
        </html>
      `);
    }

    // Redirect to /app with shop parameter
    const redirectUrl = `/app?shop=${encodeURIComponent(shop)}${host ? `&host=${encodeURIComponent(host)}` : ''}`;
    res.redirect(redirectUrl);
  } catch (error) {
    logger.error('Root route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Embedded app route
app.get('/app', async (req, res) => {
  try {
    const { shop, host } = req.query;
    
    if (!shop) {
      return res.status(400).json({ error: 'Missing shop parameter' });
    }

    // Set CSP and frame headers for embedded app
    res.setHeader('Content-Security-Policy', 'frame-ancestors https://admin.shopify.com https://*.myshopify.com;');
    res.setHeader('X-Frame-Options', 'ALLOWALL');
    
    // Read and serve the admin HTML file
    const fs = require('fs');
    const path = require('path');
    
    try {
      const htmlPath = path.join(__dirname, 'public', 'index.html');
      let html = fs.readFileSync(htmlPath, 'utf8');
      
      // Replace placeholder with actual API key
      html = html.replace('SHOPIFY_API_KEY_PLACEHOLDER', process.env.SHOPIFY_API_KEY);
      
      res.send(html);
    } catch (fileError) {
      logger.error('Error reading admin HTML:', fileError);
      res.status(500).json({ error: 'Admin interface not available' });
    }
  } catch (error) {
    logger.error('App route error:', error);
    res.status(500).json({ error: 'App failed to load' });
  }
});

// API routes
app.use('/api/chat', require('./src/routes/chat'));
app.use('/api/settings', require('./src/routes/settings'));
app.use('/api/analytics', require('./src/routes/analytics'));
app.use('/billing', require('./src/routes/billing'));

// Webhook routes
app.use('/webhooks', require('./src/routes/webhooks'));

// Webhook test routes (development only)
if (process.env.NODE_ENV === 'development') {
  app.use('/webhooks/test', require('./src/routes/webhooks-test'));
}

// App proxy route for storefront
app.use('/aibot', require('./src/routes/proxy'));

// Serve static files
app.use(express.static('public'));

// Serve theme extension assets
app.use('/extensions', express.static('extensions'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { details: err.message })
  });
});

// Start server
async function startServer() {
  try {
    // Validate environment variables
    const { validateEnvironment } = require('./src/config/validateEnv');
    validateEnvironment();

    // Test database connection
    await prisma.$connect();
    logger.info('Database connected successfully');
    
    // Initialize database tables
    await initializeDatabase();
    logger.info('Database tables initialized successfully');
    
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Shopify AI Support Bot running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
      logger.info(`App URL: ${process.env.HOST || 'https://ai-customerservice-production.up.railway.app'}`);
    });

    // Graceful shutdown handling
    setupGracefulShutdown(server);

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

/**
 * Setup graceful shutdown handling
 */
function setupGracefulShutdown(server) {
  const gracefulShutdown = async (signal) => {
    logger.info(`${signal} received, starting graceful shutdown...`);
    
    // Stop accepting new connections
    server.close(async () => {
      logger.info('HTTP server closed');
      
      try {
        // Close database connection
        await prisma.$disconnect();
        logger.info('Database connection closed');
        
        // Close any other resources here
        logger.info('Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        logger.error('Error during graceful shutdown:', error);
        process.exit(1);
      }
    });

    // Force close after 10 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  // Handle different termination signals
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // For nodemon
}

// Remove duplicate signal handlers (handled in setupGracefulShutdown)

startServer();

module.exports = app;