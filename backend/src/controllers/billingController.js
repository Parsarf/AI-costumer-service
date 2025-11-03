const { createGraphQLClient, BILLING_CREATE_MUTATION, BILLING_QUERY } = require('../lib/shopify');
const prisma = require('../lib/prisma');
const logger = require('../utils/logger');

/**
 * Create subscription for a shop
 * @param {string} shop - Shop domain
 * @param {string} accessToken - Store access token
 * @param {string} plan - Plan tier (starter, pro, scale)
 * @returns {Object} - { confirmationUrl, subscription }
 */
async function createSubscription(shop, accessToken, plan = 'starter') {
  try {
    const session = {
      shop: shop,
      accessToken: accessToken
    };

    const client = createGraphQLClient(session);
    
    // Define plan pricing
    const planPricing = {
      starter: { price: 19.99, name: 'Starter Plan' },
      pro: { price: 39.99, name: 'Pro Plan' },
      scale: { price: 79.99, name: 'Scale Plan' }
    };

    const selectedPlan = planPricing[plan] || planPricing.starter;
    const isTestMode = process.env.SHOPIFY_BILLING_TEST === 'true';

    const variables = {
      name: `AI Support Bot - ${selectedPlan.name}`,
      lineItems: [{
        plan: {
          appRecurringPricingDetails: {
            price: {
              amount: selectedPlan.price,
              currencyCode: 'USD'
            }
          }
        }
      }],
      returnUrl: `${process.env.APP_URL}/billing/callback?shop=${shop}`,
      trialDays: parseInt(process.env.BILLING_TRIAL_DAYS, 10) || 7,
      test: isTestMode
    };

    logger.info('Creating subscription', { shop, plan, variables });

    const response = await client.query({
      data: {
        query: BILLING_CREATE_MUTATION,
        variables
      }
    });

    const { appSubscriptionCreate } = response.body.data;
    
    if (appSubscriptionCreate.userErrors.length > 0) {
      const error = appSubscriptionCreate.userErrors[0];
      logger.error('Billing creation error:', error);
      throw new Error(`Billing error: ${error.message}`);
    }

    const subscription = appSubscriptionCreate.appSubscription;
    
    logger.info('Subscription created successfully', { 
      shop, 
      subscriptionId: subscription.id,
      status: subscription.status
    });

    return {
      confirmationUrl: appSubscriptionCreate.confirmationUrl,
      subscription: {
        id: subscription.id,
        name: variables.name,
        status: subscription.status,
        price: selectedPlan.price,
        currency: 'USD',
        trialDays: variables.trialDays,
        test: isTestMode
      }
    };

  } catch (error) {
    logger.error('Error creating subscription:', error);
    throw error;
  }
}

/**
 * Verify if shop has active subscription
 * @param {string} shop - Shop domain
 * @param {string} accessToken - Store access token
 * @returns {Object} - { hasActiveSubscription, subscription }
 */
async function verifySubscription(shop, accessToken) {
  try {
    const session = {
      shop: shop,
      accessToken: accessToken
    };

    const client = createGraphQLClient(session);
    
    const response = await client.query({
      data: {
        query: BILLING_QUERY
      }
    });

    const { currentAppInstallation } = response.body.data;
    const activeSubscriptions = currentAppInstallation?.activeSubscriptions || [];
    
    const activeSubscription = activeSubscriptions.find(sub => 
      sub.status === 'ACTIVE' || sub.status === 'PENDING'
    );

    return {
      hasActiveSubscription: !!activeSubscription,
      subscription: activeSubscription || null
    };

  } catch (error) {
    logger.error('Error verifying subscription:', error);
    return { hasActiveSubscription: false, subscription: null };
  }
}

/**
 * Cancel subscription for a shop
 * @param {string} shop - Shop domain
 * @param {string} accessToken - Store access token
 * @param {string} subscriptionId - Subscription ID to cancel
 * @returns {boolean} - Success status
 */
async function cancelSubscription(shop, accessToken, subscriptionId) {
  try {
    const session = {
      shop: shop,
      accessToken: accessToken
    };

    const client = createGraphQLClient(session);
    
    const mutation = `
      mutation appSubscriptionCancel($id: ID!) {
        appSubscriptionCancel(id: $id) {
          appSubscription {
            id
            status
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const response = await client.query({
      data: {
        query: mutation,
        variables: { id: subscriptionId }
      }
    });

    const { appSubscriptionCancel } = response.body.data;
    
    if (appSubscriptionCancel.userErrors.length > 0) {
      const error = appSubscriptionCancel.userErrors[0];
      logger.error('Billing cancellation error:', error);
      throw new Error(`Cancellation error: ${error.message}`);
    }

    // Update database
    await prisma.billingSubscription.updateMany({
      where: { 
        shopId: shop,
        subscriptionId: subscriptionId
      },
      data: {
        status: 'CANCELLED',
        updatedAt: new Date()
      }
    });

    logger.info('Subscription cancelled successfully', { 
      shop, 
      subscriptionId,
      status: appSubscriptionCancel.appSubscription.status
    });

    return true;

  } catch (error) {
    logger.error('Error cancelling subscription:', error);
    throw error;
  }
}

/**
 * Get billing status for a shop
 * @param {string} shop - Shop domain
 * @returns {Object} - Billing status information
 */
async function getBillingStatus(shopDomain) {
  try {
    // Check if free plan is enabled
    if (process.env.FREE_PLAN === 'true') {
      return {
        hasAccess: true,
        plan: 'free',
        status: 'active',
        message: 'Free plan enabled'
      };
    }

    // Find shop by domain to get numeric ID
    const shop = await prisma.shop.findUnique({
      where: { shop: shopDomain }
    });

    if (!shop) {
      return {
        hasAccess: false,
        plan: 'none',
        status: 'inactive',
        message: 'Shop not found'
      };
    }

    // Get subscription from database
    const subscription = await prisma.billingSubscription.findUnique({
      where: { shopId: shop.id }
    });

    if (!subscription) {
      return {
        hasAccess: false,
        plan: 'none',
        status: 'inactive',
        message: 'No subscription found'
      };
    }

    const now = new Date();
    const isActive = subscription.status === 'ACTIVE' ||
                    (subscription.status === 'PENDING' &&
                     subscription.trialEndsAt &&
                     subscription.trialEndsAt > now);

    return {
      hasAccess: isActive,
      plan: subscription.planName,
      status: subscription.status,
      trialEndsAt: subscription.trialEndsAt,
      currentPeriodEnd: subscription.currentPeriodEnd,
      price: subscription.price,
      currency: subscription.currency,
      message: isActive ? 'Subscription active' : 'Subscription inactive'
    };

  } catch (error) {
    logger.error('Error getting billing status:', error);
    return {
      hasAccess: false,
      plan: 'error',
      status: 'error',
      message: 'Error checking billing status'
    };
  }
}

/**
 * Update billing subscription in database
 * @param {string} shop - Shop domain
 * @param {Object} subscriptionData - Subscription data from Shopify
 * @returns {Object} - Updated subscription
 */
async function updateBillingSubscription(shopDomain, subscriptionData) {
  try {
    // Find shop by domain to get numeric ID
    const shop = await prisma.shop.findUnique({
      where: { shop: shopDomain }
    });

    if (!shop) {
      throw new Error('Shop not found');
    }

    const subscription = await prisma.billingSubscription.upsert({
      where: { shopId: shop.id },
      update: {
        subscriptionId: subscriptionData.id,
        planName: subscriptionData.name,
        price: subscriptionData.price,
        status: subscriptionData.status,
        trialEndsAt: subscriptionData.trialEndsAt,
        currentPeriodEnd: subscriptionData.currentPeriodEnd,
        updatedAt: new Date()
      },
      create: {
        shopId: shop.id,
        subscriptionId: subscriptionData.id,
        planName: subscriptionData.name,
        price: subscriptionData.price,
        status: subscriptionData.status,
        trialEndsAt: subscriptionData.trialEndsAt,
        currentPeriodEnd: subscriptionData.currentPeriodEnd
      }
    });

    logger.info('Billing subscription updated', { 
      shop, 
      subscriptionId: subscription.subscriptionId,
      status: subscription.status
    });

    return subscription;

  } catch (error) {
    logger.error('Error updating billing subscription:', error);
    throw error;
  }
}

module.exports = {
  createSubscription,
  verifySubscription,
  cancelSubscription,
  getBillingStatus,
  updateBillingSubscription
};

