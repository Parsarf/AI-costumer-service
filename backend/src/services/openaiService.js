const OpenAI = require('openai');
const logger = require('../utils/logger');

// Initialize OpenAI with fallback for missing API key
let openai = null;
if (process.env.OPENAI_API_KEY) {
  try {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    logger.info('OpenAI service initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize OpenAI:', error);
  }
} else {
  logger.warn('OPENAI_API_KEY not set - AI features will be unavailable');
}

const OPENAI_MODEL = 'gpt-4-turbo-preview';
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

When you need to escalate, respond with: "I understand this requires special attention from our team. Let me connect you with our support team who can better assist you. They'll reach out to you at [email] within 24 hours."`;

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
 * Send message to OpenAI and get response
 */
async function sendMessage(messages, systemPrompt, options = {}) {
  const startTime = Date.now();
  
  try {
    // Check if OpenAI client is available
    if (!openai) {
      logger.warn('OpenAI client not available - returning fallback response');
      return {
        success: false,
        message: 'AI service is currently unavailable. Please contact support directly.',
        usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
        responseTime: Date.now() - startTime
      };
    }

    logger.info('Sending request to OpenAI API', {
      messageCount: messages.length,
      model: OPENAI_MODEL
    });

    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      max_tokens: options.maxTokens || MAX_TOKENS,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      temperature: options.temperature || 1.0
    });

    const responseTime = Date.now() - startTime;
    
    logger.info('Received OpenAI response', {
      responseTime,
      promptTokens: response.usage.prompt_tokens,
      completionTokens: response.usage.completion_tokens,
      totalTokens: response.usage.total_tokens
    });

    return {
      content: response.choices[0].message.content,
      model: response.model,
      usage: {
        input_tokens: response.usage.prompt_tokens,
        output_tokens: response.usage.completion_tokens,
        total_tokens: response.usage.total_tokens
      },
      responseTime
    };
  } catch (error) {
    logger.error('OpenAI API error:', error);
    
    // Handle specific error types
    if (error.status === 429) {
      throw new Error('Rate limit exceeded. Please try again in a moment.');
    } else if (error.status === 401) {
      throw new Error('Invalid OpenAI API key.');
    } else {
      throw new Error('Failed to generate response. Please try again.');
    }
  }
}

/**
 * Format conversation history for OpenAI API
 */
function formatMessages(messageHistory) {
  return messageHistory.map(msg => ({
    role: msg.role,
    content: msg.content
  }));
}

module.exports = {
  buildSystemPrompt,
  sendMessage,
  formatMessages
};

