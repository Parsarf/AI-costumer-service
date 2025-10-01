const express = require('express');
const router = express.Router();
const {
  handleAppUninstalled,
  handleCustomerDataRequest,
  handleCustomerRedact,
  handleShopRedact,
  handleSubscriptionUpdated
} = require('../controllers/webhooksController');
const { verifyShopifyWebhook } = require('../middleware/verifyShopify');
const { webhookLimiter } = require('../middleware/rateLimit');
const { asyncHandler } = require('../middleware/errorHandler');

// Apply rate limiting
router.use(webhookLimiter);

// Middleware to capture raw body for HMAC verification
router.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf.toString('utf8');
  }
}));

// POST /webhooks/app/uninstalled
router.post('/app/uninstalled', verifyShopifyWebhook, asyncHandler(handleAppUninstalled));

// POST /webhooks/customers/data_request (GDPR)
router.post('/customers/data_request', verifyShopifyWebhook, asyncHandler(handleCustomerDataRequest));

// POST /webhooks/customers/redact (GDPR)
router.post('/customers/redact', verifyShopifyWebhook, asyncHandler(handleCustomerRedact));

// POST /webhooks/shop/redact (GDPR)
router.post('/shop/redact', verifyShopifyWebhook, asyncHandler(handleShopRedact));

// POST /webhooks/subscription/updated
router.post('/subscription/updated', verifyShopifyWebhook, asyncHandler(handleSubscriptionUpdated));

module.exports = router;

