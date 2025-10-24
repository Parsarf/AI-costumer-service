const { shopifyApi, ApiVersion, LogSeverity } = require('@shopify/shopify-api');
const { restResources } = require('@shopify/shopify-api/rest/admin/2024-01');
require('@shopify/shopify-api/adapters/node');
// Initialize Shopify API with conditional session storage
let sessionStorage = null;

// Only use Prisma session storage if database is available
if (process.env.DATABASE_URL) {
  try {
    const { PrismaSessionStorage } = require('@shopify/shopify-app-session-storage-prisma');
    const prisma = require('./prisma');
    sessionStorage = new PrismaSessionStorage(prisma);
  } catch (error) {
    console.warn('Failed to initialize Prisma session storage:', error.message);
  }
}

const shopify = shopifyApi({
  restResources,
  apiKey: process.env.SHOPIFY_API_KEY || 'placeholder_key',
  apiSecretKey: process.env.SHOPIFY_API_SECRET || 'placeholder_secret',
  scopes: process.env.SCOPES ? process.env.SCOPES.split(',') : ['read_products', 'read_orders', 'read_customers', 'write_themes'],
  hostName: process.env.APP_URL ? new URL(process.env.APP_URL).hostname : 'localhost',
  hostScheme: process.env.NODE_ENV === 'production' ? 'https' : 'http',
  apiVersion: ApiVersion.January24,
  isEmbeddedApp: true,
  logger: {
    level: process.env.NODE_ENV === 'development' ? LogSeverity.Debug : LogSeverity.Error,
    httpRequests: process.env.NODE_ENV === 'development'
  },
  ...(sessionStorage && { sessionStorage })
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
