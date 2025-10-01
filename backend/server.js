require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const logger = require('./src/utils/logger');
const errorHandler = require('./src/middleware/errorHandler');

// Import routes
const authRoutes = require('./src/routes/auth');
const chatRoutes = require('./src/routes/chat');
const settingsRoutes = require('./src/routes/settings');
const webhooksRoutes = require('./src/routes/webhooks');
const analyticsRoutes = require('./src/routes/analytics');

// Initialize database
const { initDatabase } = require('./src/config/database');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for widget embedding
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Allow all Shopify domains and your widget
    if (origin.includes('.myshopify.com') || 
        origin.includes(process.env.APP_URL) ||
        origin.includes(process.env.WIDGET_URL)) {
      return callback(null, true);
    }
    
    callback(null, true); // For MVP, allow all (tighten in production)
  },
  credentials: true
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API routes
app.use('/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/webhooks', webhooksRoutes);
app.use('/api/analytics', analyticsRoutes);

// Serve chat widget files
app.use('/widget', express.static('../chat-widget/build'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler (must be last)
app.use(errorHandler);

// Initialize database and start server
async function startServer() {
  try {
    await initDatabase();
    logger.info('Database connected successfully');
    
    app.listen(PORT, () => {
      logger.info(`🚀 Shopify Support Bot API running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
      logger.info(`App URL: ${process.env.APP_URL}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  logger.error('Unhandled Rejection:', error);
  process.exit(1);
});

startServer();

module.exports = app;

