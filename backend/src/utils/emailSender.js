const logger = require('./logger');

/**
 * Send email (stub implementation - integrate with SendGrid, AWS SES, etc.)
 * For MVP, just log the email. Integrate real email service later.
 */
async function sendEmail({ to, subject, html, text }) {
  try {
    // TODO: Integrate with real email service (SendGrid, AWS SES, Mailgun, etc.)
    // Example with SendGrid:
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    // await sgMail.send({ to, from: process.env.FROM_EMAIL, subject, html });

    logger.info('Email sent (stub)', { to, subject });
    
    // For development, just log the email content
    if (process.env.NODE_ENV === 'development') {
      console.log('\n=== EMAIL ===');
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log('---');
      console.log(text || html);
      console.log('=============\n');
    }

    return true;
  } catch (error) {
    logger.error('Failed to send email:', error);
    return false;
  }
}

/**
 * Send escalation notification
 */
async function sendEscalationEmail(store, conversation, transcript) {
  const supportEmail = store.settings?.escalationEmail || store.settings?.supportEmail;

  if (!supportEmail) {
    logger.warn('No support email configured', { shop: store.shop });
    return false;
  }

  const subject = `[${store.storeName || store.shop}] Support Escalation - ${conversation.id}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">🚨 Support Escalation Required</h2>
      
      <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Store:</strong> ${store.shop}</p>
        <p><strong>Conversation ID:</strong> ${conversation.id}</p>
        <p><strong>Customer:</strong> ${conversation.customerEmail || 'Unknown'}</p>
        <p><strong>Status:</strong> ${conversation.status}</p>
        <p><strong>Messages:</strong> ${conversation.messageCount}</p>
        ${conversation.escalationReason ? `<p><strong>Reason:</strong> ${conversation.escalationReason}</p>` : ''}
      </div>

      <h3 style="color: #333;">Conversation Transcript:</h3>
      <div style="background: #fff; border: 1px solid #ddd; padding: 15px; border-radius: 5px;">
        <pre style="white-space: pre-wrap; font-size: 13px;">${transcript}</pre>
      </div>

      <div style="margin-top: 20px; padding: 15px; background: #e3f2fd; border-radius: 5px;">
        <p style="margin: 0;">
          <strong>Action Required:</strong> Please review this conversation and reach out to the customer 
          ${conversation.customerEmail ? `at <a href="mailto:${conversation.customerEmail}">${conversation.customerEmail}</a>` : ''} 
          within 24 hours.
        </p>
      </div>
    </div>
  `;

  return await sendEmail({
    to: supportEmail,
    subject,
    html
  });
}

/**
 * Send welcome email to new store
 */
async function sendWelcomeEmail(store) {
  const email = store.settings?.supportEmail;

  if (!email) {
    return false;
  }

  const subject = `Welcome to AI Support Bot! 🎉`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #4F46E5;">Welcome to AI Support Bot!</h1>
      
      <p>Hi there! 👋</p>
      
      <p>Your AI-powered customer support bot is now active on <strong>${store.shop}</strong>!</p>
      
      <h2 style="color: #333;">What's Next?</h2>
      
      <ol>
        <li><strong>Customize Your Bot:</strong> Visit your dashboard to set up your return policy, shipping information, and bot personality.</li>
        <li><strong>Test It Out:</strong> Visit your store and try the chat widget in the bottom-right corner.</li>
        <li><strong>Monitor Conversations:</strong> View all customer conversations and analytics in your dashboard.</li>
      </ol>

      <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Quick Links:</h3>
        <ul style="margin-bottom: 0;">
          <li><a href="${process.env.APP_URL}/dashboard?shop=${store.shop}">Dashboard</a></li>
          <li><a href="${process.env.APP_URL}/docs">Documentation</a></li>
          <li><a href="mailto:support@yourdomain.com">Support</a></li>
        </ul>
      </div>

      <p>If you have any questions, just reply to this email. We're here to help!</p>
      
      <p>Best regards,<br>The AI Support Bot Team</p>
    </div>
  `;

  return await sendEmail({
    to: email,
    subject,
    html
  });
}

module.exports = {
  sendEmail,
  sendEscalationEmail,
  sendWelcomeEmail
};

