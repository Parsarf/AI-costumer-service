const express = require('express');
const { shopify } = require('../lib/shopify');
const prisma = require('../lib/prisma');
const { buildSystemPrompt, sendMessage, formatMessages } = require('../services/openaiService');
const { validateBilling } = require('../middleware/validateBilling');
const { chatLimiter } = require('../middleware/rateLimit');
const { validateInput } = require('../middleware/validateInput');
const logger = require('../utils/logger');

const router = express.Router();

// Chat endpoint for embedded app
router.post('/', chatLimiter, validateInput, validateBilling, async (req, res) => {
  try {
    const { message, conversationId } = req.body;
    const shop = req.query.shop;

    if (!shop || !message) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Get shop settings
    const shopData = await prisma.shop.findFirst({
      where: { shopifyDomain: shop }
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
          shopId: shopData.id,
          customerEmail: null,
          customerName: null
        }
      });

      // Create the first message
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: 'user',
          content: message
        }
      });
    }

    // Get conversation history from messages
    const messages = await prisma.message.findMany({
      where: { 
        conversationId: conversation.id
      },
      orderBy: { createdAt: 'asc' },
      take: 10
    });

    // Build system prompt
    const systemPrompt = buildSystemPrompt(shopData.settings || {});

    // Format messages for OpenAI
    const formattedMessages = formatMessages([
      ...messages.map(msg => ({ role: msg.role, content: msg.content }))
    ]);

    // Get OpenAI response
    const aiResponse = await sendMessage(formattedMessages, systemPrompt);

    // Save AI response as a message
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: aiResponse.content,
        aiModel: aiResponse.model,
        responseTime: aiResponse.responseTime,
        tokens: aiResponse.usage ? aiResponse.usage.input_tokens + aiResponse.usage.output_tokens : 0
      }
    });

    // Update conversation metadata
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { 
        messageCount: { increment: 1 },
        lastMessageAt: new Date()
      }
    });

    res.json({
      reply: aiResponse.content,
      conversationId: conversation.id,
      usage: aiResponse.usage
    });

  } catch (error) {
    logger.error('Chat error:', error);
    res.status(500).json({ 
      error: 'Failed to process message',
      reply: "I'm sorry, I'm having trouble processing your message right now. Please try again in a moment."
    });
  }
});

module.exports = router;