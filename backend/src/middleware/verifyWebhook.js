const { verifyWebhook } = require('../lib/shopify');
const logger = require('../utils/logger');

const verifyShopifyWebhook = (req, res, next) => {
  try {
    const hmac = req.get('X-Shopify-Hmac-Sha256');
    
    if (!hmac) {
      logger.warn('Missing webhook signature');
      return res.status(401).json({ error: 'Missing webhook signature' });
    }

    const body = req.rawBody || JSON.stringify(req.body);
    
    if (!verifyWebhook(body, hmac)) {
      logger.warn('Invalid webhook signature');
      return res.status(403).json({ error: 'Invalid webhook signature' });
    }

    next();
  } catch (error) {
    logger.error('Webhook verification error:', error);
    res.status(500).json({ error: 'Webhook verification failed' });
  }
};

module.exports = verifyShopifyWebhook;
