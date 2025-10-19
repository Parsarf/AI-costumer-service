const express = require('express');
const { shopify } = require('../lib/shopify');
const prisma = require('../lib/prisma');
const { 
  createSubscription, 
  verifySubscription, 
  cancelSubscription,
  getBillingStatus,
  updateBillingSubscription
} = require('../controllers/billingController');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * Create billing subscription
 * POST /billing/create?shop=example.myshopify.com&plan=starter
 */
router.post('/create', async (req, res) => {
  try {
    const { shop, plan = 'starter' } = req.query;
    
    if (!shop) {
      return res.status(400).json({ error: 'Missing shop parameter' });
    }

    // Get store access token
    const store = await prisma.shop.findUnique({
      where: { shop, isActive: true }
    });

    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    // Check if already has active subscription
    const { hasActiveSubscription } = await verifySubscription(shop, store.accessToken);
    if (hasActiveSubscription) {
      return res.json({
        hasActiveSubscription: true,
        message: 'Subscription already active'
      });
    }

    // Create new subscription
    const result = await createSubscription(shop, store.accessToken, plan);
    
    res.json({
      hasActiveSubscription: false,
      confirmationUrl: result.confirmationUrl,
      subscription: result.subscription
    });

  } catch (error) {
    logger.error('Billing create error:', error);
    res.status(500).json({ error: 'Failed to create subscription', details: error.message });
  }
});

/**
 * Handle billing callback after merchant approval
 * GET /billing/callback?shop=example.myshopify.com
 */
router.get('/callback', async (req, res) => {
  try {
    const { shop } = req.query;
    
    if (!shop) {
      return res.status(400).json({ error: 'Missing shop parameter' });
    }

    // Get store access token
    const store = await prisma.shop.findUnique({
      where: { shop, isActive: true }
    });

    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    // Verify subscription status
    const { hasActiveSubscription, subscription } = await verifySubscription(shop, store.accessToken);
    
    if (hasActiveSubscription && subscription) {
      // Update database with subscription details
      const subscriptionData = {
        id: subscription.id,
        name: subscription.name || 'AI Support Bot Subscription',
        status: subscription.status,
        price: subscription.lineItems?.[0]?.plan?.pricingDetails?.price?.amount || 19.99,
        trialEndsAt: subscription.trialDays ? 
          new Date(Date.now() + subscription.trialDays * 24 * 60 * 60 * 1000) : null,
        currentPeriodEnd: subscription.currentPeriodEnd ? 
          new Date(subscription.currentPeriodEnd) : null
      };

      await updateBillingSubscription(shop, subscriptionData);

      // Update shop plan
      await prisma.shop.update({
        where: { shop },
        data: { 
          subscriptionTier: 'pro',
          subscriptionStatus: 'active',
          updatedAt: new Date()
        }
      });

      logger.info('Billing callback processed successfully', { shop, subscriptionId: subscription.id });
    }

    // Redirect back to embedded app
    res.redirect(`/app?shop=${shop}&billing=success`);

  } catch (error) {
    logger.error('Billing callback error:', error);
    res.redirect(`/app?shop=${req.query.shop}&billing=error`);
  }
});

/**
 * Cancel subscription
 * POST /billing/cancel?shop=example.myshopify.com
 */
router.post('/cancel', async (req, res) => {
  try {
    const { shop } = req.query;
    
    if (!shop) {
      return res.status(400).json({ error: 'Missing shop parameter' });
    }

    // Get store access token
    const store = await prisma.shop.findUnique({
      where: { shop, isActive: true }
    });

    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    // Get subscription ID
    const billingSubscription = await prisma.billingSubscription.findUnique({
      where: { shopId: shop }
    });

    if (!billingSubscription) {
      return res.status(404).json({ error: 'No subscription found' });
    }

    // Cancel subscription
    await cancelSubscription(shop, store.accessToken, billingSubscription.subscriptionId);

    // Update shop plan
    await prisma.shop.update({
      where: { shop },
      data: { 
        subscriptionTier: 'starter',
        subscriptionStatus: 'cancelled',
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Subscription cancelled successfully'
    });

  } catch (error) {
    logger.error('Billing cancel error:', error);
    res.status(500).json({ error: 'Failed to cancel subscription', details: error.message });
  }
});

/**
 * Get billing status
 * GET /billing/status?shop=example.myshopify.com
 */
router.get('/status', async (req, res) => {
  try {
    const { shop } = req.query;
    
    if (!shop) {
      return res.status(400).json({ error: 'Missing shop parameter' });
    }

    const billingStatus = await getBillingStatus(shop);
    res.json(billingStatus);

  } catch (error) {
    logger.error('Billing status error:', error);
    res.status(500).json({ error: 'Failed to get billing status' });
  }
});

module.exports = router;
