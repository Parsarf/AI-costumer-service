const { shopifyApi, ApiVersion, LogSeverity } = require('@shopify/shopify-api');
const { PrismaSessionStorage } = require('@shopify/shopify-app-session-storage-prisma');
const prisma = require('./prisma');

// Initialize Shopify API
const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET,
  scopes: process.env.SCOPES.split(','),
  hostName: new URL(process.env.APP_URL).hostname,
  hostScheme: process.env.NODE_ENV === 'production' ? 'https' : 'http',
  apiVersion: ApiVersion.January24,
  isEmbeddedApp: true,
  logger: {
    level: process.env.NODE_ENV === 'development' ? LogSeverity.Debug : LogSeverity.Error,
    httpRequests: process.env.NODE_ENV === 'development'
  },
  sessionStorage: new PrismaSessionStorage(prisma)
});

// GraphQL client for billing
const createGraphQLClient = (session) => {
  return new shopify.clients.Graphql({ session });
};

// REST client for general API calls
const createRestClient = (session) => {
  return new shopify.clients.Rest({ session });
};

// Webhook verification
const verifyWebhook = (data, hmac) => {
  return shopify.webhooks.validate({
    rawBody: data,
    rawRequest: {
      headers: {
        'x-shopify-hmac-sha256': hmac
      }
    }
  });
};

// Billing GraphQL queries
const BILLING_CREATE_MUTATION = `
  mutation appSubscriptionCreate($name: String!, $lineItems: [AppSubscriptionLineItemInput!]!, $returnUrl: URL!, $trialDays: Int) {
    appSubscriptionCreate(name: $name, lineItems: $lineItems, returnUrl: $returnUrl, trialDays: $trialDays) {
      appSubscription {
        id
        status
        currentPeriodEnd
        lineItems {
          id
          plan {
            pricingDetails {
              ... on AppRecurringPricing {
                price {
                  amount
                  currencyCode
                }
              }
            }
          }
        }
      }
      confirmationUrl
      userErrors {
        field
        message
      }
    }
  }
`;

const BILLING_QUERY = `
  query currentAppInstallation {
    currentAppInstallation {
      activeSubscriptions {
        id
        status
        currentPeriodEnd
        lineItems {
          id
          plan {
            pricingDetails {
              ... on AppRecurringPricing {
                price {
                  amount
                  currencyCode
                }
              }
            }
          }
        }
      }
    }
  }
`;

module.exports = {
  shopify,
  createGraphQLClient,
  createRestClient,
  verifyWebhook,
  BILLING_CREATE_MUTATION,
  BILLING_QUERY
};
