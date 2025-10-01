const Store = require('../models/Store');
const { getConversationAnalytics, getShopConversations } = require('../services/conversationService');
const logger = require('../utils/logger');

/**
 * Get analytics for a shop
 * GET /api/analytics/:shop
 */
async function getAnalytics(req, res) {
  try {
    const { shop } = req.params;
    const { startDate, endDate } = req.query;

    const store = await Store.findOne({ where: { shop } });
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const dateRange = {};
    if (startDate) dateRange.startDate = new Date(startDate);
    if (endDate) dateRange.endDate = new Date(endDate);

    const analytics = await getConversationAnalytics(store.id, dateRange);

    res.json({
      shop: store.shop,
      period: {
        startDate: dateRange.startDate || null,
        endDate: dateRange.endDate || null
      },
      analytics: {
        ...analytics,
        subscription: {
          tier: store.subscriptionTier,
          conversationCount: store.conversationCount,
          conversationLimit: store.conversationLimit,
          usagePercentage: ((store.conversationCount / store.conversationLimit) * 100).toFixed(2)
        }
      }
    });
  } catch (error) {
    logger.error('Error getting analytics:', error);
    res.status(500).json({ error: 'Failed to get analytics' });
  }
}

/**
 * Get recent conversations
 * GET /api/analytics/:shop/conversations
 */
async function getConversations(req, res) {
  try {
    const { shop } = req.params;
    const { status, escalated, limit = 50, offset = 0 } = req.query;

    const store = await Store.findOne({ where: { shop } });
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const filters = { 
      limit: parseInt(limit), 
      offset: parseInt(offset) 
    };
    
    if (status) filters.status = status;
    if (escalated !== undefined) filters.escalated = escalated === 'true';

    const conversations = await getShopConversations(store.id, filters);

    res.json({
      shop: store.shop,
      conversations: conversations.map(conv => ({
        id: conv.id,
        customerEmail: conv.customerEmail,
        customerName: conv.customerName,
        status: conv.status,
        escalated: conv.escalated,
        messageCount: conv.messageCount,
        lastMessageAt: conv.lastMessageAt,
        createdAt: conv.createdAt,
        lastMessage: conv.messages?.[0] || null
      })),
      total: conversations.length
    });
  } catch (error) {
    logger.error('Error getting conversations:', error);
    res.status(500).json({ error: 'Failed to get conversations' });
  }
}

/**
 * Get dashboard summary
 * GET /api/analytics/:shop/dashboard
 */
async function getDashboardSummary(req, res) {
  try {
    const { shop } = req.params;

    const store = await Store.findOne({ where: { shop } });
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    // Get analytics for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const analytics = await getConversationAnalytics(store.id, {
      startDate: thirtyDaysAgo,
      endDate: new Date()
    });

    // Get recent escalated conversations
    const escalatedConvos = await getShopConversations(store.id, {
      escalated: true,
      limit: 10
    });

    res.json({
      shop: store.shop,
      storeName: store.storeName,
      subscription: {
        tier: store.subscriptionTier,
        status: store.subscriptionStatus,
        conversationCount: store.conversationCount,
        conversationLimit: store.conversationLimit,
        usagePercentage: ((store.conversationCount / store.conversationLimit) * 100).toFixed(2)
      },
      analytics: {
        period: '30 days',
        ...analytics
      },
      recentEscalations: escalatedConvos.map(conv => ({
        id: conv.id,
        customerEmail: conv.customerEmail,
        reason: conv.escalationReason,
        createdAt: conv.createdAt
      }))
    });
  } catch (error) {
    logger.error('Error getting dashboard summary:', error);
    res.status(500).json({ error: 'Failed to get dashboard summary' });
  }
}

module.exports = {
  getAnalytics,
  getConversations,
  getDashboardSummary
};

