const express = require('express');
const prisma = require('../lib/prisma');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * Get analytics for a shop
 * GET /api/analytics?shop=example.myshopify.com
 */
router.get('/', async (req, res) => {
  try {
    const { shop } = req.query;
    
    if (!shop) {
      return res.status(400).json({ error: 'Missing shop parameter' });
    }

    // Get shop from database
    const shopRecord = await prisma.shop.findFirst({
      where: { shopifyDomain: shop }
    });

    if (!shopRecord) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    // Get conversation statistics
    const totalConversations = await prisma.conversation.count({
      where: { shopId: shopRecord.id }
    });

    const escalatedConversations = await prisma.conversation.count({
      where: { 
        shopId: shopRecord.id,
        escalated: true
      }
    });

    // Get conversations from last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const recentConversations = await prisma.conversation.findMany({
      where: {
        shopId: shopRecord.id,
        createdAt: {
          gte: thirtyDaysAgo
        }
      },
      select: {
        createdAt: true,
        updatedAt: true
      }
    });

    // Calculate average response time (simplified)
    const averageResponseTime = recentConversations.length > 0 ? 
      recentConversations.reduce((acc, conv) => {
        const responseTime = conv.updatedAt.getTime() - conv.createdAt.getTime();
        return acc + (responseTime / 1000); // Convert to seconds
      }, 0) / recentConversations.length : 0;

    // Get conversations by day for the last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const dailyConversations = await prisma.conversation.groupBy({
      by: ['createdAt'],
      where: {
        shopId: shopRecord.id,
        createdAt: {
          gte: sevenDaysAgo
        }
      },
      _count: {
        id: true
      }
    });

    // Format daily data
    const dailyData = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      date.setHours(0, 0, 0, 0);
      
      const dayData = dailyConversations.find(d => 
        d.createdAt.toDateString() === date.toDateString()
      );
      
      return {
        date: date.toISOString().split('T')[0],
        count: dayData?._count.id || 0
      };
    });

    // Get top customer issues (from messages)
    const topIssues = await prisma.message.groupBy({
      by: ['content'],
      where: {
        conversation: {
          shopId: shopRecord.id,
          createdAt: {
            gte: thirtyDaysAgo
          }
        },
        role: 'user'
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 5
    });

    const analytics = {
      totalConversations,
      escalatedConversations,
      escalationRate: totalConversations > 0 ? 
        (escalatedConversations / totalConversations * 100).toFixed(1) : 0,
      averageResponseTime: Math.round(averageResponseTime),
      recentConversations: recentConversations.length,
      dailyData,
      topIssues: topIssues.map(issue => ({
        content: issue.content.substring(0, 100) + (issue.content.length > 100 ? '...' : ''),
        count: issue._count.id
      })),
      lastUpdated: new Date().toISOString()
    };

    logger.info('Analytics retrieved', { shop, totalConversations });

    res.json(analytics);

  } catch (error) {
    logger.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to get analytics' });
  }
});

/**
 * Get conversation details
 * GET /api/analytics/conversations?shop=example.myshopify.com&limit=10&offset=0
 */
router.get('/conversations', async (req, res) => {
  try {
    const { shop, limit = 10, offset = 0 } = req.query;
    
    if (!shop) {
      return res.status(400).json({ error: 'Missing shop parameter' });
    }

    // Get shop from database
    const shopRecord = await prisma.shop.findFirst({
      where: { shopifyDomain: shop }
    });

    if (!shopRecord) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    const conversations = await prisma.conversation.findMany({
      where: { shopId: shopRecord.id },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset),
      select: {
        id: true,
        customerEmail: true,
        customerName: true,
        status: true,
        escalated: true,
        messageCount: true,
        createdAt: true,
        updatedAt: true,
        metadata: true
      }
    });

    const totalCount = await prisma.conversation.count({
      where: { shopId: shopRecord.id }
    });

    res.json({
      conversations,
      totalCount,
      hasMore: (parseInt(offset) + parseInt(limit)) < totalCount
    });

  } catch (error) {
    logger.error('Conversations analytics error:', error);
    res.status(500).json({ error: 'Failed to get conversations' });
  }
});

module.exports = router;