const crypto = require('crypto');
const logger = require('../utils/logger');

/**
 * Verify Shopify HMAC signature for OAuth callback
 */
function verifyHmac(query, secret) {
  const { hmac, ...params } = query;
  
  if (!hmac) {
    return false;
  }

  // Build message string
  const message = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');

  // Generate HMAC
  const generatedHmac = crypto
    .createHmac('sha256', secret)
    .update(message)
    .digest('hex');

  // Compare HMACs (timing-safe comparison)
  return crypto.timingSafeEqual(
    Buffer.from(hmac),
    Buffer.from(generatedHmac)
  );
}

/**
 * Middleware to verify Shopify OAuth requests
 */
function verifyShopifyOAuth(req, res, next) {
  try {
    const { hmac, shop } = req.query;

    if (!shop) {
      return res.status(400).json({ error: 'Missing shop parameter' });
    }

    // Verify shop domain format
    if (!shop.match(/^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/)) {
      return res.status(400).json({ error: 'Invalid shop domain' });
    }

    if (!hmac) {
      return res.status(400).json({ error: 'Missing HMAC' });
    }

    // Verify HMAC
    const isValid = verifyHmac(req.query, process.env.SHOPIFY_API_SECRET);

    if (!isValid) {
      logger.warn('Invalid HMAC signature', { shop });
      return res.status(403).json({ error: 'Invalid HMAC signature' });
    }

    next();
  } catch (error) {
    logger.error('Error verifying Shopify OAuth:', error);
    res.status(500).json({ error: 'Failed to verify request' });
  }
}

/**
 * Verify Shopify webhook signature
 */
function verifyShopifyWebhook(req, res, next) {
  try {
    const hmac = req.get('X-Shopify-Hmac-Sha256');
    
    if (!hmac) {
      return res.status(401).json({ error: 'Missing webhook signature' });
    }

    const body = req.rawBody || JSON.stringify(req.body);
    
    const generatedHash = crypto
      .createHmac('sha256', process.env.SHOPIFY_API_SECRET)
      .update(body, 'utf8')
      .digest('base64');

    if (generatedHash !== hmac) {
      logger.warn('Invalid webhook signature');
      return res.status(403).json({ error: 'Invalid webhook signature' });
    }

    next();
  } catch (error) {
    logger.error('Error verifying webhook:', error);
    res.status(500).json({ error: 'Failed to verify webhook' });
  }
}

/**
 * Middleware to extract and verify shop from requests
 */
async function verifyShop(req, res, next) {
  try {
    const shop = req.query.shop || req.body.shop || req.params.shop;

    if (!shop) {
      return res.status(400).json({ error: 'Missing shop parameter' });
    }

    // Verify shop format
    if (!shop.match(/^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/)) {
      return res.status(400).json({ error: 'Invalid shop domain' });
    }

    req.shop = shop;
    next();
  } catch (error) {
    logger.error('Error verifying shop:', error);
    res.status(500).json({ error: 'Failed to verify shop' });
  }
}

module.exports = {
  verifyHmac,
  verifyShopifyOAuth,
  verifyShopifyWebhook,
  verifyShop
};

