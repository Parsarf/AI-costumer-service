require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { shopify } = require('./src/lib/shopify');
const prisma = require('./src/lib/prisma');
const logger = require('./src/utils/logger');

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy for Railway
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      frameAncestors: ["'self'", "https://admin.shopify.com", "https://*.myshopify.com"]
    }
  }
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
    
    callback(null, true); // For development, allow all
  },
  credentials: true
}));

// Body parsing middleware
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
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Health check endpoints
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.get('/ready', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ready' });
  } catch (error) {
    res.status(503).json({ status: 'not ready', error: error.message });
  }
});

// OAuth routes
app.get('/auth', async (req, res) => {
  try {
    const { shop } = req.query;
    
    if (!shop) {
      return res.status(400).json({ error: 'Missing shop parameter' });
    }

    const authRoute = await shopify.auth.begin({
      shop: shop,
      callbackPath: '/auth/callback',
      isOnline: false,
      rawRequest: req,
      rawResponse: res
    });

    res.redirect(authRoute);
  } catch (error) {
    logger.error('OAuth error:', error);
    res.status(500).json({ error: 'OAuth failed' });
  }
});

app.get('/auth/callback', async (req, res) => {
  try {
    const callbackResponse = await shopify.auth.callback({
      rawRequest: req,
      rawResponse: res
    });

    const { session } = callbackResponse;
    
    // Save shop to database
    await prisma.shop.upsert({
      where: { shop: session.shop },
      update: {
        accessToken: session.accessToken,
        isActive: true,
        updatedAt: new Date()
      },
      create: {
        shop: session.shop,
        accessToken: session.accessToken,
        isActive: true
      }
    });

    // Redirect to embedded app
    res.redirect(`/app?shop=${session.shop}&host=${req.query.host}`);
  } catch (error) {
    logger.error('OAuth callback error:', error);
    res.status(500).json({ error: 'OAuth callback failed' });
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
    
    // Serve embedded app HTML
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>AI Support Bot</title>
          <script src="https://unpkg.com/@shopify/app-bridge@4"></script>
          <script src="https://unpkg.com/@shopify/polaris@12"></script>
          <link rel="stylesheet" href="https://unpkg.com/@shopify/polaris@12/build/esm/styles.css" />
        </head>
        <body>
          <div id="app"></div>
          <script>
            const { createApp } = window['@shopify/app-bridge'];
            const { AppProvider, Page, Card, Button, Text } = window['@shopify/polaris'];
            
            const app = createApp({
              apiKey: '${process.env.SHOPIFY_API_KEY}',
              shop: '${shop}',
              host: '${host}'
            });
            
            ReactDOM.render(
              React.createElement(AppProvider, { i18n: {} },
                React.createElement(Page, { title: "AI Support Bot" },
                  React.createElement(Card, {},
                    React.createElement(Text, { variant: "headingMd" }, "Welcome to AI Support Bot!"),
                    React.createElement(Text, { variant: "bodyMd" }, "Your AI-powered customer support is now active."),
                    React.createElement(Button, { primary: true }, "Configure Settings")
                  )
                )
              ),
              document.getElementById('app')
            );
          </script>
        </body>
      </html>
    `);
  } catch (error) {
    logger.error('App route error:', error);
    res.status(500).json({ error: 'App failed to load' });
  }
});

// API routes
app.use('/api/chat', require('./src/routes/chat'));
app.use('/api/settings', require('./src/routes/settings'));
app.use('/billing', require('./src/routes/billing'));

// Webhook routes
app.use('/webhooks', require('./src/routes/webhooks'));

// App proxy route for storefront
app.use('/aibot', require('./src/routes/proxy'));

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
    // Test database connection
    await prisma.$connect();
    logger.info('Database connected successfully');
    
    app.listen(PORT, () => {
      logger.info(`🚀 Shopify AI Support Bot running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
      logger.info(`App URL: ${process.env.APP_URL}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();

module.exports = app;