const express = require('express');
const { shopify } = require('../lib/shopify');
const { createSubscription, getActiveSubscription, checkBillingStatus } = require('../services/billingService');
const logger = require('../utils/logger');

const router = express.Router();

// Ensure billing subscription
router.post('/ensure', async (req, res) => {
  try {
    const { shop, host } = req.query;
    
    if (!shop) {
      return res.status(400).json({ error: 'Missing shop parameter' });
    }

    // Get session
    const session = await shopify.config.sessionStorage.loadSession(`offline_${shop}`);
    if (!session) {
      return res.status(401).json({ error: 'No valid session found' });
    }

    // Check if already has active subscription
    const existingSubscription = await getActiveSubscription(session);
    if (existingSubscription) {
      return res.json({
        hasActiveSubscription: true,
        subscription: existingSubscription
      });
    }

    // Create new subscription
    const result = await createSubscription(session);
    
    res.json({
      hasActiveSubscription: false,
      confirmationUrl: result.confirmationUrl,
      subscription: result.subscription
    });

  } catch (error) {
    logger.error('Billing ensure error:', error);
    res.status(500).json({ error: 'Failed to ensure billing' });
  }
});

// Get billing status
router.get('/status', async (req, res) => {
  try {
    const { shop } = req.query;
    
    if (!shop) {
      return res.status(400).json({ error: 'Missing shop parameter' });
    }

    const billingStatus = await checkBillingStatus(shop);
    res.json(billingStatus);

  } catch (error) {
    logger.error('Billing status error:', error);
    res.status(500).json({ error: 'Failed to get billing status' });
  }
});

module.exports = router;
