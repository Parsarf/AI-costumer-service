const prisma = require('../lib/prisma');
const logger = require('../utils/logger');
const { verifyWebhookAndExtractShop } = require('../utils/verifyWebhookHmac');

/**
 * Handle customer data request (GDPR)
 * Shopify requires immediate 200 response, then async processing
 */
async function handleCustomerDataRequest(req, res) {
  try {
    const { isValid, shop } = verifyWebhookAndExtractShop(req);
    
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }

    const { customer } = req.body;
    
    if (!customer || !customer.email) {
      logger.warn('Customer data request missing customer data', { shop });
      return res.status(400).json({ error: 'Missing customer data' });
    }

    logger.info('Customer data request received', { 
      shop, 
      customerEmail: customer.email,
      customerId: customer.id 
    });

    // IMMEDIATELY return 200 OK (Shopify requirement)
    res.status(200).json({ message: 'Data request received' });

    // Start ASYNC job to compile customer data
    setImmediate(async () => {
      try {
        // Find all conversations for this customer in this shop
        const conversations = await prisma.conversation.findMany({
          where: {
            shop: shop,
            userId: customer.id.toString()
          },
          include: {
            shop: {
              select: {
                settings: true
              }
            }
          }
        });

        // Compile customer data
        const customerData = {
          shop: shop,
          customer: {
            id: customer.id,
            email: customer.email,
            first_name: customer.first_name,
            last_name: customer.last_name
          },
          conversations: conversations.map(conv => ({
            id: conv.id,
            prompt: conv.prompt,
            reply: conv.reply,
            createdAt: conv.createdAt,
            metadata: conv.metadata
          })),
          totalConversations: conversations.length,
          requestDate: new Date().toISOString()
        };

        // In a real implementation, you would:
        // 1. Generate a downloadable report (PDF/JSON)
        // 2. Store it securely for the customer to download
        // 3. Email the report to the merchant's support email
        // 4. Or save to a secure dashboard for the merchant

        logger.info('Customer data compiled successfully', {
          shop,
          customerEmail: customer.email,
          conversationCount: conversations.length
        });

        // TODO: Implement actual data delivery mechanism
        // For now, just log the compiled data
        logger.info('Customer data compiled', { customerData });

      } catch (error) {
        logger.error('Error processing customer data request:', error);
      }
    });

  } catch (error) {
    logger.error('Customer data request handler error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Handle customer redact (GDPR)
 * Shopify requires immediate 200 response, then async processing
 */
async function handleCustomerRedact(req, res) {
  try {
    const { isValid, shop } = verifyWebhookAndExtractShop(req);
    
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }

    const { customer } = req.body;
    
    if (!customer || !customer.email) {
      logger.warn('Customer redact missing customer data', { shop });
      return res.status(400).json({ error: 'Missing customer data' });
    }

    logger.info('Customer redact request received', { 
      shop, 
      customerEmail: customer.email,
      customerId: customer.id 
    });

    // IMMEDIATELY return 200 OK (Shopify requirement)
    res.status(200).json({ message: 'Redact request received' });

    // Start ASYNC job to delete customer data
    setImmediate(async () => {
      try {
        // Delete ALL conversations for this customer from this shop
        const deletedConversations = await prisma.conversation.deleteMany({
          where: {
            shop: shop,
            userId: customer.id.toString()
          }
        });

        logger.info('Customer data redacted successfully', { 
          shop, 
          customerEmail: customer.email,
          deletedConversations: deletedConversations.count
        });

      } catch (error) {
        logger.error('Error processing customer redact:', error);
      }
    });

  } catch (error) {
    logger.error('Customer redact handler error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Handle shop redact (GDPR)
 * Shopify requires immediate 200 response, then async processing
 * Called 48 hours after app uninstall
 */
async function handleShopRedact(req, res) {
  try {
    const { isValid, shop } = verifyWebhookAndExtractShop(req);
    
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }

    const shopDomain = req.body.shop_domain || shop;
    
    if (!shopDomain) {
      logger.warn('Shop redact missing shop domain', { shop });
      return res.status(400).json({ error: 'Missing shop domain' });
    }

    logger.info('Shop redact request received', { 
      shop: shopDomain,
      shopId: req.body.shop_id 
    });

    // IMMEDIATELY return 200 OK (Shopify requirement)
    res.status(200).json({ message: 'Shop redact request received' });

    // Start ASYNC job to delete ALL shop data
    setImmediate(async () => {
      try {
        // Delete all shop data
        await prisma.$transaction(async (tx) => {
          // Delete all conversations for this shop
          const deletedConversations = await tx.conversation.deleteMany({
            where: { shop: shopDomain }
          });

          // Delete all sessions for this shop
          const deletedSessions = await tx.session.deleteMany({
            where: { shop: shopDomain }
          });

          // Delete billing subscriptions for this shop
          const deletedBilling = await tx.billingSubscription.deleteMany({
            where: { shopId: shopDomain }
          });

          // Delete the shop record
          const deletedShop = await tx.shop.deleteMany({
            where: { shop: shopDomain }
          });

          logger.info('Shop data redacted completely', { 
            shop: shopDomain,
            deletedConversations: deletedConversations.count,
            deletedSessions: deletedSessions.count,
            deletedBilling: deletedBilling.count,
            deletedShops: deletedShop.count
          });
        });

      } catch (error) {
        logger.error('Error processing shop redact:', error);
      }
    });

  } catch (error) {
    logger.error('Shop redact handler error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Handle app uninstalled webhook
 * Mark shop as inactive and schedule data deletion
 */
async function handleAppUninstalled(req, res) {
  try {
    const { isValid, shop } = verifyWebhookAndExtractShop(req);
    
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }

    logger.info('App uninstalled webhook received', { shop });

    // IMMEDIATELY return 200 OK (Shopify requirement)
    res.status(200).json({ message: 'App uninstall processed' });

    // Start ASYNC job to mark shop as inactive
    setImmediate(async () => {
      try {
        // Mark store as inactive (don't delete yet)
        await prisma.shop.updateMany({
          where: { shop: shop },
          data: { 
            isActive: false,
            updatedAt: new Date()
          }
        });

        logger.info('Shop marked as inactive', { shop });

        // Note: Shop data will be deleted by shop/redact webhook
        // which Shopify sends 48 hours after uninstall

      } catch (error) {
        logger.error('Error processing app uninstall:', error);
      }
    });

  } catch (error) {
    logger.error('App uninstalled handler error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  handleCustomerDataRequest,
  handleCustomerRedact,
  handleShopRedact,
  handleAppUninstalled
};