const prisma = require('../lib/prisma');
const logger = require('../utils/logger');

/**
 * Get store settings
 * GET /api/settings/:shop
 */
async function getSettings(req, res) {
  try {
    const { shop } = req.params;

    const store = await prisma.shop.findUnique({
      where: { shop },
      select: {
        shop: true,
        storeName: true,
        settings: true,
        subscriptionTier: true,
        conversationCount: true,
        conversationLimit: true
      }
    });

    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    res.json({
      shop: store.shop,
      storeName: store.storeName,
      settings: store.settings,
      subscription: {
        tier: store.subscriptionTier,
        conversationCount: store.conversationCount,
        conversationLimit: store.conversationLimit
      }
    });
  } catch (error) {
    logger.error('Error getting settings:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
}

/**
 * Update store settings
 * PUT /api/settings/:shop
 */
async function updateSettings(req, res) {
  try {
    const { shop } = req.params;
    const { settings } = req.body;

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'Invalid settings format' });
    }

    logger.info('Updating settings', { shop, keys: Object.keys(settings) });

    const store = await prisma.shop.findUnique({ where: { shop } });

    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    // Merge new settings with existing ones
    const mergedSettings = {
      ...store.settings,
      ...settings
    };

    const updatedStore = await prisma.shop.update({
      where: { shop },
      data: { settings: mergedSettings }
    });

    logger.info('Settings updated successfully', { shop });

    res.json({
      success: true,
      settings: updatedStore.settings,
      message: 'Settings updated successfully'
    });
  } catch (error) {
    logger.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
}

/**
 * Get store name
 * GET /api/settings/:shop/name
 */
async function getStoreName(req, res) {
  try {
    const { shop } = req.params;

    const store = await Store.findOne({ 
      where: { shop },
      attributes: ['storeName', 'shop']
    });

    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    res.json({
      storeName: store.storeName || shop.split('.')[0],
      shop: store.shop
    });
  } catch (error) {
    logger.error('Error getting store name:', error);
    res.status(500).json({ error: 'Failed to get store name' });
  }
}

/**
 * Update store name
 * PUT /api/settings/:shop/name
 */
async function updateStoreName(req, res) {
  try {
    const { shop } = req.params;
    const { storeName } = req.body;

    if (!storeName || typeof storeName !== 'string') {
      return res.status(400).json({ error: 'Invalid store name' });
    }

    const store = await Store.findOne({ where: { shop } });

    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    store.storeName = storeName.trim();
    await store.save();

    logger.info('Store name updated', { shop, storeName });

    res.json({
      success: true,
      storeName: store.storeName
    });
  } catch (error) {
    logger.error('Error updating store name:', error);
    res.status(500).json({ error: 'Failed to update store name' });
  }
}

/**
 * Get theme settings
 * GET /api/settings/:shop/theme
 */
async function getTheme(req, res) {
  try {
    const { shop } = req.params;

    const store = await Store.findOne({ 
      where: { shop },
      attributes: ['settings']
    });

    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    res.json({
      theme: store.settings.theme || {
        primaryColor: '#4F46E5',
        position: 'bottom-right'
      }
    });
  } catch (error) {
    logger.error('Error getting theme:', error);
    res.status(500).json({ error: 'Failed to get theme' });
  }
}

/**
 * Update theme settings
 * PUT /api/settings/:shop/theme
 */
async function updateTheme(req, res) {
  try {
    const { shop } = req.params;
    const { theme } = req.body;

    if (!theme || typeof theme !== 'object') {
      return res.status(400).json({ error: 'Invalid theme format' });
    }

    const store = await Store.findOne({ where: { shop } });

    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    store.settings = {
      ...store.settings,
      theme: {
        ...store.settings.theme,
        ...theme
      }
    };

    await store.save();

    logger.info('Theme updated', { shop });

    res.json({
      success: true,
      theme: store.settings.theme
    });
  } catch (error) {
    logger.error('Error updating theme:', error);
    res.status(500).json({ error: 'Failed to update theme' });
  }
}

/**
 * Reset settings to default
 * POST /api/settings/:shop/reset
 */
async function resetSettings(req, res) {
  try {
    const { shop } = req.params;

    const store = await Store.findOne({ where: { shop } });

    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    // Reset to default settings
    store.settings = {
      welcomeMessage: "Hi! 👋 I'm here to help you with any questions about your order, returns, or our products. How can I assist you today?",
      returnPolicy: "We accept returns within 30 days of purchase. Items must be unworn and in original packaging.",
      shippingPolicy: "We ship within 1-2 business days. Domestic orders typically arrive in 3-5 business days.",
      supportEmail: store.settings.supportEmail || "support@example.com",
      botPersonality: "friendly",
      escalationEmail: store.settings.escalationEmail,
      chatbotEnabled: true,
      theme: {
        primaryColor: "#4F46E5",
        position: "bottom-right"
      }
    };

    await store.save();

    logger.info('Settings reset to default', { shop });

    res.json({
      success: true,
      settings: store.settings,
      message: 'Settings reset to default values'
    });
  } catch (error) {
    logger.error('Error resetting settings:', error);
    res.status(500).json({ error: 'Failed to reset settings' });
  }
}

module.exports = {
  getSettings,
  updateSettings,
  getStoreName,
  updateStoreName,
  getTheme,
  updateTheme,
  resetSettings
};

