-- CreateTable
CREATE TABLE "stores" (
    "id" SERIAL PRIMARY KEY,
    "shop" TEXT NOT NULL UNIQUE,
    "access_token" TEXT NOT NULL,
    "store_name" TEXT,
    "settings" JSONB DEFAULT '{"welcomeMessage":"Hi! 👋 I''m here to help you with any questions about your order, returns, or our products. How can I assist you today?","returnPolicy":"We accept returns within 30 days of purchase. Items must be unworn and in original packaging.","shippingPolicy":"We ship within 1-2 business days. Domestic orders typically arrive in 3-5 business days.","supportEmail":"support@example.com","botPersonality":"friendly","chatbotEnabled":true,"theme":{"primaryColor":"#4F46E5","position":"bottom-right"}}'::jsonb,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "subscription_tier" TEXT NOT NULL DEFAULT 'starter',
    "subscription_status" TEXT NOT NULL DEFAULT 'trial',
    "charge_id" TEXT,
    "conversation_count" INTEGER NOT NULL DEFAULT 0,
    "conversation_limit" INTEGER NOT NULL DEFAULT 1000,
    "installed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "is_online" BOOLEAN NOT NULL DEFAULT false,
    "expires" TIMESTAMP(3),
    "data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "shop_id" INTEGER NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "shop_id" INTEGER NOT NULL,
    "customer_email" TEXT,
    "customer_name" TEXT,
    "customer_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "escalated" BOOLEAN NOT NULL DEFAULT false,
    "escalation_reason" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "message_count" INTEGER NOT NULL DEFAULT 0,
    "last_message_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),
    "session_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" SERIAL PRIMARY KEY,
    "conversation_id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "tokens" INTEGER,
    "response_time" INTEGER,
    "ai_model" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "billing_subscriptions" (
    "id" TEXT NOT NULL,
    "shop_id" INTEGER NOT NULL UNIQUE,
    "subscription_id" TEXT NOT NULL UNIQUE,
    "plan_name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL,
    "trial_days" INTEGER NOT NULL DEFAULT 7,
    "trial_ends_at" TIMESTAMP(3),
    "current_period_end" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "billing_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_stores_shop" ON "stores"("shop");
CREATE INDEX "idx_stores_active" ON "stores"("is_active");
CREATE INDEX "idx_stores_subscription_tier" ON "stores"("subscription_tier");

-- CreateIndex
CREATE INDEX "idx_conversations_shop_id" ON "conversations"("shop_id");
CREATE INDEX "idx_conversations_status" ON "conversations"("status");
CREATE INDEX "idx_conversations_escalated" ON "conversations"("escalated");
CREATE INDEX "idx_conversations_customer_email" ON "conversations"("customer_email");
CREATE INDEX "idx_conversations_created_at" ON "conversations"("created_at");
CREATE INDEX "idx_conversations_last_message_at" ON "conversations"("last_message_at");

-- CreateIndex
CREATE INDEX "idx_messages_conversation_id" ON "messages"("conversation_id");
CREATE INDEX "idx_messages_created_at" ON "messages"("created_at");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_subscriptions" ADD CONSTRAINT "billing_subscriptions_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
