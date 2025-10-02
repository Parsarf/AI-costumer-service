const express = require('express');
const { 
  handleCustomerDataRequest,
  handleCustomerRedact,
  handleShopRedact,
  handleAppUninstalled
} = require('../controllers/webhooksController');
const logger = require('../utils/logger');

const router = express.Router();

// Only available in development mode
if (process.env.NODE_ENV !== 'development') {
  router.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
  });
  module.exports = router;
  return;
}

/**
 * Test customer data request webhook
 * GET /webhooks/test/customer-data-request?shop=test.myshopify.com&email=test@example.com
 */
router.get('/customer-data-request', async (req, res) => {
  try {
    const { shop, email = 'test@example.com', id = '123' } = req.query;
    
    if (!shop) {
      return res.status(400).json({ error: 'Missing shop parameter' });
    }

    logger.info('Testing customer data request webhook', { shop, email });

    // Simulate webhook request
    const mockReq = {
      get: (header) => {
        if (header === 'X-Shopify-Shop-Domain') return shop;
        return null;
      },
      body: {
        customer: {
          id: id,
          email: email,
          first_name: 'Test',
          last_name: 'Customer'
        }
      }
    };

    const mockRes = {
      status: (code) => ({
        json: (data) => {
          logger.info('Customer data request test response', { code, data });
          return res.json({ 
            message: 'Test completed', 
            statusCode: code, 
            response: data,
            shop,
            customer: { id, email }
          });
        }
      })
    };

    await handleCustomerDataRequest(mockReq, mockRes);

  } catch (error) {
    logger.error('Customer data request test error:', error);
    res.status(500).json({ error: 'Test failed', details: error.message });
  }
});

/**
 * Test customer redact webhook
 * GET /webhooks/test/customer-redact?shop=test.myshopify.com&email=test@example.com
 */
router.get('/customer-redact', async (req, res) => {
  try {
    const { shop, email = 'test@example.com', id = '123' } = req.query;
    
    if (!shop) {
      return res.status(400).json({ error: 'Missing shop parameter' });
    }

    logger.info('Testing customer redact webhook', { shop, email });

    // Simulate webhook request
    const mockReq = {
      get: (header) => {
        if (header === 'X-Shopify-Shop-Domain') return shop;
        return null;
      },
      body: {
        customer: {
          id: id,
          email: email,
          first_name: 'Test',
          last_name: 'Customer'
        }
      }
    };

    const mockRes = {
      status: (code) => ({
        json: (data) => {
          logger.info('Customer redact test response', { code, data });
          return res.json({ 
            message: 'Test completed', 
            statusCode: code, 
            response: data,
            shop,
            customer: { id, email }
          });
        }
      })
    };

    await handleCustomerRedact(mockReq, mockRes);

  } catch (error) {
    logger.error('Customer redact test error:', error);
    res.status(500).json({ error: 'Test failed', details: error.message });
  }
});

/**
 * Test shop redact webhook
 * GET /webhooks/test/shop-redact?shop=test.myshopify.com
 */
router.get('/shop-redact', async (req, res) => {
  try {
    const { shop } = req.query;
    
    if (!shop) {
      return res.status(400).json({ error: 'Missing shop parameter' });
    }

    logger.info('Testing shop redact webhook', { shop });

    // Simulate webhook request
    const mockReq = {
      get: (header) => {
        if (header === 'X-Shopify-Shop-Domain') return shop;
        return null;
      },
      body: {
        shop_domain: shop,
        shop_id: '123456'
      }
    };

    const mockRes = {
      status: (code) => ({
        json: (data) => {
          logger.info('Shop redact test response', { code, data });
          return res.json({ 
            message: 'Test completed', 
            statusCode: code, 
            response: data,
            shop
          });
        }
      })
    };

    await handleShopRedact(mockReq, mockRes);

  } catch (error) {
    logger.error('Shop redact test error:', error);
    res.status(500).json({ error: 'Test failed', details: error.message });
  }
});

/**
 * Test app uninstalled webhook
 * GET /webhooks/test/app-uninstalled?shop=test.myshopify.com
 */
router.get('/app-uninstalled', async (req, res) => {
  try {
    const { shop } = req.query;
    
    if (!shop) {
      return res.status(400).json({ error: 'Missing shop parameter' });
    }

    logger.info('Testing app uninstalled webhook', { shop });

    // Simulate webhook request
    const mockReq = {
      get: (header) => {
        if (header === 'X-Shopify-Shop-Domain') return shop;
        return null;
      },
      body: {}
    };

    const mockRes = {
      status: (code) => ({
        json: (data) => {
          logger.info('App uninstalled test response', { code, data });
          return res.json({ 
            message: 'Test completed', 
            statusCode: code, 
            response: data,
            shop
          });
        }
      })
    };

    await handleAppUninstalled(mockReq, mockRes);

  } catch (error) {
    logger.error('App uninstalled test error:', error);
    res.status(500).json({ error: 'Test failed', details: error.message });
  }
});

/**
 * Test all webhooks at once
 * GET /webhooks/test/all?shop=test.myshopify.com
 */
router.get('/all', async (req, res) => {
  try {
    const { shop } = req.query;
    
    if (!shop) {
      return res.status(400).json({ error: 'Missing shop parameter' });
    }

    logger.info('Testing all webhooks', { shop });

    const results = [];

    // Test customer data request
    try {
      const dataReq = await fetch(`${req.protocol}://${req.get('host')}/webhooks/test/customer-data-request?shop=${shop}`);
      const dataRes = await dataReq.json();
      results.push({ webhook: 'customer-data-request', status: 'success', response: dataRes });
    } catch (error) {
      results.push({ webhook: 'customer-data-request', status: 'error', error: error.message });
    }

    // Test customer redact
    try {
      const redactReq = await fetch(`${req.protocol}://${req.get('host')}/webhooks/test/customer-redact?shop=${shop}`);
      const redactRes = await redactReq.json();
      results.push({ webhook: 'customer-redact', status: 'success', response: redactRes });
    } catch (error) {
      results.push({ webhook: 'customer-redact', status: 'error', error: error.message });
    }

    // Test shop redact
    try {
      const shopReq = await fetch(`${req.protocol}://${req.get('host')}/webhooks/test/shop-redact?shop=${shop}`);
      const shopRes = await shopReq.json();
      results.push({ webhook: 'shop-redact', status: 'success', response: shopRes });
    } catch (error) {
      results.push({ webhook: 'shop-redact', status: 'error', error: error.message });
    }

    // Test app uninstalled
    try {
      const uninstallReq = await fetch(`${req.protocol}://${req.get('host')}/webhooks/test/app-uninstalled?shop=${shop}`);
      const uninstallRes = await uninstallReq.json();
      results.push({ webhook: 'app-uninstalled', status: 'success', response: uninstallRes });
    } catch (error) {
      results.push({ webhook: 'app-uninstalled', status: 'error', error: error.message });
    }

    res.json({
      message: 'All webhook tests completed',
      shop,
      results,
      summary: {
        total: results.length,
        successful: results.filter(r => r.status === 'success').length,
        failed: results.filter(r => r.status === 'error').length
      }
    });

  } catch (error) {
    logger.error('All webhooks test error:', error);
    res.status(500).json({ error: 'Test failed', details: error.message });
  }
});

module.exports = router;

