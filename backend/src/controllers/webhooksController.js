const Store = require('../models/Store');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { uninstallScriptTag } = require('../services/shopifyService');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

/**
 * Handle app uninstalled webhook
 * POST /webhooks/app/uninstalled
 */
async function handleAppUninstalled(req, res) {
  try {
    const shop = req.get('X-Shopify-Shop-Domain');
    
    logger.info('App uninstalled webhook received', { shop });

    if (!shop) {
      return res.status(400).json({ error: 'Missing shop domain' });
    }

    // Find store
    const store = await Store.findOne({ where: { shop } });

    if (!store) {
      logger.warn('Store not found for uninstall webhook', { shop });
      return res.status(200).json({ message: 'Store not found' });
    }

    // Mark store as inactive
    store.active = false;
    store.subscriptionStatus = 'cancelled';
    await store.save();

    // Remove script tag (if possible)
    if (store.accessToken) {
      await uninstallScriptTag(shop, store.accessToken).catch(err =>
        logger.error('Failed to remove script tag:', err)
      );
    }

    logger.info('Store marked as inactive', { shop, storeId: store.id });

    res.status(200).json({ message: 'Uninstall processed successfully' });
  } catch (error) {
    logger.error('Error handling app uninstalled webhook:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
}

/**
 * Handle customers/data_request webhook (GDPR)
 * POST /webhooks/customers/data_request
 */
async function handleCustomerDataRequest(req, res) {
  try {
    const shop = req.get('X-Shopify-Shop-Domain');
    const { customer } = req.body;

    logger.info('Customer data request received', { 
      shop, 
      customerEmail: customer?.email 
    });

    if (!customer || !customer.email) {
      return res.status(400).json({ error: 'Missing customer data' });
    }

    // Find store
    const store = await Store.findOne({ where: { shop } });
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    // Find all conversations for this customer
    const conversations = await Conversation.findAll({
      where: {
        shopId: store.id,
        customerEmail: customer.email
      },
      include: [{
        model: Message,
        as: 'messages'
      }]
    });

    // Compile customer data
    const customerData = {
      shop,
      customer: {
        email: customer.email,
        name: customer.first_name + ' ' + customer.last_name
      },
      conversations: conversations.map(conv => ({
        id: conv.id,
        createdAt: conv.createdAt,
        status: conv.status,
        escalated: conv.escalated,
        messages: conv.messages.map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.createdAt
        }))
      })),
      totalConversations: conversations.length,
      totalMessages: conversations.reduce((sum, conv) => sum + conv.messageCount, 0)
    };

    logger.info('Customer data compiled', { 
      shop, 
      customerEmail: customer.email,
      conversationCount: conversations.length
    });

    // In production, you would:
    // 1. Store this data securely
    // 2. Send it to the customer or make it available for download
    // 3. Notify Shopify that the request has been processed

    res.status(200).json({
      message: 'Data request processed',
      data: customerData
    });
  } catch (error) {
    logger.error('Error handling customer data request:', error);
    res.status(500).json({ error: 'Failed to process data request' });
  }
}

/**
 * Handle customers/redact webhook (GDPR)
 * POST /webhooks/customers/redact
 */
async function handleCustomerRedact(req, res) {
  try {
    const shop = req.get('X-Shopify-Shop-Domain');
    const { customer } = req.body;

    logger.info('Customer redact request received', { 
      shop, 
      customerEmail: customer?.email 
    });

    if (!customer || !customer.email) {
      return res.status(400).json({ error: 'Missing customer data' });
    }

    // Find store
    const store = await Store.findOne({ where: { shop } });
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    // Find all conversations for this customer
    const conversations = await Conversation.findAll({
      where: {
        shopId: store.id,
        customerEmail: customer.email
      }
    });

    // Delete all messages for these conversations
    for (const conversation of conversations) {
      await Message.destroy({
        where: { conversationId: conversation.id }
      });
    }

    // Delete conversations
    await Conversation.destroy({
      where: {
        shopId: store.id,
        customerEmail: customer.email
      }
    });

    logger.info('Customer data redacted', { 
      shop, 
      customerEmail: customer.email,
      conversationsDeleted: conversations.length
    });

    res.status(200).json({ 
      message: 'Customer data redacted successfully',
      deletedConversations: conversations.length
    });
  } catch (error) {
    logger.error('Error handling customer redact:', error);
    res.status(500).json({ error: 'Failed to redact customer data' });
  }
}

/**
 * Handle shop/redact webhook (GDPR)
 * POST /webhooks/shop/redact
 */
async function handleShopRedact(req, res) {
  try {
    const shop = req.get('X-Shopify-Shop-Domain') || req.body.shop_domain;

    logger.info('Shop redact request received', { shop });

    if (!shop) {
      return res.status(400).json({ error: 'Missing shop domain' });
    }

    // Find store
    const store = await Store.findOne({ where: { shop } });
    if (!store) {
      logger.warn('Store not found for shop redact', { shop });
      return res.status(200).json({ message: 'Store not found' });
    }

    // Find all conversations
    const conversations = await Conversation.findAll({
      where: { shopId: store.id }
    });

    // Delete all messages
    for (const conversation of conversations) {
      await Message.destroy({
        where: { conversationId: conversation.id }
      });
    }

    // Delete all conversations
    await Conversation.destroy({
      where: { shopId: store.id }
    });

    // Delete store
    await store.destroy();

    logger.info('Shop data redacted completely', { 
      shop,
      conversationsDeleted: conversations.length
    });

    res.status(200).json({ 
      message: 'Shop data redacted successfully',
      deletedConversations: conversations.length
    });
  } catch (error) {
    logger.error('Error handling shop redact:', error);
    res.status(500).json({ error: 'Failed to redact shop data' });
  }
}

/**
 * Handle subscription updated webhook
 * POST /webhooks/subscription/updated
 */
async function handleSubscriptionUpdated(req, res) {
  try {
    const shop = req.get('X-Shopify-Shop-Domain');
    const { status, plan_name } = req.body;

    logger.info('Subscription updated webhook received', { shop, status, plan_name });

    const store = await Store.findOne({ where: { shop } });
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    // Update subscription status
    store.subscriptionStatus = status === 'active' ? 'active' : 'cancelled';
    
    // Update tier based on plan name
    if (plan_name) {
      const tierMap = {
        'starter': 'starter',
        'pro': 'pro',
        'scale': 'scale'
      };
      
      const tier = Object.keys(tierMap).find(key => 
        plan_name.toLowerCase().includes(key)
      );
      
      if (tier) {
        store.subscriptionTier = tier;
        
        // Update conversation limit
        const limits = { starter: 1000, pro: 5000, scale: 999999 };
        store.conversationLimit = limits[tier];
      }
    }

    await store.save();

    logger.info('Subscription updated', { 
      shop, 
      tier: store.subscriptionTier,
      status: store.subscriptionStatus
    });

    res.status(200).json({ message: 'Subscription updated' });
  } catch (error) {
    logger.error('Error handling subscription update:', error);
    res.status(500).json({ error: 'Failed to update subscription' });
  }
}

module.exports = {
  handleAppUninstalled,
  handleCustomerDataRequest,
  handleCustomerRedact,
  handleShopRedact,
  handleSubscriptionUpdated
};

