/**
 * Extract order number from customer message
 * Supports various formats: #1234, order 1234, 1234, etc.
 */
function extractOrderNumber(message) {
  if (!message || typeof message !== 'string') {
    return null;
  }

  const patterns = [
    // #1234 format
    /#(\d{4,})/,
    
    // "order #1234" or "order 1234" format
    /order\s*#?(\d{4,})/i,
    
    // "my order is 1234" format
    /order\s+is\s+#?(\d{4,})/i,
    
    // "tracking 1234" format
    /tracking\s*#?(\d{4,})/i,
    
    // Standalone 4+ digit number (be careful with this)
    /\b(\d{4,})\b/
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      const orderNumber = match[1];
      
      // Validate: order numbers are typically 4-10 digits
      if (orderNumber.length >= 4 && orderNumber.length <= 10) {
        return orderNumber;
      }
    }
  }

  return null;
}

/**
 * Extract multiple order numbers from message
 */
function extractAllOrderNumbers(message) {
  if (!message || typeof message !== 'string') {
    return [];
  }

  const orderNumbers = new Set();
  
  // Find all #XXXX patterns
  const hashMatches = message.matchAll(/#(\d{4,10})/g);
  for (const match of hashMatches) {
    orderNumbers.add(match[1]);
  }

  // Find all "order XXXX" patterns
  const orderMatches = message.matchAll(/order\s*#?(\d{4,10})/gi);
  for (const match of orderMatches) {
    orderNumbers.add(match[1]);
  }

  return Array.from(orderNumbers);
}

/**
 * Detect if message is asking about order status
 */
function isOrderInquiry(message) {
  if (!message || typeof message !== 'string') {
    return false;
  }

  const orderKeywords = [
    /where.*order/i,
    /order.*status/i,
    /track.*order/i,
    /when.*arrive/i,
    /when.*ship/i,
    /delivery.*status/i,
    /tracking.*number/i,
    /hasn't.*arrived/i,
    /still.*waiting/i,
    /order.*update/i
  ];

  return orderKeywords.some(pattern => pattern.test(message));
}

/**
 * Extract email address from message
 */
function extractEmail(message) {
  if (!message || typeof message !== 'string') {
    return null;
  }

  const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
  const match = message.match(emailPattern);
  
  return match ? match[0] : null;
}

/**
 * Extract product name or query from message
 */
function extractProductQuery(message) {
  if (!message || typeof message !== 'string') {
    return null;
  }

  const productPatterns = [
    /(?:about|looking for|interested in|want|need)\s+(?:the\s+)?([a-zA-Z0-9\s-]+?)(?:\?|$|\.)/i,
    /(?:do you have|sell|carry)\s+([a-zA-Z0-9\s-]+?)(?:\?|$|\.)/i,
    /tell me about\s+([a-zA-Z0-9\s-]+?)(?:\?|$|\.)/i
  ];

  for (const pattern of productPatterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return null;
}

/**
 * Detect intent from customer message
 */
function detectIntent(message) {
  if (!message || typeof message !== 'string') {
    return 'general';
  }

  const messageLower = message.toLowerCase();

  // Order tracking
  if (isOrderInquiry(message) || extractOrderNumber(message)) {
    return 'order_tracking';
  }

  // Returns/refunds
  if (/(return|refund|send back|give back)/i.test(message)) {
    return 'return_refund';
  }

  // Product information
  if (/(tell me about|information about|details about|do you have|do you sell)/i.test(message)) {
    return 'product_inquiry';
  }

  // Shipping information
  if (/(shipping|delivery|how long|when.*arrive|shipping cost)/i.test(message)) {
    return 'shipping';
  }

  // Payment/billing
  if (/(payment|billing|charge|credit card|pay)/i.test(message)) {
    return 'payment';
  }

  // Account issues
  if (/(account|login|password|sign in|reset)/i.test(message)) {
    return 'account';
  }

  return 'general';
}

module.exports = {
  extractOrderNumber,
  extractAllOrderNumbers,
  isOrderInquiry,
  extractEmail,
  extractProductQuery,
  detectIntent
};

