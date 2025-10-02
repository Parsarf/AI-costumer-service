const request = require('supertest');
const app = require('../../server');
const crypto = require('crypto');
const { prisma, testUtils } = require('../setup');

// Helper function to generate HMAC signature
function generateHmac(body, secret) {
  return crypto.createHmac('sha256', secret).update(JSON.stringify(body), 'utf8').digest('base64');
}

describe('Webhooks API', () => {
  beforeEach(async () => {
    await testUtils.cleanDatabase();
    await testUtils.seedTestData();
  });

  describe('POST /webhooks/app/uninstalled', () => {
    it('should handle app uninstalled webhook', async () => {
      const body = {
        shop_domain: 'test-shop.myshopify.com',
        id: 123456789
      };
      const hmac = generateHmac(body, process.env.SHOPIFY_API_SECRET || 'test_secret');

      const response = await testUtils.makeRequest(app, 'POST', '/webhooks/app/uninstalled', body, {
        'X-Shopify-Hmac-Sha256': hmac,
        'X-Shopify-Shop-Domain': 'test-shop.myshopify.com'
      });

      expect(response.status).toBe(200);
      expect(response.text).toBe('OK');

      // Check that shop was marked as inactive
      const shop = await prisma.shop.findUnique({
        where: { shop: 'test-shop.myshopify.com' }
      });
      expect(shop.isActive).toBe(false);
    });

    it('should reject invalid HMAC', async () => {
      const body = {
        shop_domain: 'test-shop.myshopify.com',
        id: 123456789
      };

      const response = await testUtils.makeRequest(app, 'POST', '/webhooks/app/uninstalled', body, {
        'X-Shopify-Hmac-Sha256': 'invalid_hmac',
        'X-Shopify-Shop-Domain': 'test-shop.myshopify.com'
      });

      expect(response.status).toBe(401);
    });

    it('should require HMAC header', async () => {
      const body = {
        shop_domain: 'test-shop.myshopify.com',
        id: 123456789
      };

      const response = await testUtils.makeRequest(app, 'POST', '/webhooks/app/uninstalled', body);

      expect(response.status).toBe(401);
    });
  });

  describe('POST /webhooks/customers/data_request', () => {
    it('should handle customer data request webhook', async () => {
      const body = {
        shop_domain: 'test-shop.myshopify.com',
        customer: {
          id: 123456,
          email: 'customer@test.com',
          phone: '555-123-4567'
        },
        orders_requested: [12345, 67890]
      };
      const hmac = generateHmac(body, process.env.SHOPIFY_API_SECRET || 'test_secret');

      const response = await testUtils.makeRequest(app, 'POST', '/webhooks/customers/data_request', body, {
        'X-Shopify-Hmac-Sha256': hmac,
        'X-Shopify-Shop-Domain': 'test-shop.myshopify.com'
      });

      expect(response.status).toBe(200);
      expect(response.text).toBe('OK');
    });

    it('should reject invalid HMAC', async () => {
      const body = {
        shop_domain: 'test-shop.myshopify.com',
        customer: {
          id: 123456,
          email: 'customer@test.com'
        }
      };

      const response = await testUtils.makeRequest(app, 'POST', '/webhooks/customers/data_request', body, {
        'X-Shopify-Hmac-Sha256': 'invalid_hmac'
      });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /webhooks/customers/redact', () => {
    it('should handle customer redact webhook', async () => {
      // Create test data to be deleted
      await testUtils.createTestConversation({
        shop: 'test-shop.myshopify.com',
        userId: '123456',
        customerEmail: 'customer@test.com'
      });

      const body = {
        shop_domain: 'test-shop.myshopify.com',
        customer: {
          id: 123456,
          email: 'customer@test.com',
          phone: '555-123-4567'
        },
        orders_to_redact: [12345, 67890]
      };
      const hmac = generateHmac(body, process.env.SHOPIFY_API_SECRET || 'test_secret');

      const response = await testUtils.makeRequest(app, 'POST', '/webhooks/customers/redact', body, {
        'X-Shopify-Hmac-Sha256': hmac,
        'X-Shopify-Shop-Domain': 'test-shop.myshopify.com'
      });

      expect(response.status).toBe(200);
      expect(response.text).toBe('OK');

      // Check that customer data was deleted
      const conversations = await prisma.conversation.findMany({
        where: {
          shop: 'test-shop.myshopify.com',
          userId: '123456'
        }
      });
      expect(conversations).toHaveLength(0);
    });

    it('should reject invalid HMAC', async () => {
      const body = {
        shop_domain: 'test-shop.myshopify.com',
        customer: {
          id: 123456,
          email: 'customer@test.com'
        }
      };

      const response = await testUtils.makeRequest(app, 'POST', '/webhooks/customers/redact', body, {
        'X-Shopify-Hmac-Sha256': 'invalid_hmac'
      });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /webhooks/shop/redact', () => {
    it('should handle shop redact webhook', async () => {
      // Create test data to be deleted
      await testUtils.createTestConversation({
        shop: 'test-shop.myshopify.com'
      });

      const body = {
        shop_domain: 'test-shop.myshopify.com',
        shop_id: 987654321
      };
      const hmac = generateHmac(body, process.env.SHOPIFY_API_SECRET || 'test_secret');

      const response = await testUtils.makeRequest(app, 'POST', '/webhooks/shop/redact', body, {
        'X-Shopify-Hmac-Sha256': hmac
      });

      expect(response.status).toBe(200);
      expect(response.text).toBe('OK');

      // Check that shop data was deleted
      const conversations = await prisma.conversation.findMany({
        where: { shop: 'test-shop.myshopify.com' }
      });
      expect(conversations).toHaveLength(0);

      const shops = await prisma.shop.findMany({
        where: { shop: 'test-shop.myshopify.com' }
      });
      expect(shops).toHaveLength(0);
    });

    it('should reject invalid HMAC', async () => {
      const body = {
        shop_domain: 'test-shop.myshopify.com',
        shop_id: 987654321
      };

      const response = await testUtils.makeRequest(app, 'POST', '/webhooks/shop/redact', body, {
        'X-Shopify-Hmac-Sha256': 'invalid_hmac'
      });

      expect(response.status).toBe(401);
    });
  });

  describe('Rate Limiting', () => {
    it('should respect webhook rate limits', async () => {
      const body = {
        shop_domain: 'test-shop.myshopify.com',
        id: 123456789
      };
      const hmac = generateHmac(body, process.env.SHOPIFY_API_SECRET || 'test_secret');

      // Make multiple webhook requests quickly
      const promises = Array(65).fill().map(() => 
        testUtils.makeRequest(app, 'POST', '/webhooks/app/uninstalled', body, {
          'X-Shopify-Hmac-Sha256': hmac,
          'X-Shopify-Shop-Domain': 'test-shop.myshopify.com'
        })
      );

      const responses = await Promise.all(promises);
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });
});
