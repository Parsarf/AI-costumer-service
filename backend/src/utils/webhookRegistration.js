const { shopify } = require('../lib/shopify');
const logger = require('./logger');

/**
 * Register required webhooks after successful OAuth
 * @param {string} shop - Shop domain
 * @param {string} accessToken - Store access token
 */
async function registerWebhooks(shop, accessToken) {
  try {
    const session = {
      shop: shop,
      accessToken: accessToken
    };

    const client = new shopify.clients.Rest({ session });
    const apiVersion = shopify.config.apiVersion;

    logger.info(`Registering webhooks for ${shop}`);

    // List of webhooks to register
    const webhooks = [
      {
        topic: 'app/uninstalled',
        address: `${process.env.APP_URL}/webhooks/app/uninstalled`
      },
      {
        topic: 'customers/data_request',
        address: `${process.env.APP_URL}/webhooks/customers/data_request`
      },
      {
        topic: 'customers/redact',
        address: `${process.env.APP_URL}/webhooks/customers/redact`
      },
      {
        topic: 'shop/redact',
        address: `${process.env.APP_URL}/webhooks/shop/redact`
      }
    ];

    // Check existing webhooks first
    const existingResponse = await client.get({
      path: 'webhooks'
    });

    const existingWebhooks = existingResponse.body.webhooks || [];
    const existingTopics = existingWebhooks.map(wh => wh.topic);

    // Register missing webhooks
    for (const webhook of webhooks) {
      if (existingTopics.includes(webhook.topic)) {
        logger.info(`Webhook ${webhook.topic} already exists for ${shop}`);
        continue;
      }

      try {
        const response = await client.post({
          path: 'webhooks',
          data: {
            webhook: {
              topic: webhook.topic,
              address: webhook.address,
              format: 'json'
            }
          }
        });

        logger.info(`Webhook ${webhook.topic} registered successfully for ${shop}`, {
          webhookId: response.body.webhook.id
        });

      } catch (error) {
        logger.error(`Failed to register webhook ${webhook.topic} for ${shop}:`, error);
        // Continue with other webhooks even if one fails
      }
    }

    logger.info(`Webhook registration completed for ${shop}`);

  } catch (error) {
    logger.error(`Error registering webhooks for ${shop}:`, error);
    // Don't throw - webhook registration failure shouldn't break OAuth
  }
}

/**
 * Unregister all webhooks for a shop (cleanup)
 * @param {string} shop - Shop domain
 * @param {string} accessToken - Store access token
 */
async function unregisterWebhooks(shop, accessToken) {
  try {
    const session = {
      shop: shop,
      accessToken: accessToken
    };

    const client = new shopify.clients.Rest({ session });

    logger.info(`Unregistering webhooks for ${shop}`);

    // Get existing webhooks
    const response = await client.get({
      path: 'webhooks'
    });

    const webhooks = response.body.webhooks || [];
    const ourWebhooks = webhooks.filter(wh => 
      wh.address.includes(process.env.APP_URL)
    );

    // Delete our webhooks
    for (const webhook of ourWebhooks) {
      try {
        await client.delete({
          path: `webhooks/${webhook.id}`
        });
        logger.info(`Webhook ${webhook.topic} unregistered for ${shop}`);
      } catch (error) {
        logger.error(`Failed to unregister webhook ${webhook.topic}:`, error);
      }
    }

    logger.info(`Webhook unregistration completed for ${shop}`);

  } catch (error) {
    logger.error(`Error unregistering webhooks for ${shop}:`, error);
  }
}

module.exports = {
  registerWebhooks,
  unregisterWebhooks
};

