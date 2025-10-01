const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

// Initialize Sequelize with connection pooling
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? 
    (msg) => logger.debug(msg) : false,
  pool: {
    max: 10,
    min: 2,
    acquire: 30000,
    idle: 10000
  },
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' ? {
      require: true,
      rejectUnauthorized: false
    } : false
  }
});

/**
 * Test database connection
 */
async function testConnection() {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established successfully');
    return true;
  } catch (error) {
    logger.error('Unable to connect to database:', error);
    throw error;
  }
}

/**
 * Initialize database (test connection and sync models)
 */
async function initDatabase() {
  await testConnection();
  
  // Import models
  require('../models/Store');
  require('../models/Conversation');
  require('../models/Message');
  
  // Sync models in development only
  if (process.env.NODE_ENV === 'development') {
    await sequelize.sync({ alter: false });
    logger.info('Database models synchronized');
  }
}

/**
 * Close database connection gracefully
 */
async function closeDatabase() {
  await sequelize.close();
  logger.info('Database connection closed');
}

module.exports = {
  sequelize,
  initDatabase,
  closeDatabase,
  testConnection
};

