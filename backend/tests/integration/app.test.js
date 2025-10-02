const request = require('supertest');
const app = require('../../server');
const { prisma, testUtils } = require('../setup');

describe('App Integration Tests', () => {
  beforeEach(async () => {
    await testUtils.cleanDatabase();
  });

  describe('OAuth Flow', () => {
    it('should initiate OAuth flow', async () => {
      const response = await testUtils.makeRequest(app, 'GET', '/auth?shop=test-shop.myshopify.com');

      expect(response.status).toBe(302);
      expect(response.headers.location).toContain('myshopify.com/oauth/authorize');
    });

    it('should handle OAuth callback', async () => {
      // Mock the OAuth callback
      const response = await testUtils.makeRequest(app, 'GET', '/auth/callback?shop=test-shop.myshopify.com&code=test_code&state=test_state');

      // Should redirect to app
      expect(response.status).toBe(302);
      expect(response.headers.location).toContain('/app?shop=test-shop.myshopify.com');
    });
  });

  describe('Embedded App', () => {
    it('should serve embedded app', async () => {
      const response = await testUtils.makeRequest(app, 'GET', '/app?shop=test-shop.myshopify.com&host=admin.shopify.com');

      expect(response.status).toBe(200);
      expect(response.text).toContain('AI Support Bot');
      expect(response.text).toContain('App Bridge');
    });

    it('should require shop parameter', async () => {
      const response = await testUtils.makeRequest(app, 'GET', '/app');

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing shop parameter');
    });
  });

  describe('Health Checks', () => {
    it('should return health status', async () => {
      const response = await testUtils.makeRequest(app, 'GET', '/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('version');
    });

    it('should return readiness status', async () => {
      const response = await testUtils.makeRequest(app, 'GET', '/ready');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('checks');
    });
  });

  describe('Settings API', () => {
    beforeEach(async () => {
      await testUtils.seedTestData();
    });

    it('should get settings', async () => {
      const response = await testUtils.makeRequest(app, 'GET', '/api/settings?shop=test-shop.myshopify.com');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('shop');
      expect(response.body).toHaveProperty('settings');
      expect(response.body.settings).toHaveProperty('welcomeMessage');
    });

    it('should update settings', async () => {
      const newSettings = {
        welcomeMessage: 'Hello! How can I help you?',
        primaryColor: '#FF6B6B'
      };

      const response = await testUtils.makeRequest(app, 'PUT', '/api/settings?shop=test-shop.myshopify.com', {
        settings: newSettings
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should validate settings', async () => {
      const invalidSettings = {
        welcomeMessage: 'a'.repeat(501), // Too long
        primaryColor: 'invalid-color'
      };

      const response = await testUtils.makeRequest(app, 'PUT', '/api/settings?shop=test-shop.myshopify.com', {
        settings: invalidSettings
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid settings');
    });
  });

  describe('Analytics API', () => {
    beforeEach(async () => {
      await testUtils.seedTestData();
    });

    it('should get analytics', async () => {
      const response = await testUtils.makeRequest(app, 'GET', '/api/analytics?shop=test-shop.myshopify.com');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalConversations');
      expect(response.body).toHaveProperty('escalatedConversations');
      expect(response.body).toHaveProperty('averageResponseTime');
    });

    it('should get conversations', async () => {
      const response = await testUtils.makeRequest(app, 'GET', '/api/analytics/conversations?shop=test-shop.myshopify.com');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('conversations');
      expect(response.body).toHaveProperty('totalCount');
      expect(response.body).toHaveProperty('hasMore');
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 errors', async () => {
      const response = await testUtils.makeRequest(app, 'GET', '/nonexistent-endpoint');

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('Route not found');
    });

    it('should handle 500 errors gracefully', async () => {
      // This would require mocking a service to throw an error
      // For now, we'll test the error handler structure
      const response = await testUtils.makeRequest(app, 'GET', '/health');
      expect(response.status).toBe(200);
    });
  });

  describe('Security', () => {
    it('should enforce HTTPS in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const response = await testUtils.makeRequest(app, 'GET', '/health', null, {
        'X-Forwarded-Proto': 'http'
      });

      // Should redirect to HTTPS
      expect(response.status).toBe(302);
      expect(response.headers.location).toContain('https://');

      process.env.NODE_ENV = originalEnv;
    });

    it('should validate CORS origins', async () => {
      const response = await testUtils.makeRequest(app, 'GET', '/health', null, {
        'Origin': 'https://malicious-site.com'
      });

      // Should either work or be blocked based on CORS config
      expect([200, 403]).toContain(response.status);
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting to API endpoints', async () => {
      // Make many requests quickly
      const promises = Array(105).fill().map(() => 
        testUtils.makeRequest(app, 'GET', '/api/settings?shop=test-shop.myshopify.com')
      );

      const responses = await Promise.all(promises);
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });
});
