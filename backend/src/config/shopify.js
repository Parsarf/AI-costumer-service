const { shopifyApi, ApiVersion, LogSeverity } = require('@shopify/shopify-api');

// Initialize Shopify API client
const shopify = shopifyApi({
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
  }
});

/**
 * Create a Shopify REST client for a specific shop
 */
function createShopifyClient(shop, accessToken) {
  const session = shopify.session.customAppSession(shop);
  session.accessToken = accessToken;
  
  return new shopify.clients.Rest({ session });
}

/**
 * Create a Shopify GraphQL client for a specific shop
 */
function createShopifyGraphQLClient(shop, accessToken) {
  const session = shopify.session.customAppSession(shop);
  session.accessToken = accessToken;
  
  return new shopify.clients.Graphql({ session });
}

module.exports = {
  shopify,
  createShopifyClient,
  createShopifyGraphQLClient
};

