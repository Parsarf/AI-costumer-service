const logger = require('../utils/logger');
const { sendEmail } = require('../utils/emailSender');

/**
 * Check if message or response contains escalation triggers
 */
function checkEscalation(userMessage, claudeResponse = '') {
  const escalationTriggers = [
    // Claude explicitly suggests escalation
    /connect you.*support/i,
    /transfer.*human/i,
    /reach out.*team/i,
    /specialist.*assist/i,
    
    // User explicitly requests human
    /speak.*human/i,
    /talk.*person/i,
    /speak.*someone/i,
    /talk.*agent/i,
    /manager/i,
    /supervisor/i,
    /human support/i,
    
    // High-risk topics that require human intervention
    /refund/i,
    /charge.*twice/i,
    /charged.*wrong/i,
    /billing.*error/i,
    /fraud/i,
    /dispute/i,
    /chargeback/i,
    /unauthorized/i,
    /cancel.*subscription/i,
    /delete.*account/i,
    /data.*breach/i,
    /hacked/i,
    
    // Frustration indicators
    /this.*ridiculous/i,
    /waste.*time/i,
    /terrible.*service/i,
    /unacceptable/i,
    /lawyer/i,
    /sue/i,
    /better business bureau/i,
    /complaint/i
  ];

  const combinedText = `${userMessage} ${claudeResponse}`;
  
  for (const trigger of escalationTriggers) {
    if (trigger.test(combinedText)) {
      logger.info('Escalation trigger detected', { 
        trigger: trigger.source,
        userMessage: userMessage.substring(0, 100)
      });
      return true;
    }
  }

  return false;
}

/**
 * Analyze conversation sentiment and context for escalation
 */
function analyzeEscalationNeed(conversation, newMessage) {
  let escalationScore = 0;
  const reasons = [];

  // Check message count - long conversations might need human touch
  if (conversation.messageCount > 8) {
    escalationScore += 20;
    reasons.push('Long conversation (8+ messages)');
  }

  // Check for repeated questions
  const recentMessages = conversation.messages || [];
  const userMessages = recentMessages.filter(m => m.role === 'user');
  if (userMessages.length >= 3) {
    const lastThree = userMessages.slice(-3).map(m => m.content.toLowerCase());
    const hasSimilar = lastThree.some((msg, idx) => 
      idx > 0 && lastThree.slice(0, idx).some(prevMsg => 
        similarity(msg, prevMsg) > 0.7
      )
    );
    
    if (hasSimilar) {
      escalationScore += 30;
      reasons.push('Customer repeating similar questions');
    }
  }

  // Check for negative keywords
  const negativeKeywords = [
    'disappointed', 'frustrated', 'angry', 'upset', 'horrible',
    'terrible', 'worst', 'useless', 'waste', 'scam'
  ];
  
  const hasNegative = negativeKeywords.some(keyword => 
    newMessage.toLowerCase().includes(keyword)
  );
  
  if (hasNegative) {
    escalationScore += 25;
    reasons.push('Negative sentiment detected');
  }

  // Check for urgency
  const urgencyKeywords = ['urgent', 'asap', 'immediately', 'emergency', 'now'];
  const hasUrgency = urgencyKeywords.some(keyword => 
    newMessage.toLowerCase().includes(keyword)
  );
  
  if (hasUrgency) {
    escalationScore += 15;
    reasons.push('Urgent request');
  }

  return {
    shouldEscalate: escalationScore >= 40,
    score: escalationScore,
    reasons
  };
}

/**
 * Simple string similarity (Jaccard index)
 */
function similarity(str1, str2) {
  const words1 = new Set(str1.split(/\s+/));
  const words2 = new Set(str2.split(/\s+/));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

/**
 * Notify support team about escalated conversation
 */
async function notifyEscalation(conversation, store, reason) {
  try {
    const supportEmail = store.settings.escalationEmail || store.settings.supportEmail;
    
    if (!supportEmail) {
      logger.warn('No escalation email configured for store', { shop: store.shop });
      return false;
    }

    const messages = conversation.messages || [];
    const transcript = messages.map(m => 
      `${m.role.toUpperCase()}: ${m.content}`
    ).join('\n\n');

    const emailContent = {
      to: supportEmail,
      subject: `[Support Bot] Escalation Required - ${conversation.id}`,
      html: `
        <h2>Conversation Escalation</h2>
        <p><strong>Reason:</strong> ${reason}</p>
        <p><strong>Store:</strong> ${store.shop}</p>
        <p><strong>Customer:</strong> ${conversation.customerEmail || 'Unknown'}</p>
        <p><strong>Conversation ID:</strong> ${conversation.id}</p>
        <p><strong>Messages:</strong> ${conversation.messageCount}</p>
        
        <h3>Conversation Transcript:</h3>
        <pre style="background: #f5f5f5; padding: 15px; border-radius: 5px;">
${transcript}
        </pre>
        
        <p>Please review this conversation and reach out to the customer at: ${conversation.customerEmail}</p>
      `
    };

    await sendEmail(emailContent);
    
    logger.info('Escalation notification sent', { 
      conversationId: conversation.id,
      supportEmail 
    });

    return true;
  } catch (error) {
    logger.error('Failed to send escalation notification:', error);
    return false;
  }
}

/**
 * Get escalation message for customer
 */
function getEscalationMessage(storeName, supportEmail) {
  return `I understand this requires special attention from our team. I've notified our support specialists about your issue, and they'll reach out to you${supportEmail ? ` at ${supportEmail}` : ''} within 24 hours. Is there anything else I can help you with in the meantime?`;
}

module.exports = {
  checkEscalation,
  analyzeEscalationNeed,
  notifyEscalation,
  getEscalationMessage
};

