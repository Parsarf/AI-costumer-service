const express = require('express');
const router = express.Router();
const { handleChatMessage, getConversation, getWelcomeMessage } = require('../controllers/chatController');
const { chatLimiter } = require('../middleware/rateLimit');
const { asyncHandler } = require('../middleware/errorHandler');

// Apply rate limiting to chat routes
router.use(chatLimiter);

// POST /api/chat
router.post('/', asyncHandler(handleChatMessage));

// GET /api/chat/conversation/:conversationId
router.get('/conversation/:conversationId', asyncHandler(getConversation));

// GET /api/chat/welcome?shop=example.myshopify.com
router.get('/welcome', asyncHandler(getWelcomeMessage));

module.exports = router;

