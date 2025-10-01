/**
 * Build comprehensive system prompt for Claude based on context
 */
function buildContextualPrompt(store, conversation, intent, orderData, productData) {
  const { settings } = store;
  let prompt = '';

  // Add store-specific personality
  const personality = getPersonalityTrait(settings.botPersonality || 'friendly');
  prompt += personality + '\n\n';

  // Add intent-specific instructions
  const intentInstructions = getIntentInstructions(intent);
  if (intentInstructions) {
    prompt += intentInstructions + '\n\n';
  }

  // Add conversation context
  if (conversation && conversation.messageCount > 5) {
    prompt += `NOTE: This is an extended conversation (${conversation.messageCount} messages). Consider summarizing or offering to escalate if the issue isn't resolving.\n\n`;
  }

  return prompt;
}

/**
 * Get personality traits based on bot personality setting
 */
function getPersonalityTrait(personality) {
  const personalities = {
    friendly: 'You are warm, conversational, and use a casual tone. Use emojis occasionally (1-2 per response) to seem approachable.',
    professional: 'You are polite, formal, and precise. Avoid emojis and casual language. Be respectful and thorough.',
    efficient: 'You are direct and solution-focused. Get to the point quickly with minimal small talk.',
    empathetic: 'You are understanding and patient. Show empathy and validate customer feelings before solving problems.'
  };

  return personalities[personality] || personalities.friendly;
}

/**
 * Get intent-specific instructions
 */
function getIntentInstructions(intent) {
  const instructions = {
    order_tracking: `
FOCUS: Order status and tracking
- Provide clear, specific information about order location and estimated delivery
- If tracking number is available, mention it explicitly
- Explain what the current status means in simple terms
- Reassure the customer if shipment is on track`,

    return_refund: `
FOCUS: Returns and refunds
- Explain the return policy clearly
- Provide step-by-step instructions for initiating a return
- For refund timelines, be specific based on store policy
- ESCALATE if customer is requesting a refund directly (don't process refunds yourself)`,

    product_inquiry: `
FOCUS: Product information
- Provide accurate details about products
- Highlight key features and benefits
- Mention pricing clearly
- Suggest related products if relevant`,

    shipping: `
FOCUS: Shipping and delivery
- Explain shipping options and costs
- Provide estimated delivery timeframes
- Clarify shipping policy
- Mention any current shipping promotions`,

    payment: `
FOCUS: Payment and billing
- ESCALATE immediately for billing disputes or unauthorized charges
- For general payment questions, explain available payment methods
- Never handle refunds directly - always escalate`,

    account: `
FOCUS: Account issues
- ESCALATE for password resets and account access issues
- Provide general account management guidance
- Never ask for passwords or sensitive information`
  };

  return instructions[intent] || '';
}

/**
 * Build summary of conversation for handoff
 */
function buildConversationSummary(conversation, messages) {
  if (!messages || messages.length === 0) {
    return 'No messages in conversation.';
  }

  const userMessages = messages.filter(m => m.role === 'user');
  const assistantMessages = messages.filter(m => m.role === 'assistant');

  let summary = `Conversation Summary (ID: ${conversation.id})\n`;
  summary += `Customer: ${conversation.customerEmail || 'Unknown'}\n`;
  summary += `Total Messages: ${messages.length} (${userMessages.length} from customer)\n`;
  summary += `Status: ${conversation.status}\n`;
  
  if (conversation.metadata && Object.keys(conversation.metadata).length > 0) {
    summary += `Context: ${JSON.stringify(conversation.metadata)}\n`;
  }

  summary += `\nKey Points:\n`;
  
  // Extract key points from customer messages
  userMessages.slice(0, 5).forEach((msg, idx) => {
    summary += `${idx + 1}. Customer: ${msg.content.substring(0, 100)}${msg.content.length > 100 ? '...' : ''}\n`;
  });

  return summary;
}

/**
 * Build greeting message for new conversations
 */
function buildGreetingMessage(storeSettings, customerName = null) {
  const { welcomeMessage, storeName } = storeSettings;
  
  if (welcomeMessage) {
    // Personalize with customer name if available
    if (customerName) {
      return welcomeMessage.replace(/Hi!/g, `Hi ${customerName}!`);
    }
    return welcomeMessage;
  }

  // Default greeting
  const greeting = customerName ? `Hi ${customerName}!` : 'Hi there!';
  return `${greeting} 👋 Welcome to ${storeName || 'our store'}. I'm here to help with any questions about orders, returns, or products. How can I assist you today?`;
}

/**
 * Build escalation handoff message
 */
function buildEscalationMessage(store, reason, conversationId) {
  const { storeName, settings } = store;
  const supportEmail = settings.escalationEmail || settings.supportEmail;

  let message = `I want to make sure you get the best help possible. I've connected your inquiry with our support team`;
  
  if (supportEmail) {
    message += ` - they'll reach out to you via email within 24 hours`;
  }
  
  message += `. Your conversation ID is ${conversationId} if you need to reference it.`;
  
  if (reason && reason !== 'manual') {
    message += `\n\nIn the meantime, is there anything else I can help you with?`;
  }

  return message;
}

module.exports = {
  buildContextualPrompt,
  getPersonalityTrait,
  getIntentInstructions,
  buildConversationSummary,
  buildGreetingMessage,
  buildEscalationMessage
};

