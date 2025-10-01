const express = require('express');
const router = express.Router();
const {
  getSettings,
  updateSettings,
  getStoreName,
  updateStoreName,
  getTheme,
  updateTheme,
  resetSettings
} = require('../controllers/settingsController');
const { apiLimiter } = require('../middleware/rateLimit');
const { asyncHandler } = require('../middleware/errorHandler');

// Apply rate limiting
router.use(apiLimiter);

// GET /api/settings/:shop
router.get('/:shop', asyncHandler(getSettings));

// PUT /api/settings/:shop
router.put('/:shop', asyncHandler(updateSettings));

// GET /api/settings/:shop/name
router.get('/:shop/name', asyncHandler(getStoreName));

// PUT /api/settings/:shop/name
router.put('/:shop/name', asyncHandler(updateStoreName));

// GET /api/settings/:shop/theme
router.get('/:shop/theme', asyncHandler(getTheme));

// PUT /api/settings/:shop/theme
router.put('/:shop/theme', asyncHandler(updateTheme));

// POST /api/settings/:shop/reset
router.post('/:shop/reset', asyncHandler(resetSettings));

module.exports = router;

