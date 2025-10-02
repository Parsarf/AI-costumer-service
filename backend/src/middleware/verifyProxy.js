const crypto = require('crypto');
const logger = require('../utils/logger');

const verifyAppProxy = (req, res, next) => {
  try {
    const { signature, timestamp } = req.query;
    
    if (!signature || !timestamp) {
      return res.status(401).json({ error: 'Missing signature or timestamp' });
    }

    // Check timestamp (prevent replay attacks)
    const now = Math.floor(Date.now() / 1000);
    const requestTime = parseInt(timestamp);
    
    if (now - requestTime > 300) { // 5 minutes
      return res.status(401).json({ error: 'Request too old' });
    }

    // Verify signature
    const queryString = Object.keys(req.query)
      .filter(key => key !== 'signature')
      .sort()
      .map(key => `${key}=${req.query[key]}`)
      .join('&');

    const hmac = crypto
      .createHmac('sha256', process.env.SHOPIFY_API_SECRET)
      .update(queryString)
      .digest('hex');

    if (hmac !== signature) {
      logger.warn('Invalid app proxy signature');
      return res.status(403).json({ error: 'Invalid signature' });
    }

    next();
  } catch (error) {
    logger.error('App proxy verification error:', error);
    res.status(500).json({ error: 'Proxy verification failed' });
  }
};

module.exports = verifyAppProxy;
