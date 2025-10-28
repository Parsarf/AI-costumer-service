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
        active: true,
        createdAt: true
      }
    });

    if (!shopData) {
      return res.status(404).json({ error: 'Shop not found' });
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
      return res.status(404).json({ error: 'Shop not found' });
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