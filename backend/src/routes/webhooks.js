const express = require('express');
const verifyWebhook = require('../middleware/verifyWebhook');
const prisma = require('../lib/prisma');
const logger = require('../utils/logger');

const router = express.Router();

// App uninstalled webhook
router.post('/app_uninstalled', verifyWebhook, async (req, res) => {
  try {
    const shop = req.get('X-Shopify-Shop-Domain');
    
    if (!shop) {
      return res.status(400).json({ error: 'Missing shop domain' });
    }

    logger.info('App uninstalled webhook received', { shop });

    // Delete shop and all related data
    await prisma.shop.delete({
      where: { shop }
    });

    logger.info('Shop data deleted', { shop });
    res.status(200).json({ message: 'App uninstalled successfully' });

  } catch (error) {
    logger.error('App uninstalled webhook error:', error);
    res.status(500).json({ error: 'Failed to process uninstall' });
  }
});

// Customer data request (GDPR)
router.post('/customers/data_request', verifyWebhook, async (req, res) => {
  try {
    const { customer } = req.body;
    const shop = req.get('X-Shopify-Shop-Domain');

    logger.info('Customer data request received', { 
      shop, 
      customerEmail: customer?.email 
    });

    if (!customer || !customer.email) {
      return res.status(400).json({ error: 'Missing customer data' });
    }

    // Find conversations for this customer
    const conversations = await prisma.conversation.findMany({
      where: {
        shop: shop,
        userId: customer.id.toString()
      }
    });

    // In a real implementation, you would:
    // 1. Compile all customer data
    // 2. Store it securely for the customer to download
    // 3. Notify the customer via email

    logger.info('Customer data request processed', { 
      shop, 
      customerEmail: customer.email,
      conversationCount: conversations.length
    });

    res.status(200).json({ message: 'Data request processed' });

  } catch (error) {
    logger.error('Customer data request error:', error);
    res.status(500).json({ error: 'Failed to process data request' });
  }
});

// Customer redact (GDPR)
router.post('/customers/redact', verifyWebhook, async (req, res) => {
  try {
    const { customer } = req.body;
    const shop = req.get('X-Shopify-Shop-Domain');

    logger.info('Customer redact request received', { 
      shop, 
      customerEmail: customer?.email 
    });

    if (!customer || !customer.email) {
      return res.status(400).json({ error: 'Missing customer data' });
    }

    // Delete conversations for this customer
    const deletedConversations = await prisma.conversation.deleteMany({
      where: {
        shop: shop,
        userId: customer.id.toString()
      }
    });

    logger.info('Customer data redacted', { 
      shop, 
      customerEmail: customer.email,
      deletedConversations: deletedConversations.count
    });

    res.status(200).json({ 
      message: 'Customer data redacted successfully',
      deletedConversations: deletedConversations.count
    });

  } catch (error) {
    logger.error('Customer redact error:', error);
    res.status(500).json({ error: 'Failed to redact customer data' });
  }
});

// Shop redact (GDPR)
router.post('/shop/redact', verifyWebhook, async (req, res) => {
  try {
    const shop = req.get('X-Shopify-Shop-Domain') || req.body.shop_domain;

    logger.info('Shop redact request received', { shop });

    if (!shop) {
      return res.status(400).json({ error: 'Missing shop domain' });
    }

    // Delete all shop data
    await prisma.shop.delete({
      where: { shop }
    });

    logger.info('Shop data redacted completely', { shop });
    res.status(200).json({ message: 'Shop data redacted successfully' });

  } catch (error) {
    logger.error('Shop redact error:', error);
    res.status(500).json({ error: 'Failed to redact shop data' });
  }
});

module.exports = router;