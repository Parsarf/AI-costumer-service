const crypto = require('node:crypto');
const { shopify } = require('../lib/shopify');
const prisma = require('../lib/prisma');
const { getShopInfo } = require('../services/shopifyService');
const { registerWebhooks } = require('../utils/webhookRegistration');
const logger = require('../utils/logger');

/**
 * Initialize OAuth flow
 * GET /auth?shop=example.myshopify.com
 */
async function initiateAuth(req, res) {
  try {
    const { shop } = req.query;

    logger.info('OAuth initiation request', { shop, query: req.query });

    if (!shop) {
      logger.warn('Missing shop parameter in OAuth request');
      return res.status(400).json({ error: 'Missing shop parameter' });
    }

    // Validate shop domain
    if (!shop.match(/^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/)) {
      logger.warn('Invalid shop domain format', { shop });
      return res.status(400).json({ error: 'Invalid shop domain' });
    }

    // Check required environment variables
    if (!process.env.SHOPIFY_API_KEY) {
      logger.error('SHOPIFY_API_KEY is not set');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    if (!process.env.SCOPES) {
      logger.error('SCOPES is not set');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    if (!process.env.APP_URL) {
      logger.error('APP_URL is not set');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Generate nonce for security
    const state = crypto.randomBytes(16).toString('hex');

    // Build authorization URL
    const authUrl = `https://${shop}/admin/oauth/authorize?` +
      `client_id=${process.env.SHOPIFY_API_KEY}&` +
      `scope=${process.env.SCOPES}&` +
      `redirect_uri=${process.env.APP_URL}/auth/callback&` +
      `state=${state}`;

    logger.info('Initiating OAuth flow', { 
      shop, 
      state, 
      authUrl: authUrl.replace(process.env.SHOPIFY_API_KEY, '[REDACTED]')
    });

    // In production, store state in session/redis for verification
    // For MVP, we'll skip this step

    res.redirect(authUrl);
  } catch (error) {
    logger.error('Error initiating auth:', error);
    res.status(500).json({ error: 'Failed to initiate authentication' });
  }
}

/**
 * Handle OAuth callback
 * GET /auth/callback?code=xxx&shop=example.myshopify.com&state=xxx&hmac=xxx
 */
async function handleCallback(req, res) {
  try {
    const { shop, code, state } = req.query;

    logger.info('OAuth callback received', { 
      shop, 
      hasCode: !!code, 
      hasState: !!state,
      query: req.query 
    });

    if (!shop || !code) {
      logger.warn('Missing required parameters in OAuth callback', { shop, hasCode: !!code });
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    logger.info('Processing OAuth callback', { shop });

    // Exchange authorization code for access token
    const tokenResponse = await fetch(
      `https://${shop}/admin/oauth/access_token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          client_id: process.env.SHOPIFY_API_KEY,
          client_secret: process.env.SHOPIFY_API_SECRET,
          code
        })
      }
    );

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for access token');
    }

    const { access_token, scope } = await tokenResponse.json();

    logger.info('Access token obtained', { shop });

    // Get shop information
    const shopInfo = await getShopInfo(shop, access_token);

    // Create or update store in database (if available)
    let store = null;
    if (process.env.DATABASE_URL) {
      try {
        store = await prisma.shop.upsert({
          where: { shop },
          update: {
            accessToken: access_token,
            isActive: true,
            updatedAt: new Date()
          },
          create: {
            shop,
            accessToken: access_token,
            isActive: true,
            subscriptionTier: 'starter',
            settings: {
              storeName: shopInfo?.name || shop.split('.')[0],
              welcomeMessage: 'Hi! How can I help you today?',
              returnPolicy: 'Please contact support for return information.',
              shippingPolicy: 'Please contact support for shipping information.',
              supportEmail: 'support@store.com',
              botPersonality: 'friendly'
            }
          }
        });
        logger.info('Store created/updated in database', { shop });
      } catch (dbError) {
        logger.error('Failed to save store to database:', dbError);
        logger.warn('Continuing without database storage');
      }
    } else {
      logger.warn('Database not available - store not saved');
    }

    logger.info('Store created/updated', { 
      shop,
      storeId: store?.id || 'not_saved_to_db'
    });

    // Register webhooks (async, don't wait)
    registerWebhooks(shop, access_token).catch(err => 
      logger.error('Failed to register webhooks:', err)
    );

    // Redirect to embedded app
    res.redirect(`/app?shop=${shop}&host=${req.query.host || 'admin.shopify.com'}`);
  } catch (error) {
    logger.error('Error handling OAuth callback:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Installation Failed</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: #f5f5f5;
          }
          .container {
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 500px;
          }
          h1 { color: #d32f2f; }
          p { color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>❌ Installation Failed</h1>
          <p>We encountered an error during installation. Please try again or contact support.</p>
          <p><small>Error: ${error.message}</small></p>
        </div>
      </body>
      </html>
    `);
  }
}

/**
 * Verify if store is authenticated
 * GET /auth/verify?shop=example.myshopify.com
 */
async function verifyAuth(req, res) {
  try {
    const { shop } = req.query;

    if (!shop) {
      return res.status(400).json({ error: 'Missing shop parameter' });
    }

    // Check if database is available
    if (!process.env.DATABASE_URL) {
      logger.warn('Database not available - cannot verify authentication');
      return res.json({ authenticated: false, reason: 'Database not available' });
    }

    const store = await prisma.shop.findFirst({
      where: { shop, isActive: true }
    });

    if (!store) {
      return res.json({ authenticated: false });
    }

    res.json({ 
      authenticated: true,
      shop: store.shop,
      storeName: store.settings?.storeName || store.shop.split('.')[0]
    });
  } catch (error) {
    logger.error('Error verifying auth:', error);
    res.status(500).json({ error: 'Failed to verify authentication' });
  }
}

module.exports = {
  initiateAuth,
  handleCallback,
  verifyAuth
};

