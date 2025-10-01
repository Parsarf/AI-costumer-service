const { shopifyApi, ApiVersion, LogSeverity } = require('@shopify/shopify-api');

// Initialize Shopify API client
const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET,
  scopes: process.env.SHOPIFY_SCOPES.split(','),
  hostName: new URL(process.env.APP_URL).hostname,
  hostScheme: process.env.NODE_ENV === 'production' ? 'https' : 'http',
  apiVersion: ApiVersion.January24,
  isEmbeddedApp: false,
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

