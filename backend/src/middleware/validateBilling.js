const { getBillingStatus } = require('../controllers/billingController');
const logger = require('../utils/logger');

/**
 * Middleware to validate billing status for chat endpoint
 * Checks if store has active subscription and is within limits
 */
async function validateBilling(req, res, next) {
  try {
    const { shop } = req.query || req.body;
    
    if (!shop) {
      return res.status(400).json({ error: 'Missing shop parameter' });
    }

    // Check billing status
    const billingStatus = await getBillingStatus(shop);
    
    if (!billingStatus.hasAccess) {
      logger.warn('Billing validation failed', { 
        shop, 
        plan: billingStatus.plan,
        status: billingStatus.status 
      });

      return res.status(402).json({
        error: 'Payment Required',
        message: 'Please upgrade your plan to use the AI support bot.',
        plan: billingStatus.plan,
        status: billingStatus.status,
        upgradeUrl: `${process.env.APP_URL}/app?shop=${shop}&billing=upgrade`
      });
    }

    // Check conversation limits (if applicable)
    if (billingStatus.plan !== 'free' && billingStatus.plan !== 'scale') {
      // For starter and pro plans, check monthly conversation limits
      const conversationCount = await getConversationCountThisMonth(shop);
      const limit = getPlanLimit(billingStatus.plan);
      
      if (conversationCount >= limit) {
        logger.warn('Conversation limit exceeded', { 
          shop, 
          plan: billingStatus.plan,
          count: conversationCount,
          limit: limit
        });

        return res.status(402).json({
          error: 'Usage Limit Exceeded',
          message: `You've reached your monthly conversation limit of ${limit}. Please upgrade your plan.`,
          plan: billingStatus.plan,
          count: conversationCount,
          limit: limit,
          upgradeUrl: `${process.env.APP_URL}/app?shop=${shop}&billing=upgrade`
        });
      }
    }

    // Add billing info to request for use in response
    req.billingStatus = billingStatus;
    next();

  } catch (error) {
    logger.error('Billing validation error:', error);
    // Don't block requests if billing check fails
    next();
  }
}

/**
 * Get conversation count for current month
 * @param {string} shop - Shop domain
 * @returns {number} - Conversation count
 */
async function getConversationCountThisMonth(shop) {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const { prisma } = require('../lib/prisma');
    
    const count = await prisma.conversation.count({
      where: {
        shop: shop,
        createdAt: {
          gte: startOfMonth
        }
      }
    });

    return count;
  } catch (error) {
    logger.error('Error getting conversation count:', error);
    return 0;
  }
}

/**
 * Get conversation limit for plan
 * @param {string} plan - Plan name
 * @returns {number} - Monthly limit
 */
function getPlanLimit(plan) {
  const limits = {
    'free': 100,
    'starter': 1000,
    'pro': 5000,
    'scale': 999999 // Effectively unlimited
  };
  
  return limits[plan] || limits.free;
}

/**
 * Middleware to check if billing is required (for non-chat endpoints)
 * This is a lighter check that doesn't block requests
 */
async function checkBillingStatus(req, res, next) {
  try {
    const { shop } = req.query || req.body;
    
    if (shop) {
      const billingStatus = await getBillingStatus(shop);
      req.billingStatus = billingStatus;
    }
    
    next();
  } catch (error) {
    logger.error('Billing status check error:', error);
    next();
  }
}

module.exports = {
  validateBilling,
  checkBillingStatus,
  getConversationCountThisMonth,
  getPlanLimit
};

