const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

/**
 * General API rate limiter
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', { 
      ip: req.ip, 
      path: req.path 
    });
    res.status(429).json({
      error: 'Too many requests, please try again later.'
    });
  }
});

/**
 * Strict rate limiter for authentication endpoints
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 auth requests per windowMs
  skipSuccessfulRequests: true,
  message: 'Too many authentication attempts, please try again later.',
  handler: (req, res) => {
    logger.warn('Auth rate limit exceeded', { 
      ip: req.ip, 
      path: req.path 
    });
    res.status(429).json({
      error: 'Too many authentication attempts, please try again later.'
    });
  }
});

/**
 * Chat-specific rate limiter (per shop)
 */
const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // 20 messages per minute per shop
  keyGenerator: (req) => {
    // Rate limit by shop instead of IP
    return req.body.shop || req.query.shop || req.ip;
  },
  message: 'Too many messages, please slow down.',
  handler: (req, res) => {
    logger.warn('Chat rate limit exceeded', { 
      shop: req.body.shop || req.query.shop,
      ip: req.ip 
    });
    res.status(429).json({
      error: 'You\'re sending messages too quickly. Please wait a moment.'
    });
  }
});

/**
 * Webhook rate limiter (should be generous for Shopify)
 */
const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 webhooks per minute
  skipSuccessfulRequests: true,
  message: 'Webhook rate limit exceeded'
});

module.exports = {
  apiLimiter,
  authLimiter,
  chatLimiter,
  webhookLimiter
};

