const request = require('supertest');
const app = require('../../server');
const { prisma, testUtils } = require('../setup');

describe('Billing API', () => {
  beforeEach(async () => {
    await testUtils.cleanDatabase();
    await testUtils.seedTestData();
  });

  describe('POST /billing/create', () => {
    it('should create a subscription', async () => {
      const response = await testUtils.makeRequest(app, 'POST', '/billing/create?shop=test-shop.myshopify.com&plan=starter');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('confirmationUrl');
      expect(response.body).toHaveProperty('subscription');
      expect(response.body.hasActiveSubscription).toBe(false);
    });

    it('should require shop parameter', async () => {
      const response = await testUtils.makeRequest(app, 'POST', '/billing/create');

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing shop parameter');
    });

    it('should validate plan parameter', async () => {
      const response = await testUtils.makeRequest(app, 'POST', '/billing/create?shop=test-shop.myshopify.com&plan=invalid');

      expect(response.status).toBe(500);
      expect(response.body.error).toContain('Failed to create subscription');
    });

    it('should handle missing shop in database', async () => {
      const response = await testUtils.makeRequest(app, 'POST', '/billing/create?shop=nonexistent.myshopify.com');

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('Store not found');
    });
  });

  describe('GET /billing/callback', () => {
    it('should handle billing callback', async () => {
      const response = await testUtils.makeRequest(app, 'GET', '/billing/callback?shop=test-shop.myshopify.com');

      expect(response.status).toBe(302); // Redirect
      expect(response.headers.location).toContain('/app?shop=test-shop.myshopify.com');
    });

    it('should require shop parameter', async () => {
      const response = await testUtils.makeRequest(app, 'GET', '/billing/callback');

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing shop parameter');
    });

    it('should handle missing shop in database', async () => {
      const response = await testUtils.makeRequest(app, 'GET', '/billing/callback?shop=nonexistent.myshopify.com');

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('Store not found');
    });
  });

  describe('POST /billing/cancel', () => {
    it('should cancel subscription', async () => {
      // Create a billing subscription
      await prisma.billingSubscription.create({
        data: {
          shopId: 'test-shop.myshopify.com',
          subscriptionId: 'sub_123456',
          name: 'Test Subscription',
          status: 'ACTIVE',
          price: 19.99
        }
      });

      const response = await testUtils.makeRequest(app, 'POST', '/billing/cancel?shop=test-shop.myshopify.com');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should require shop parameter', async () => {
      const response = await testUtils.makeRequest(app, 'POST', '/billing/cancel');

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing shop parameter');
    });

    it('should handle missing subscription', async () => {
      const response = await testUtils.makeRequest(app, 'POST', '/billing/cancel?shop=test-shop.myshopify.com');

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('No subscription found');
    });
  });

  describe('GET /billing/status', () => {
    it('should get billing status', async () => {
      const response = await testUtils.makeRequest(app, 'GET', '/billing/status?shop=test-shop.myshopify.com');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('hasAccess');
      expect(response.body).toHaveProperty('plan');
      expect(response.body).toHaveProperty('status');
    });

    it('should require shop parameter', async () => {
      const response = await testUtils.makeRequest(app, 'GET', '/billing/status');

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing shop parameter');
    });

    it('should handle missing shop', async () => {
      const response = await testUtils.makeRequest(app, 'GET', '/billing/status?shop=nonexistent.myshopify.com');

      expect(response.status).toBe(200);
      expect(response.body.hasAccess).toBe(false);
      expect(response.body.message).toContain('Shop not found');
    });
  });

  describe('Rate Limiting', () => {
    it('should respect billing rate limits', async () => {
      // Make multiple billing requests quickly
      const promises = Array(5).fill().map(() => 
        testUtils.makeRequest(app, 'POST', '/billing/create?shop=test-shop.myshopify.com')
      );

      const responses = await Promise.all(promises);
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });
});
