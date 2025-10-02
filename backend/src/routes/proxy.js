const express = require('express');
const verifyAppProxy = require('../middleware/verifyProxy');
const { shopify } = require('../lib/shopify');
const prisma = require('../lib/prisma');
const { buildSystemPrompt, sendMessage, formatMessages } = require('../services/claudeService');
const { checkBillingStatus } = require('../services/billingService');
const logger = require('../utils/logger');

const router = express.Router();

// App proxy route for storefront chat
router.post('/chat', verifyAppProxy, async (req, res) => {
  try {
    const { message, conversationId } = req.body;
    const shop = req.query.shop;

    if (!shop || !message) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Check billing status
    const billingStatus = await checkBillingStatus(shop);
    if (!billingStatus.hasAccess) {
      return res.status(403).json({ 
        error: 'Subscription required',
        message: 'Please upgrade your plan to use the AI support bot.'
      });
    }

    // Get shop settings
    const shopData = await prisma.shop.findUnique({
      where: { shop }
    });

    if (!shopData) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    // Get or create conversation
    let conversation;
    if (conversationId) {
      conversation = await prisma.conversation.findUnique({
        where: { id: conversationId }
      });
    }

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          shop: shop,
          prompt: message,
          shopId: shopData.id
        }
      });
    }

    // Get conversation history
    const history = await prisma.conversation.findMany({
      where: { 
        shop: shop,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      orderBy: { createdAt: 'asc' },
      take: 10
    });

    // Build system prompt
    const systemPrompt = buildSystemPrompt(shopData.settings || {});

    // Format messages for Claude
    const messages = formatMessages([
      ...history.map(h => ({ role: 'user', content: h.prompt })),
      ...history.filter(h => h.reply).map(h => ({ role: 'assistant', content: h.reply })),
      { role: 'user', content: message }
    ]);

    // Get Claude response
    const claudeResponse = await sendMessage(messages, systemPrompt);

    // Save conversation
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { reply: claudeResponse.content }
    });

    res.json({
      reply: claudeResponse.content,
      conversationId: conversation.id,
      usage: claudeResponse.usage
    });

  } catch (error) {
    logger.error('Proxy chat error:', error);
    res.status(500).json({ 
      error: 'Failed to process message',
      reply: "I'm sorry, I'm having trouble processing your message right now. Please try again in a moment."
    });
  }
});

module.exports = router;
