const express = require('express');
const router = express.Router();
const { initiateAuth, handleCallback, verifyAuth } = require('../controllers/authController');
const { verifyShopifyOAuth } = require('../middleware/verifyShopify');
const { authLimiter } = require('../middleware/rateLimit');

// Apply rate limiting to all auth routes
router.use(authLimiter);

// GET /auth?shop=example.myshopify.com
router.get('/', initiateAuth);

// GET /auth/callback?code=xxx&shop=xxx&state=xxx&hmac=xxx
router.get('/callback', handleCallback);

// GET /auth/verify?shop=example.myshopify.com
router.get('/verify', verifyAuth);

module.exports = router;

