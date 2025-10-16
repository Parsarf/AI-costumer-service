const express = require('express');
const verifyAppProxy = require('../middleware/verifyProxy');
const { validateBilling } = require('../middleware/validateBilling');
const { shopify } = require('../lib/shopify');
const prisma = require('../lib/prisma');
const { buildSystemPrompt, sendMessage, formatMessages } = require('../services/openaiService');
const logger = require('../utils/logger');

const router = express.Router();

// App proxy route for storefront chat
router.post('/chat', verifyAppProxy, validateBilling, async (req, res) => {
  try {
    const { message, conversationId } = req.body;
    const shop = req.query.shop;

    if (!shop || !message) {
      return res.status(400).json({ error: 'Missing required parameters' });
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

    // Get OpenAI response
    const aiResponse = await sendMessage(messages, systemPrompt);

    // Save conversation
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { reply: aiResponse.content }
    });

    res.json({
      reply: aiResponse.content,
      conversationId: conversation.id,
      usage: aiResponse.usage
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
