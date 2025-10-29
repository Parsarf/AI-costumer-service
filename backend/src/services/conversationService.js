const prisma = require('../lib/prisma');
const logger = require('../utils/logger');

/**
 * Create a new conversation
 */
async function createConversation(shopId, customerData = {}) {
  try {
    const conversation = await prisma.conversation.create({
      data: {
        shopId,
        customerEmail: customerData.email,
        customerName: customerData.name,
        customerId: customerData.id,
        sessionId: customerData.sessionId,
        status: 'active'
      }
    });

    logger.info('Created new conversation', { 
      conversationId: conversation.id,
      shopId 
    });

    return conversation;
  } catch (error) {
    logger.error('Error creating conversation:', error);
    throw error;
  }
}

/**
 * Get conversation by ID
 */
async function getConversation(conversationId, includeMessages = true) {
  try {
    const options = {
      where: { id: conversationId }
    };

    if (includeMessages) {
      options.include = {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      };
    }

    const conversation = await prisma.conversation.findUnique(options);
    return conversation;
  } catch (error) {
    logger.error('Error getting conversation:', error);
    throw error;
  }
}

/**
 * Get or create conversation
 */
async function getOrCreateConversation(conversationId, shopId, customerData) {
  if (conversationId) {
    const conversation = await getConversation(conversationId);
    if (conversation && conversation.shopId === shopId) {
      return conversation;
    }
  }

  return await createConversation(shopId, customerData);
}

/**
 * Save a message to conversation
 */
async function saveMessage(conversationId, role, content, metadata = {}) {
  try {
    const message = await prisma.message.create({
      data: {
        conversationId,
        role,
        content,
        metadata
      }
    });

    // Update conversation message count and last message time
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        messageCount: { increment: 1 },
        lastMessageAt: new Date()
      }
    });

    return message;
  } catch (error) {
    logger.error('Error saving message:', error);
    throw error;
  }
}

/**
 * Get conversation history
 */
async function getConversationHistory(conversationId, limit = 20) {
  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: limit
        }
      }
    });

    return conversation?.messages || [];
  } catch (error) {
    logger.error('Error getting conversation history:', error);
    throw error;
  }
}

/**
 * Get conversations for a shop
 */
async function getShopConversations(shopId, filters = {}) {
  try {
    const where = { shopId };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.escalated !== undefined) {
      where.escalated = filters.escalated;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.createdAt.lte = new Date(filters.endDate);
      }
    }

    const conversations = await prisma.conversation.findMany({
      where,
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { lastMessageAt: 'desc' },
      take: filters.limit || 50
    });

    return conversations;
  } catch (error) {
    logger.error('Error getting shop conversations:', error);
    throw error;
  }
}

/**
 * Get conversation analytics for a shop
 */
async function getConversationAnalytics(shopId, dateRange = {}) {
  try {
    const where = { shopId };

    if (dateRange.startDate || dateRange.endDate) {
      where.createdAt = {};
      if (dateRange.startDate) {
        where.createdAt.gte = new Date(dateRange.startDate);
      }
      if (dateRange.endDate) {
        where.createdAt.lte = new Date(dateRange.endDate);
      }
    }

    const conversations = await prisma.conversation.findMany({
      where,
      include: {
        messages: true
      }
    });

    const analytics = {
      totalConversations: conversations.length,
      activeConversations: conversations.filter(c => c.status === 'active').length,
      escalatedConversations: conversations.filter(c => c.escalated).length,
      resolvedConversations: conversations.filter(c => c.status === 'resolved').length,
      totalMessages: conversations.reduce((sum, c) => sum + c.messageCount, 0),
      averageMessagesPerConversation: conversations.length > 0 
        ? conversations.reduce((sum, c) => sum + c.messageCount, 0) / conversations.length 
        : 0,
      averageResponseTime: 0, // This would need to be calculated from message timestamps
      escalationRate: conversations.length > 0 
        ? conversations.filter(c => c.escalated).length / conversations.length 
        : 0
    };

    return analytics;
  } catch (error) {
    logger.error('Error getting conversation analytics:', error);
    throw error;
  }
}

/**
 * Update conversation status
 */
async function updateConversationStatus(conversationId, status, metadata = {}) {
  try {
    const updateData = { status };

    if (status === 'resolved') {
      updateData.resolvedAt = new Date();
    }

    if (Object.keys(metadata).length > 0) {
      updateData.metadata = metadata;
    }

    const result = await prisma.conversation.update({
      where: { id: conversationId },
      data: updateData
    });

    logger.info('Updated conversation status', { 
      conversationId, 
      status 
    });

    return result;
  } catch (error) {
    logger.error('Error updating conversation status:', error);
    throw error;
  }
}

module.exports = {
  createConversation,
  getConversation,
  getOrCreateConversation,
  saveMessage,
  getConversationHistory,
  getShopConversations,
  getConversationAnalytics,
  updateConversationStatus
};