const { createGraphQLClient, BILLING_CREATE_MUTATION, BILLING_QUERY } = require('../lib/shopify');
const prisma = require('../lib/prisma');
const logger = require('../utils/logger');

const createSubscription = async (session) => {
  try {
    const client = createGraphQLClient(session);
    
    const billingPrice = parseFloat(process.env.BILLING_PRICE) || 19.99;
    const trialDays = parseInt(process.env.BILLING_TRIAL_DAYS, 10) || 7;

    const variables = {
      name: `AI Support Bot - $${billingPrice}/month`,
      lineItems: [{
        plan: {
          appRecurringPricingDetails: {
            price: {
              amount: billingPrice,
              currencyCode: 'USD'
            }
          }
        }
      }],
      returnUrl: `${process.env.APP_URL}/app?shop=${session.shop}`,
      trialDays: trialDays
    };

    const response = await client.query({
      data: {
        query: BILLING_CREATE_MUTATION,
        variables
      }
    });

    const { appSubscriptionCreate } = response.body.data;
    
    if (appSubscriptionCreate.userErrors.length > 0) {
      throw new Error(`Billing error: ${appSubscriptionCreate.userErrors[0].message}`);
    }

    const subscription = appSubscriptionCreate.appSubscription;
    
    // Find shop by domain to get numeric ID
    const shop = await prisma.shop.findUnique({
      where: { shop: session.shop }
    });

    if (!shop) {
      throw new Error('Shop not found');
    }

    // Save subscription to database
    const dbBillingPrice = parseFloat(process.env.BILLING_PRICE) || 19.99;
    const dbTrialDays = parseInt(process.env.BILLING_TRIAL_DAYS, 10) || 7;

    await prisma.billingSubscription.upsert({
      where: { shopId: shop.id },
      update: {
        subscriptionId: subscription.id,
        planName: `AI Support Bot - $${dbBillingPrice}/month`,
        price: dbBillingPrice,
        status: subscription.status,
        trialEndsAt: new Date(Date.now() + dbTrialDays * 24 * 60 * 60 * 1000),
        currentPeriodEnd: new Date(subscription.currentPeriodEnd)
      },
      create: {
        shopId: shop.id,
        subscriptionId: subscription.id,
        planName: `AI Support Bot - $${dbBillingPrice}/month`,
        price: dbBillingPrice,
        status: subscription.status,
        trialEndsAt: new Date(Date.now() + dbTrialDays * 24 * 60 * 60 * 1000),
        currentPeriodEnd: new Date(subscription.currentPeriodEnd)
      }
    });

    return {
      confirmationUrl: appSubscriptionCreate.confirmationUrl,
      subscription
    };
  } catch (error) {
    logger.error('Error creating subscription:', error);
    throw error;
  }
};

const getActiveSubscription = async (session) => {
  try {
    const client = createGraphQLClient(session);
    
    const response = await client.query({
      data: {
        query: BILLING_QUERY
      }
    });

    const { currentAppInstallation } = response.body.data;
    const activeSubscriptions = currentAppInstallation?.activeSubscriptions || [];
    
    return activeSubscriptions.length > 0 ? activeSubscriptions[0] : null;
  } catch (error) {
    logger.error('Error fetching subscription:', error);
    return null;
  }
};

const checkBillingStatus = async (shopDomain) => {
  try {
    // Check if free plan is enabled
    if (process.env.FREE_PLAN === 'true') {
      return { hasAccess: true, plan: 'free' };
    }

    // Find shop by domain to get numeric ID
    const shop = await prisma.shop.findUnique({
      where: { shop: shopDomain }
    });

    if (!shop) {
      return { hasAccess: false, plan: 'none', error: 'Shop not found' };
    }

    const subscription = await prisma.billingSubscription.findUnique({
      where: { shopId: shop.id }
    });

    if (!subscription) {
      return { hasAccess: false, plan: 'none' };
    }

    const now = new Date();
    const isActive = subscription.status === 'ACTIVE' ||
                    (subscription.status === 'PENDING' && subscription.trialEndsAt > now);

    return {
      hasAccess: isActive,
      plan: subscription.planName,
      status: subscription.status,
      trialEndsAt: subscription.trialEndsAt,
      currentPeriodEnd: subscription.currentPeriodEnd
    };
  } catch (error) {
    logger.error('Error checking billing status:', error);
    return { hasAccess: false, plan: 'error' };
  }
};

module.exports = {
  createSubscription,
  getActiveSubscription,
  checkBillingStatus
};
