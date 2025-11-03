const prisma = require('../lib/prisma');
const { getOrCreateConversation, saveMessage, getConversationHistory } = require('../services/conversationService');
const { buildSystemPrompt, sendMessage, formatMessages } = require('../services/openaiService');
const { fetchOrderInfo, fetchProductInfo } = require('../services/shopifyService');
const { checkEscalation, analyzeEscalationNeed, notifyEscalation, getEscalationMessage } = require('../services/escalationService');
const { extractOrderNumber, extractProductQuery, detectIntent } = require('../utils/orderParser');
const { buildGreetingMessage } = require('../utils/promptBuilder');
const { isValidShopDomain } = require('../utils/shopValidation');
const logger = require('../utils/logger');

/**
 * Handle chat message
 * POST /api/chat
 */
async function handleChatMessage(req, res) {
  const startTime = Date.now();
  
  try {
    const { message, conversationId, shop, customerEmail, customerName } = req.body;

    // Validation
    if (!message || !shop) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!isValidShopDomain(shop)) {
      logger.warn('Invalid shop domain format', { shop });
      return res.status(400).json({ error: 'Invalid shop domain format' });
    }

    logger.info('Processing chat message', { shop, conversationId, messageLength: message.length });

    // Find store
    const store = await prisma.shop.findFirst({
      where: { shop, isActive: true }
    });
    
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    // Check if store can send messages (subscription limits)
    if (store.conversationCount >= store.conversationLimit) {
      return res.status(403).json({ 
        error: 'Conversation limit reached',
        message: 'Your conversation limit has been reached. Please upgrade your plan.'
      });
    }

    // Get or create conversation
    const conversation = await getOrCreateConversation(
      conversationId,
      store.id,
      { email: customerEmail, name: customerName }
    );

    // Save user message
    await saveMessage(conversation.id, 'user', message);

    // Detect intent and extract entities
    const intent = detectIntent(message);
    const orderNumber = extractOrderNumber(message);
    const productQuery = extractProductQuery(message);

    logger.info('Message analysis', { intent, orderNumber, productQuery });

    // Fetch relevant data
    let orderData = null;
    let productData = null;

    if (orderNumber) {
      orderData = await fetchOrderInfo(store.shop, store.accessToken, orderNumber);
      if (orderData) {
        logger.info('Order found', { orderNumber, orderId: orderData.id });
        // Save order number to conversation metadata
        const updatedMetadata = {
          ...conversation.metadata,
          orderNumber,
          orderId: orderData.id
        };
        await prisma.conversation.update({
          where: { id: conversation.id },
          data: { metadata: updatedMetadata }
        });
      }
    }

    if (productQuery) {
      productData = await fetchProductInfo(store.shop, store.accessToken, productQuery);
      logger.info('Products found', { count: productData?.length || 0 });
    }

    // Build system prompt with context
    const systemPrompt = buildSystemPrompt(
      {
        storeName: store.storeName,
        ...store.settings
      },
      orderData,
      productData
    );

    // Get conversation history
    const history = await getConversationHistory(conversation.id);

    // Format messages for OpenAI
    const aiMessages = formatMessages([
      ...history,
      { role: 'user', content: message }
    ]);

    // Get response from OpenAI
    const aiResponse = await sendMessage(aiMessages, systemPrompt);

    // Check for escalation triggers
    const needsEscalation = checkEscalation(message, aiResponse.content);
    const escalationAnalysis = analyzeEscalationNeed(conversation, message);

    let finalResponse = aiResponse.content;
    let escalated = false;

    if (needsEscalation || escalationAnalysis.shouldEscalate) {
      escalated = true;
      const reason = escalationAnalysis.reasons.join('; ') || 'User request or sensitive topic';

      // Update conversation to escalated status
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          escalated: true,
          escalationReason: reason,
          status: 'escalated'
        }
      });

      // Notify support team (async)
      notifyEscalation(conversation, store, reason).catch(err =>
        logger.error('Failed to send escalation notification:', err)
      );

      // Add escalation message
      finalResponse += '\n\n' + getEscalationMessage(store.storeName, conversation.customerEmail);

      logger.info('Conversation escalated', {
        conversationId: conversation.id,
        reason
      });
    }

    // Save assistant message
    await saveMessage(conversation.id, 'assistant', finalResponse, {
      tokens: aiResponse.usage.output_tokens,
      responseTime: aiResponse.responseTime,
      model: aiResponse.model,
      orderData: orderData ? { orderNumber: orderData.name } : null,
      escalated
    });

    // Increment conversation count if this is a new conversation
    if (!conversationId || conversation.messageCount <= 2) {
      // Increment conversation count
      await prisma.shop.update({
        where: { id: store.id },
        data: { conversationCount: { increment: 1 } }
      });
    }

    const totalTime = Date.now() - startTime;

    logger.info('Chat response sent', {
      conversationId: conversation.id,
      responseTime: totalTime,
      escalated
    });

    // Send response
    res.json({
      reply: finalResponse,
      conversationId: conversation.id,
      needsEscalation: escalated,
      metadata: {
        orderData: orderData ? {
          orderNumber: orderData.name,
          status: orderData.fulfillment_status || 'Processing',
          total: orderData.total_price
        } : null,
        intent,
        responseTime: totalTime
      }
    });

  } catch (error) {
    logger.error('Error handling chat message:', error);
    
    res.status(500).json({
      error: 'Failed to process message',
      reply: "I'm sorry, I'm having trouble processing your message right now. Please try again in a moment, or contact our support team directly."
    });
  }
}

/**
 * Get conversation by ID
 * GET /api/chat/conversation/:conversationId
 */
async function getConversation(req, res) {
  try {
    const { conversationId } = req.params;
    const { shop } = req.query;

    if (!shop) {
      return res.status(400).json({ error: 'Missing shop parameter' });
    }

    if (!isValidShopDomain(shop)) {
      logger.warn('Invalid shop domain format', { shop });
      return res.status(400).json({ error: 'Invalid shop domain format' });
    }

    const store = await prisma.shop.findUnique({ where: { shop } });
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const conversationService = require('../services/conversationService');
    const conversation = await conversationService.getConversation(conversationId, true);

    if (!conversation || conversation.shopId !== store.id) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json({
      id: conversation.id,
      status: conversation.status,
      escalated: conversation.escalated,
      customerEmail: conversation.customerEmail,
      messages: conversation.messages,
      createdAt: conversation.createdAt
    });

  } catch (error) {
    logger.error('Error getting conversation:', error);
    res.status(500).json({ error: 'Failed to get conversation' });
  }
}

/**
 * Get welcome message
 * GET /api/chat/welcome?shop=example.myshopify.com
 */
async function getWelcomeMessage(req, res) {
  try {
    const { shop, customerName } = req.query;

    if (!shop) {
      return res.status(400).json({ error: 'Missing shop parameter' });
    }

    if (!isValidShopDomain(shop)) {
      logger.warn('Invalid shop domain format', { shop });
      return res.status(400).json({ error: 'Invalid shop domain format' });
    }

    const store = await prisma.shop.findFirst({
      where: { shop, isActive: true }
    });
    
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const welcomeMsg = buildGreetingMessage(
      {
        storeName: store.storeName,
        ...store.settings
      },
      customerName
    );

    res.json({
      message: welcomeMsg,
      theme: store.settings?.theme || {}
    });

  } catch (error) {
    logger.error('Error getting welcome message:', error);
    res.status(500).json({ error: 'Failed to get welcome message' });
  }
}

module.exports = {
  handleChatMessage,
  getConversation,
  getWelcomeMessage
};

