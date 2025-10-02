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

    if (!shop) {
      return res.status(400).json({ error: 'Missing shop parameter' });
    }

    // Validate shop domain
    if (!shop.match(/^[a-zA-Z0-9][a-zA-Z0-9-]*\.myshopify\.com$/)) {
      return res.status(400).json({ error: 'Invalid shop domain' });
    }

    // Generate nonce for security
    const state = require('crypto').randomBytes(16).toString('hex');

    // Build authorization URL
    const authUrl = `https://${shop}/admin/oauth/authorize?` +
      `client_id=${process.env.SHOPIFY_API_KEY}&` +
      `scope=${process.env.SHOPIFY_SCOPES}&` +
      `redirect_uri=${process.env.APP_URL}/auth/callback&` +
      `state=${state}`;

    logger.info('Initiating OAuth flow', { shop, state });

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

    if (!shop || !code) {
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

    // Create or update store in database
    const store = await prisma.shop.upsert({
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
        plan: 'free',
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

    logger.info('Store created/updated', { 
      shop,
      storeId: store.id 
    });

    // Register webhooks (async, don't wait)
    registerWebhooks(shop, access_token).catch(err => 
      logger.error('Failed to register webhooks:', err)
    );

    // Redirect to embedded app
    res.redirect(`/app?shop=${shop}&host=${req.query.host || 'admin.shopify.com'}`);
    
    // Fallback success page (if redirect fails)
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Installation Successful</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          .container {
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            text-align: center;
            max-width: 500px;
          }
          h1 { color: #333; margin-bottom: 10px; }
          p { color: #666; line-height: 1.6; }
          .checkmark {
            width: 80px;
            height: 80px;
            margin: 0 auto 20px;
            border-radius: 50%;
            background: #4CAF50;
            position: relative;
          }
          .checkmark:after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 20px;
            height: 35px;
            border: solid white;
            border-width: 0 5px 5px 0;
            transform: translate(-50%, -60%) rotate(45deg);
          }
          .button {
            display: inline-block;
            margin-top: 20px;
            padding: 12px 30px;
            background: #4F46E5;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            font-weight: 600;
          }
          .button:hover {
            background: #4338CA;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="checkmark"></div>
          <h1>🎉 Installation Successful!</h1>
          <p>Your AI Support Bot has been installed on <strong>${shop}</strong>.</p>
          <p>The chat widget is now active on your store. Visit your dashboard to customize settings.</p>
          <a href="https://${shop}/admin/apps" class="button">Go to Shopify Admin</a>
        </div>
      </body>
      </html>
    `);
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

    const store = await prisma.shop.findUnique({ 
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

