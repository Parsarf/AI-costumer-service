const crypto = require('node:crypto');
const logger = require('./logger');

/**
 * Verify Shopify webhook HMAC signature
 * @param {Object} req - Express request object
 * @returns {boolean} - True if valid, false if invalid
 */
function verifyWebhookHmac(req) {
  try {
    const hmac = req.get('X-Shopify-Hmac-Sha256');
    
    if (!hmac) {
      logger.warn('Missing webhook HMAC signature');
      return false;
    }

    // Get raw body buffer (already parsed by express.raw)
    const rawBody = req.body;
    
    if (!rawBody || !Buffer.isBuffer(rawBody)) {
      logger.warn('Invalid raw body for HMAC verification');
      return false;
    }

    // Calculate HMAC using Shopify API secret
    const calculatedHmac = crypto
      .createHmac('sha256', process.env.SHOPIFY_API_SECRET)
      .update(rawBody, 'utf8')
      .digest('base64');

    // Use timing-safe comparison to prevent timing attacks
    const isValid = crypto.timingSafeEqual(
      Buffer.from(hmac, 'base64'),
      Buffer.from(calculatedHmac, 'base64')
    );

    if (!isValid) {
      logger.warn('Invalid webhook HMAC signature');
    }

    return isValid;
  } catch (error) {
    logger.error('Error verifying webhook HMAC:', error);
    return false;
  }
}

/**
 * Verify webhook and extract shop domain
 * @param {Object} req - Express request object
 * @returns {Object} - { isValid: boolean, shop: string }
 */
function verifyWebhookAndExtractShop(req) {
  const isValid = verifyWebhookHmac(req);
  
  if (!isValid) {
    return { isValid: false, shop: null };
  }

  // Extract shop domain from headers or body
  const shop = req.get('X-Shopify-Shop-Domain') || 
               req.body?.shop_domain || 
               req.body?.shop;

  if (!shop) {
    logger.warn('No shop domain found in webhook');
    return { isValid: false, shop: null };
  }

  return { isValid: true, shop };
}

module.exports = {
  verifyWebhookHmac,
  verifyWebhookAndExtractShop
};

