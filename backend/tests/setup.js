const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

// Test database setup
const testDatabaseUrl = process.env.TEST_DATABASE_URL || 'postgresql://postgres:password@localhost:5432/shopify_support_bot_test';

// Create test Prisma client
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: testDatabaseUrl
    }
  }
});

// Test data factories
const testData = {
  shop: {
    shop: 'test-shop.myshopify.com',
    accessToken: 'test_access_token',
    isActive: true,
    plan: 'free',
    settings: {
      storeName: 'Test Store',
      welcomeMessage: 'Hi! How can I help you today?',
      returnPolicy: '30 day returns',
      shippingPolicy: 'Ships in 1-2 days',
      supportEmail: 'support@teststore.com',
      botPersonality: 'friendly',
      primaryColor: '#4F46E5'
    }
  },
  conversation: {
    id: 'test_conv_123',
    shop: 'test-shop.myshopify.com',
    userId: '123456',
    customerEmail: 'customer@test.com',
    prompt: 'I need help with my order',
    reply: 'I\'d be happy to help you with your order!',
    metadata: {
      escalated: false,
      orderNumber: '1001'
    }
  },
  message: {
    id: 'test_msg_123',
    conversationId: 'test_conv_123',
    role: 'user',
    content: 'I need help with my order',
    timestamp: new Date()
  }
};

// Test utilities
const testUtils = {
  // Clean database before each test
  async cleanDatabase() {
    await prisma.message.deleteMany();
    await prisma.conversation.deleteMany();
    await prisma.billingSubscription.deleteMany();
    await prisma.shop.deleteMany();
  },

  // Seed test data
  async seedTestData() {
    await prisma.shop.create({
      data: testData.shop
    });
    
    await prisma.conversation.create({
      data: testData.conversation
    });
    
    await prisma.message.create({
      data: testData.message
    });
  },

  // Create test shop
  async createTestShop(overrides = {}) {
    return await prisma.shop.create({
      data: { ...testData.shop, ...overrides }
    });
  },

  // Create test conversation
  async createTestConversation(overrides = {}) {
    return await prisma.conversation.create({
      data: { ...testData.conversation, ...overrides }
    });
  },

  // Create test message
  async createTestMessage(overrides = {}) {
    return await prisma.message.create({
      data: { ...testData.message, ...overrides }
    });
  },

  // Mock Shopify API responses
  mockShopifyResponses: {
    shopInfo: {
      shop: {
        id: 123456,
        name: 'Test Store',
        domain: 'test-shop.myshopify.com',
        email: 'admin@teststore.com',
        currency: 'USD',
        timezone: 'UTC'
      }
    },
    products: {
      products: [
        {
          id: 123456789,
          title: 'Test Product',
          handle: 'test-product',
          price: '19.99',
          compare_at_price: '29.99',
          description: 'A great test product',
          vendor: 'Test Vendor',
          product_type: 'Test Type',
          tags: 'test, product, example',
          variants: [
            {
              id: 987654321,
              title: 'Default Title',
              price: '19.99',
              sku: 'TEST-001',
              inventory_quantity: 100
            }
          ]
        }
      ]
    },
    orders: {
      orders: [
        {
          id: 123456789,
          order_number: 1001,
          email: 'customer@test.com',
          total_price: '19.99',
          currency: 'USD',
          financial_status: 'paid',
          fulfillment_status: 'fulfilled',
          line_items: [
            {
              id: 987654321,
              title: 'Test Product',
              quantity: 1,
              price: '19.99'
            }
          ]
        }
      ]
    }
  },

  // Mock Claude API responses
  mockClaudeResponses: {
    success: {
      content: [
        {
          type: 'text',
          text: 'I\'d be happy to help you with your order! Please provide your order number and I\'ll look into it for you.'
        }
      ],
      usage: {
        input_tokens: 150,
        output_tokens: 75
      }
    },
    error: {
      error: {
        type: 'invalid_request_error',
        message: 'Invalid API key'
      }
    }
  },

  // Test HTTP requests
  async makeRequest(app, method, path, data = null, headers = {}) {
    const request = require('supertest')(app);
    let req = request[method.toLowerCase()](path);
    
    if (headers) {
      Object.entries(headers).forEach(([key, value]) => {
        req = req.set(key, value);
      });
    }
    
    if (data) {
      req = req.send(data);
    }
    
    return await req;
  },

  // Wait for async operations
  async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};

// Global test setup
beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = testDatabaseUrl;
  
  // Connect to test database
  await prisma.$connect();
  
  // Run migrations
  try {
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  } catch (error) {
    console.warn('Migration failed, continuing with tests:', error.message);
  }
});

// Global test teardown
afterAll(async () => {
  await prisma.$disconnect();
});

// Export for use in tests
module.exports = {
  prisma,
  testData,
  testUtils
};
