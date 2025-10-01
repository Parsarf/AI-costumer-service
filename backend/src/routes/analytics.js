const express = require('express');
const router = express.Router();
const {
  getAnalytics,
  getConversations,
  getDashboardSummary
} = require('../controllers/analyticsController');
const { apiLimiter } = require('../middleware/rateLimit');
const { asyncHandler } = require('../middleware/errorHandler');

// Apply rate limiting
router.use(apiLimiter);

// GET /api/analytics/:shop
router.get('/:shop', asyncHandler(getAnalytics));

// GET /api/analytics/:shop/conversations
router.get('/:shop/conversations', asyncHandler(getConversations));

// GET /api/analytics/:shop/dashboard
router.get('/:shop/dashboard', asyncHandler(getDashboardSummary));

module.exports = router;

