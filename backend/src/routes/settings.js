const express = require('express');
const prisma = require('../lib/prisma');
const { validateInput, validateSettings } = require('../middleware/validateInput');
const logger = require('../utils/logger');

// Force reload to fix plan field issue - Railway deployment fix
// This should resolve the remaining plan field references
// Updated: Fixed Prisma schema mismatch - using subscriptionTier instead of plan

const router = express.Router();

// Get shop settings
router.get('/', async (req, res) => {
  try {
    const { shop } = req.query;

    if (!shop) {
      return res.status(400).json({ error: 'Missing shop parameter' });
    }

    const shopData = await prisma.shop.findUnique({
      where: { shop },
      select: {
        shop: true,
        subscriptionTier: true,
        settings: true,
        isActive: true,
        createdAt: true
      }
    });

    if (!shopData) {
      // Create shop if it doesn't exist
      logger.info('Shop not found, creating new shop', { shop });
      const newShop = await prisma.shop.create({
        data: {
          shop,
          accessToken: 'temp_token', // Will be updated during OAuth
          isActive: true,
          subscriptionTier: 'starter',
          settings: {
            welcomeMessage: 'Hi! How can I help you today?',
            returnPolicy: 'Please contact support for return information.',
            shippingPolicy: 'Please contact support for shipping information.',
            supportEmail: 'support@store.com',
            botPersonality: 'friendly'
          }
        },
        select: {
          shop: true,
          subscriptionTier: true,
          settings: true,
          isActive: true,
          createdAt: true
        }
      });
      return res.json(newShop);
    }

    res.json(shopData);

  } catch (error) {
    logger.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

// Update shop settings
router.put('/', validateInput, async (req, res) => {
  try {
    const { shop } = req.query;
    const { settings } = req.body;

    if (!shop) {
      return res.status(400).json({ error: 'Missing shop parameter' });
    }

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'Invalid settings format' });
    }

    // Validate settings object
    const validation = validateSettings(settings);
    if (!validation.valid) {
      return res.status(400).json({ 
        error: 'Invalid settings', 
        details: validation.errors 
      });
    }

    // Get existing shop to merge settings
    const existingShop = await prisma.shop.findUnique({
      where: { shop },
      select: { settings: true }
    });

    if (!existingShop) {
      // Create shop if it doesn't exist
      logger.info('Shop not found during update, creating new shop', { shop });
      const newShop = await prisma.shop.create({
        data: {
          shop,
          accessToken: 'temp_token', // Will be updated during OAuth
          isActive: true,
          subscriptionTier: 'starter',
          settings: settings
        }
      });
      return res.json({
        success: true,
        settings: newShop.settings
      });
    }

    // Merge new settings with existing ones
    const mergedSettings = {
      ...existingShop.settings,
      ...settings
    };

    const updatedShop = await prisma.shop.update({
      where: { shop },
      data: { 
        settings: mergedSettings
      }
    });

    logger.info('Settings updated', { shop });
    res.json({
      success: true,
      settings: updatedShop.settings
    });

  } catch (error) {
    logger.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

module.exports = router;