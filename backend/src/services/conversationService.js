const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Store = require('../models/Store');
const logger = require('../utils/logger');

/**
 * Create a new conversation
 */
async function createConversation(shopId, customerData = {}) {
  try {
    const conversation = await Conversation.create({
      shopId,
      customerEmail: customerData.email,
      customerName: customerData.name,
      customerId: customerData.id,
      sessionId: customerData.sessionId,
      status: 'active'
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
 * Get conversation by ID with messages
 */
async function getConversation(conversationId, includeMessages = true) {
  try {
    const options = {
      where: { id: conversationId }
    };

    if (includeMessages) {
      options.include = [{
        model: Message,
        as: 'messages',
        order: [['created_at', 'ASC']]
      }];
    }

    const conversation = await Conversation.findOne(options);
    return conversation;
  } catch (error) {
    logger.error('Error fetching conversation:', error);
    return null;
  }
}

/**
 * Get or create conversation
 */
async function getOrCreateConversation(conversationId, shopId, customerData) {
  if (conversationId) {
    const existing = await getConversation(conversationId);
    if (existing) {
      return existing;
    }
  }

  // Create new conversation
  return await createConversation(shopId, customerData);
}

/**
 * Save message to conversation
 */
async function saveMessage(conversationId, role, content, metadata = {}) {
  try {
    const message = await Message.create({
      conversationId,
      role,
      content,
      metadata,
      tokens: metadata.tokens,
      responseTime: metadata.responseTime,
      aiModel: metadata.model
    });

    // Update conversation
    const conversation = await Conversation.findByPk(conversationId);
    if (conversation) {
      await conversation.incrementMessageCount();
    }

    return message;
  } catch (error) {
    logger.error('Error saving message:', error);
    throw error;
  }
}

/**
 * Get conversation history formatted for OpenAI
 */
async function getConversationHistory(conversationId, limit = 20) {
  try {
    const messages = await Message.findAll({
      where: { conversationId },
      order: [['created_at', 'ASC']],
      limit,
      attributes: ['role', 'content', 'created_at']
    });

    return messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  } catch (error) {
    logger.error('Error fetching conversation history:', error);
    return [];
  }
}

/**
 * Get conversations for a shop with filters
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

    const conversations = await Conversation.findAll({
      where,
      include: [{
        model: Message,
        as: 'messages',
        limit: 1,
        order: [['created_at', 'DESC']],
        attributes: ['content', 'created_at', 'role']
      }],
      order: [['last_message_at', 'DESC']],
      limit: filters.limit || 50,
      offset: filters.offset || 0
    });

    return conversations;
  } catch (error) {
    logger.error('Error fetching shop conversations:', error);
    return [];
  }
}

/**
 * Get conversation analytics
 */
async function getConversationAnalytics(shopId, dateRange = {}) {
  try {
    const where = { shopId };

    if (dateRange.startDate && dateRange.endDate) {
      where.createdAt = {
        [require('sequelize').Op.between]: [dateRange.startDate, dateRange.endDate]
      };
    }

    const conversations = await Conversation.findAll({
      where,
      include: [{
        model: Message,
        as: 'messages'
      }]
    });

    // Calculate analytics
    const total = conversations.length;
    const escalated = conversations.filter(c => c.escalated).length;
    const resolved = conversations.filter(c => c.status === 'resolved').length;
    
    const totalMessages = conversations.reduce((sum, c) => sum + c.messageCount, 0);
    const avgMessagesPerConvo = total > 0 ? (totalMessages / total).toFixed(2) : 0;

    const avgResponseTime = conversations.reduce((sum, c) => {
      const messages = c.messages || [];
      const assistantMessages = messages.filter(m => m.role === 'assistant');
      const totalTime = assistantMessages.reduce((s, m) => s + (m.responseTime || 0), 0);
      return sum + totalTime;
    }, 0) / Math.max(totalMessages, 1);

    return {
      totalConversations: total,
      escalatedConversations: escalated,
      resolvedConversations: resolved,
      activeConversations: total - resolved,
      escalationRate: total > 0 ? ((escalated / total) * 100).toFixed(2) : 0,
      resolutionRate: total > 0 ? ((resolved / total) * 100).toFixed(2) : 0,
      avgMessagesPerConversation: avgMessagesPerConvo,
      avgResponseTime: Math.round(avgResponseTime)
    };
  } catch (error) {
    logger.error('Error calculating analytics:', error);
    throw error;
  }
}

/**
 * Close inactive conversations
 */
async function closeInactiveConversations(hoursInactive = 24) {
  try {
    const cutoffTime = new Date(Date.now() - (hoursInactive * 60 * 60 * 1000));
    
    const { Op } = require('sequelize');
    const result = await Conversation.update(
      { status: 'closed' },
      {
        where: {
          status: 'active',
          lastMessageAt: {
            [Op.lt]: cutoffTime
          }
        }
      }
    );

    logger.info(`Closed ${result[0]} inactive conversations`);
    return result[0];
  } catch (error) {
    logger.error('Error closing inactive conversations:', error);
    return 0;
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
  closeInactiveConversations
};

