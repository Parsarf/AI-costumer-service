const express = require('express');
const { 
  handleCustomerDataRequest,
  handleCustomerRedact,
  handleShopRedact,
  handleAppUninstalled
} = require('../controllers/webhooksController');

const router = express.Router();

// GDPR Webhooks - All require HMAC verification
router.post('/customers/data_request', handleCustomerDataRequest);
router.post('/customers/redact', handleCustomerRedact);
router.post('/shop/redact', handleShopRedact);
router.post('/app/uninstalled', handleAppUninstalled);

module.exports = router;