// Jest setup file that runs before all tests
const { PrismaClient } = require('@prisma/client');
const { newDb } = require('pg-mem');

// Set test environment BEFORE any modules are loaded
process.env.NODE_ENV = 'test';

// Create in-memory database
const mem = newDb();

// Create Prisma-compatible connection
const { Pool } = mem.adapters.createPg();
const pool = new Pool();

// Initialize database schema
mem.public.none(`
  CREATE TABLE "stores" (
    "id" SERIAL PRIMARY KEY,
    "shop" TEXT UNIQUE NOT NULL,
    "accessToken" TEXT NOT NULL,
    "storeName" TEXT,
    "settings" JSONB,
    "active" BOOLEAN DEFAULT true,
    "isActive" BOOLEAN DEFAULT true,
    "plan" TEXT DEFAULT 'starter',
    "subscriptionTier" TEXT DEFAULT 'starter',
    "subscriptionStatus" TEXT DEFAULT 'trial',
    "chargeId" TEXT,
    "conversationCount" INTEGER DEFAULT 0,
    "conversationLimit" INTEGER DEFAULT 1000,
    "installedAt" TIMESTAMP DEFAULT NOW(),
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
  );

  CREATE TABLE "sessions" (
    "id" TEXT PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isOnline" BOOLEAN DEFAULT false,
    "expires" TIMESTAMP,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW(),
    "shopId" INTEGER NOT NULL REFERENCES "stores"("id") ON DELETE CASCADE
  );

  CREATE TABLE "conversations" (
    "id" TEXT PRIMARY KEY,
    "shopId" INTEGER NOT NULL REFERENCES "stores"("id") ON DELETE CASCADE,
    "customerEmail" TEXT,
    "customerName" TEXT,
    "customerId" TEXT,
    "status" TEXT DEFAULT 'active',
    "escalated" BOOLEAN DEFAULT false,
    "escalationReason" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "messageCount" INTEGER DEFAULT 0,
    "lastMessageAt" TIMESTAMP DEFAULT NOW(),
    "resolvedAt" TIMESTAMP,
    "sessionId" TEXT,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
  );

  CREATE TABLE "messages" (
    "id" SERIAL PRIMARY KEY,
    "conversationId" TEXT NOT NULL REFERENCES "conversations"("id") ON DELETE CASCADE,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB DEFAULT '{}',
    "tokens" INTEGER,
    "responseTime" INTEGER,
    "aiModel" TEXT,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
  );

  CREATE TABLE "billing_subscriptions" (
    "id" TEXT PRIMARY KEY,
    "shopId" INTEGER UNIQUE NOT NULL REFERENCES "stores"("id") ON DELETE CASCADE,
    "subscriptionId" TEXT UNIQUE NOT NULL,
    "planName" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT DEFAULT 'USD',
    "status" TEXT NOT NULL,
    "trialDays" INTEGER DEFAULT 7,
    "trialEndsAt" TIMESTAMP,
    "currentPeriodEnd" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
  );
`);

// Create Prisma client with adapter
const { PrismaPg } = require('@prisma/adapter-pg');
const adapter = new PrismaPg(pool);

const testPrisma = new PrismaClient({
  adapter
});

// Set global test prisma BEFORE any modules are loaded
globalThis.testPrisma = testPrisma;

// Suppress console warnings in tests
global.console.warn = jest.fn();
