const logger = require('../utils/logger');

/**
 * Validate and sanitize input data
 */
function validateInput(req, res, next) {
  try {
    // Validate shop parameter
    if (req.query.shop || req.body.shop) {
      const shop = req.query.shop || req.body.shop;
      if (!isValidShopDomain(shop)) {
        return res.status(400).json({ 
          error: 'Invalid shop domain format' 
        });
      }
    }

    // Validate message content for chat endpoints
    if (req.path.includes('/chat') && req.body.message) {
      const message = req.body.message;
      
      if (typeof message !== 'string') {
        return res.status(400).json({ 
          error: 'Message must be a string' 
        });
      }

      if (message.length === 0) {
        return res.status(400).json({ 
          error: 'Message cannot be empty' 
        });
      }

      if (message.length > 1000) {
        return res.status(400).json({ 
          error: 'Message too long (max 1000 characters)' 
        });
      }

      // Check for potential XSS
      if (containsXSS(message)) {
        logger.warn('Potential XSS detected', { 
          ip: req.ip, 
          message: message.substring(0, 100) 
        });
        return res.status(400).json({ 
          error: 'Invalid message content' 
        });
      }
    }

    // Validate email format
    if (req.body.supportEmail || req.body.email) {
      const email = req.body.supportEmail || req.body.email;
      if (!isValidEmail(email)) {
        return res.status(400).json({ 
          error: 'Invalid email format' 
        });
      }
    }

    // Validate color format
    if (req.body.primaryColor) {
      if (!isValidColor(req.body.primaryColor)) {
        return res.status(400).json({ 
          error: 'Invalid color format' 
        });
      }
    }

    // Validate conversation ID format
    if (req.body.conversationId) {
      if (!isValidConversationId(req.body.conversationId)) {
        return res.status(400).json({ 
          error: 'Invalid conversation ID format' 
        });
      }
    }

    next();
  } catch (error) {
    logger.error('Input validation error:', error);
    res.status(500).json({ error: 'Input validation failed' });
  }
}

/**
 * Validate shop domain format
 */
function isValidShopDomain(shop) {
  if (typeof shop !== 'string') return false;
  
  // Must be valid Shopify domain format
  const shopRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/;
  return shopRegex.test(shop) && shop.length <= 255;
}

/**
 * Check for potential XSS attacks
 */
function containsXSS(input) {
  if (typeof input !== 'string') return false;
  
  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<[^>]*>/gi
  ];
  
  return xssPatterns.some(pattern => pattern.test(input));
}

/**
 * Validate email format
 */
function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Validate color format (hex color)
 */
function isValidColor(color) {
  if (typeof color !== 'string') return false;
  
  const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return colorRegex.test(color);
}

/**
 * Validate conversation ID format
 */
function isValidConversationId(id) {
  if (typeof id !== 'string') return false;
  
  // Should be alphanumeric with possible hyphens/underscores
  const idRegex = /^[a-zA-Z0-9_-]+$/;
  return idRegex.test(id) && id.length <= 100;
}

/**
 * Sanitize HTML content
 */
function sanitizeHtml(input) {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate settings object
 */
function validateSettings(settings) {
  if (!settings || typeof settings !== 'object') {
    return { valid: false, error: 'Settings must be an object' };
  }

  const errors = [];

  // Validate welcome message
  if (settings.welcomeMessage) {
    if (typeof settings.welcomeMessage !== 'string' || 
        settings.welcomeMessage.length > 500) {
      errors.push('Welcome message must be a string with max 500 characters');
    }
  }

  // Validate return policy
  if (settings.returnPolicy) {
    if (typeof settings.returnPolicy !== 'string' || 
        settings.returnPolicy.length > 1000) {
      errors.push('Return policy must be a string with max 1000 characters');
    }
  }

  // Validate shipping policy
  if (settings.shippingPolicy) {
    if (typeof settings.shippingPolicy !== 'string' || 
        settings.shippingPolicy.length > 1000) {
      errors.push('Shipping policy must be a string with max 1000 characters');
    }
  }

  // Validate support email
  if (settings.supportEmail) {
    if (!isValidEmail(settings.supportEmail)) {
      errors.push('Support email must be a valid email format');
    }
  }

  // Validate bot personality
  if (settings.botPersonality) {
    const validPersonalities = ['friendly', 'professional', 'efficient'];
    if (!validPersonalities.includes(settings.botPersonality)) {
      errors.push('Bot personality must be one of: friendly, professional, efficient');
    }
  }

  // Validate primary color
  if (settings.primaryColor) {
    if (!isValidColor(settings.primaryColor)) {
      errors.push('Primary color must be a valid hex color');
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors
  };
}

module.exports = {
  validateInput,
  isValidShopDomain,
  containsXSS,
  isValidEmail,
  isValidColor,
  isValidConversationId,
  sanitizeHtml,
  validateSettings
};
