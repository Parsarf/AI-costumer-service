const { createShopifyClient } = require('../config/shopify');
const logger = require('../utils/logger');

/**
 * Fetch order information by order number
 */
async function fetchOrderInfo(shop, accessToken, orderNumber) {
  try {
    const client = createShopifyClient(shop, accessToken);
    
    // Remove # if present and clean the order number
    const cleanOrderNumber = orderNumber.replace(/^#/, '');
    
    logger.info(`Fetching order info for ${shop}`, { orderNumber: cleanOrderNumber });

    // Search for order by name
    const response = await client.get({
      path: 'orders',
      query: { name: cleanOrderNumber, status: 'any' }
    });

    if (response.body.orders && response.body.orders.length > 0) {
      return response.body.orders[0];
    }

    // If not found by name, try by order number
    const response2 = await client.get({
      path: 'orders',
      query: { name: `#${cleanOrderNumber}`, status: 'any' }
    });

    return response2.body.orders?.[0] || null;
  } catch (error) {
    logger.error('Error fetching order from Shopify:', error);
    return null;
  }
}

/**
 * Fetch product information by product ID or search term
 */
async function fetchProductInfo(shop, accessToken, searchTerm) {
  try {
    const client = createShopifyClient(shop, accessToken);
    
    logger.info(`Searching products for ${shop}`, { searchTerm });

    const response = await client.get({
      path: 'products',
      query: { 
        limit: 5,
        fields: 'id,title,body_html,variants,images,product_type'
      }
    });

    // Filter products by search term
    const products = response.body.products.filter(product => 
      product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.product_type?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return products.slice(0, 3); // Return top 3 matches
  } catch (error) {
    logger.error('Error fetching products from Shopify:', error);
    return [];
  }
}

/**
 * Fetch customer information by email
 */
async function fetchCustomerInfo(shop, accessToken, email) {
  try {
    const client = createShopifyClient(shop, accessToken);
    
    logger.info(`Fetching customer info for ${shop}`, { email });

    const response = await client.get({
      path: 'customers/search',
      query: { query: `email:${email}` }
    });

    return response.body.customers?.[0] || null;
  } catch (error) {
    logger.error('Error fetching customer from Shopify:', error);
    return null;
  }
}

/**
 * Fetch customer's order history
 */
async function fetchCustomerOrders(shop, accessToken, customerId, limit = 10) {
  try {
    const client = createShopifyClient(shop, accessToken);
    
    logger.info(`Fetching orders for customer ${customerId} on ${shop}`);

    const response = await client.get({
      path: `customers/${customerId}/orders`,
      query: { limit }
    });

    return response.body.orders || [];
  } catch (error) {
    logger.error('Error fetching customer orders from Shopify:', error);
    return [];
  }
}

/**
 * Install script tag on store (widget injection)
 */
async function installScriptTag(shop, accessToken) {
  try {
    const client = createShopifyClient(shop, accessToken);
    
    const scriptSrc = `${process.env.APP_URL}/widget/loader.js?shop=${shop}`;
    
    logger.info(`Installing script tag on ${shop}`, { scriptSrc });

    // Check if script tag already exists
    const existingResponse = await client.get({
      path: 'script_tags',
      query: { src: scriptSrc }
    });

    if (existingResponse.body.script_tags.length > 0) {
      logger.info('Script tag already installed');
      return existingResponse.body.script_tags[0];
    }

    // Install new script tag
    const response = await client.post({
      path: 'script_tags',
      data: {
        script_tag: {
          event: 'onload',
          src: scriptSrc,
          display_scope: 'all'
        }
      }
    });

    logger.info('Script tag installed successfully');
    return response.body.script_tag;
  } catch (error) {
    logger.error('Error installing script tag:', error);
    throw error;
  }
}

/**
 * Uninstall script tag from store
 */
async function uninstallScriptTag(shop, accessToken) {
  try {
    const client = createShopifyClient(shop, accessToken);
    
    const scriptSrc = `${process.env.APP_URL}/widget/loader.js?shop=${shop}`;
    
    logger.info(`Uninstalling script tag from ${shop}`);

    // Find existing script tags
    const response = await client.get({
      path: 'script_tags',
      query: { src: scriptSrc }
    });

    // Delete all matching script tags
    for (const scriptTag of response.body.script_tags) {
      await client.delete({
        path: `script_tags/${scriptTag.id}`
      });
      logger.info(`Deleted script tag ${scriptTag.id}`);
    }

    return true;
  } catch (error) {
    logger.error('Error uninstalling script tag:', error);
    return false;
  }
}

/**
 * Get shop information
 */
async function getShopInfo(shop, accessToken) {
  try {
    const client = createShopifyClient(shop, accessToken);
    
    const response = await client.get({
      path: 'shop'
    });

    return response.body.shop;
  } catch (error) {
    logger.error('Error fetching shop info:', error);
    return null;
  }
}

module.exports = {
  fetchOrderInfo,
  fetchProductInfo,
  fetchCustomerInfo,
  fetchCustomerOrders,
  installScriptTag,
  uninstallScriptTag,
  getShopInfo
};

