const Anthropic = require('@anthropic-ai/sdk');
const logger = require('../utils/logger');

const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY
});

const CLAUDE_MODEL = 'claude-sonnet-4-20250514';
const MAX_TOKENS = 1024;

/**
 * Build system prompt with store context and policies
 */
function buildSystemPrompt(storeSettings, orderData = null, productData = null) {
  const { 
    storeName, 
    welcomeMessage, 
    returnPolicy, 
    shippingPolicy, 
    supportEmail,
    botPersonality = 'friendly'
  } = storeSettings;

  let prompt = `You are a helpful customer support agent for ${storeName || 'this store'}.

PERSONALITY: ${botPersonality} - Be ${botPersonality === 'friendly' ? 'warm and conversational' : botPersonality === 'professional' ? 'polite and formal' : 'helpful and efficient'}.

STORE POLICIES:
- Return Policy: ${returnPolicy || 'Please contact support for return information.'}
- Shipping Policy: ${shippingPolicy || 'Please contact support for shipping information.'}
- Support Email: ${supportEmail || 'support@store.com'}

INSTRUCTIONS:
- Be helpful, empathetic, and solution-oriented
- Keep responses concise (2-4 sentences unless detailed explanation needed)
- If you don't have specific information, be honest and offer to escalate
- For refunds, account access issues, billing disputes, or fraud concerns, ALWAYS escalate to human support
- Never make up order information - only use data provided to you
- Use emojis sparingly (max 1-2 per response) and only when appropriate
- If customer seems frustrated or upset, show extra empathy and consider escalation

ESCALATION TRIGGERS:
- Customer explicitly requests human support
- Issues involving money (refunds, chargebacks, billing errors)
- Account access problems
- Fraud or security concerns
- Complex technical issues you cannot resolve
- Customer is clearly frustrated after 2-3 exchanges

When you need to escalate, respond with: "I understand this requires special attention. Let me connect you with our support team who can better assist you. They'll reach out to you at [email] within 24 hours."`;

  if (orderData) {
    prompt += `\n\nCURRENT ORDER INFORMATION:
- Order Number: ${orderData.name}
- Order Date: ${new Date(orderData.created_at).toLocaleDateString()}
- Status: ${orderData.financial_status} / ${orderData.fulfillment_status || 'Unfulfilled'}
- Total: ${orderData.currency} ${orderData.total_price}
- Items: ${orderData.line_items.map(item => `${item.quantity}x ${item.name}`).join(', ')}`;

    if (orderData.fulfillments && orderData.fulfillments.length > 0) {
      const fulfillment = orderData.fulfillments[0];
      prompt += `\n- Shipping Status: ${fulfillment.status}`;
      if (fulfillment.tracking_number) {
        prompt += `\n- Tracking Number: ${fulfillment.tracking_number}`;
        if (fulfillment.tracking_url) {
          prompt += `\n- Track Package: ${fulfillment.tracking_url}`;
        }
      }
    } else {
      prompt += `\n- Shipping: Order is being prepared for shipment`;
    }
  }

  if (productData && productData.length > 0) {
    prompt += `\n\nRELEVANT PRODUCTS:`;
    productData.forEach(product => {
      prompt += `\n- ${product.title}: ${product.body_html?.replace(/<[^>]*>/g, '').substring(0, 200)}`;
      if (product.variants && product.variants[0]) {
        prompt += ` (Price: ${product.variants[0].price})`;
      }
    });
  }

  return prompt;
}

/**
 * Send message to Claude and get response
 */
async function sendMessage(messages, systemPrompt, options = {}) {
  const startTime = Date.now();
  
  try {
    logger.info('Sending request to Claude API', {
      messageCount: messages.length,
      model: CLAUDE_MODEL
    });

    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: options.maxTokens || MAX_TOKENS,
      system: systemPrompt,
      messages: messages,
      temperature: options.temperature || 1.0
    });

    const responseTime = Date.now() - startTime;
    
    logger.info('Received Claude response', {
      responseTime,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens
    });

    return {
      content: response.content[0].text,
      model: response.model,
      usage: response.usage,
      responseTime
    };
  } catch (error) {
    logger.error('Claude API error:', error);
    
    // Handle specific error types
    if (error.status === 429) {
      throw new Error('Rate limit exceeded. Please try again in a moment.');
    } else if (error.status === 401) {
      throw new Error('Invalid Claude API key.');
    } else {
      throw new Error('Failed to generate response. Please try again.');
    }
  }
}

/**
 * Format conversation history for Claude API
 */
function formatMessages(messageHistory) {
  return messageHistory.map(msg => ({
    role: msg.role === 'assistant' ? 'assistant' : 'user',
    content: msg.content
  }));
}

/**
 * Stream response from Claude (for future implementation)
 */
async function* streamMessage(messages, systemPrompt) {
  try {
    const stream = await anthropic.messages.stream({
      model: CLAUDE_MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages: messages
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        yield chunk.delta.text;
      }
    }
  } catch (error) {
    logger.error('Claude streaming error:', error);
    throw error;
  }
}

module.exports = {
  buildSystemPrompt,
  sendMessage,
  formatMessages,
  streamMessage
};

