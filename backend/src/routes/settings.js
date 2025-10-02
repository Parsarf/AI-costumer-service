const express = require('express');
const prisma = require('../lib/prisma');
const logger = require('../utils/logger');

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
        plan: true,
        settings: true,
        isActive: true,
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
router.put('/', async (req, res) => {
  try {
    const { shop } = req.query;
    const { settings } = req.body;

    if (!shop) {
      return res.status(400).json({ error: 'Missing shop parameter' });
    }

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'Invalid settings format' });
    }

    const updatedShop = await prisma.shop.update({
      where: { shop },
      data: { 
        settings: {
          ...settings,
          updatedAt: new Date().toISOString()
        }
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