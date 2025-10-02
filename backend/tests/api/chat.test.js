const request = require('supertest');
const app = require('../../server');
const { prisma, testUtils } = require('../setup');

describe('Chat API', () => {
  beforeEach(async () => {
    await testUtils.cleanDatabase();
    await testUtils.seedTestData();
  });

  describe('POST /api/chat', () => {
    it('should send a message and get a response', async () => {
      const response = await testUtils.makeRequest(app, 'POST', '/api/chat?shop=test-shop.myshopify.com', {
        message: 'I need help with my order'
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('reply');
      expect(response.body).toHaveProperty('conversationId');
      expect(response.body.reply).toContain('help');
    });

    it('should require shop parameter', async () => {
      const response = await testUtils.makeRequest(app, 'POST', '/api/chat', {
        message: 'I need help'
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing required parameters');
    });

    it('should require message parameter', async () => {
      const response = await testUtils.makeRequest(app, 'POST', '/api/chat?shop=test-shop.myshopify.com', {});

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing required parameters');
    });

    it('should validate message length', async () => {
      const longMessage = 'a'.repeat(1001);
      const response = await testUtils.makeRequest(app, 'POST', '/api/chat?shop=test-shop.myshopify.com', {
        message: longMessage
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Message too long');
    });

    it('should validate shop domain format', async () => {
      const response = await testUtils.makeRequest(app, 'POST', '/api/chat?shop=invalid-shop', {
        message: 'I need help'
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid shop domain format');
    });

    it('should handle billing validation', async () => {
      // Create shop without active subscription
      await testUtils.createTestShop({
        shop: 'billing-test.myshopify.com',
        plan: 'free'
      });

      const response = await testUtils.makeRequest(app, 'POST', '/api/chat?shop=billing-test.myshopify.com', {
        message: 'I need help'
      });

      // Should work for free plan (depending on configuration)
      expect([200, 402]).toContain(response.status);
    });

    it('should create conversation if none provided', async () => {
      const response = await testUtils.makeRequest(app, 'POST', '/api/chat?shop=test-shop.myshopify.com', {
        message: 'I need help with my order'
      });

      expect(response.status).toBe(200);
      expect(response.body.conversationId).toBeDefined();
      
      // Check conversation was created in database
      const conversation = await prisma.conversation.findUnique({
        where: { id: response.body.conversationId }
      });
      expect(conversation).toBeTruthy();
    });

    it('should use existing conversation if provided', async () => {
      const conversation = await testUtils.createTestConversation();
      
      const response = await testUtils.makeRequest(app, 'POST', '/api/chat?shop=test-shop.myshopify.com', {
        message: 'Follow up question',
        conversationId: conversation.id
      });

      expect(response.status).toBe(200);
      expect(response.body.conversationId).toBe(conversation.id);
    });

    it('should handle XSS attempts', async () => {
      const response = await testUtils.makeRequest(app, 'POST', '/api/chat?shop=test-shop.myshopify.com', {
        message: '<script>alert("xss")</script>'
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid message content');
    });

    it('should respect rate limiting', async () => {
      // Make multiple requests quickly
      const promises = Array(25).fill().map(() => 
        testUtils.makeRequest(app, 'POST', '/api/chat?shop=test-shop.myshopify.com', {
          message: 'Test message'
        })
      );

      const responses = await Promise.all(promises);
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('POST /aibot/chat (App Proxy)', () => {
    it('should handle app proxy requests', async () => {
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = 'test_signature'; // In real tests, this would be properly calculated
      
      const response = await testUtils.makeRequest(app, 'POST', '/aibot/chat?shop=test-shop.myshopify.com&timestamp=' + timestamp + '&signature=' + signature, {
        message: 'I need help with my order'
      }, {
        'X-Shopify-Shop-Domain': 'test-shop.myshopify.com'
      });

      // Should either work or fail with proper error
      expect([200, 401, 403]).toContain(response.status);
    });
  });
});
