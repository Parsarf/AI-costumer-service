/**
 * AI Assistant Widget - Storefront Chat Interface
 * This script creates a floating chat widget that communicates with the app proxy
 * Designed for Shopify Theme App Extensions
 */

(function() {
  'use strict';

  // Configuration
  let config = {};
  let isOpen = false;
  let conversationId = null;
  let messages = [];
  let autoOpenTimer = null;

  // DOM elements
  let chatBubble, chatWindow, messageList, inputBox, sendButton, closeButton;

  // Initialize widget
  window.AIAssistantWidget = {
    init: function() {
      const rootElement = document.getElementById('ai-assistant-root');
      if (!rootElement) {
        console.error('AI Assistant: Root element not found');
        return;
      }

      // Read configuration from data attributes
      config = {
        shop: rootElement.dataset.shop,
        apiUrl: rootElement.dataset.apiUrl,
        welcomeMessage: rootElement.dataset.welcomeMessage || 'Hi! How can I help you today?',
        primaryColor: rootElement.dataset.primaryColor || '#4F46E5',
        position: rootElement.dataset.position || 'bottom-right',
        showMobile: rootElement.dataset.showMobile === 'true',
        autoOpenDelay: parseInt(rootElement.dataset.autoOpen) || 0
      };

      // Check if should show on mobile
      if (!config.showMobile && window.innerWidth <= 768) {
        return;
      }

      createWidget();
      loadConversationId();
      setupAutoOpen();

      // Show the root element
      rootElement.style.display = 'block';
    }
  };

  function createWidget() {
    // Create chat bubble
    chatBubble = document.createElement('div');
    chatBubble.className = 'ai-assistant-bubble';
    chatBubble.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H6L4 18V4H20V16Z" fill="white"/>
        <path d="M7 9H17V11H7V9ZM7 12H14V14H7V12ZM7 6H17V8H7V6Z" fill="white"/>
      </svg>
    `;
    chatBubble.style.cssText = `
      position: fixed;
      ${config.position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
      bottom: 20px;
      width: 60px;
      height: 60px;
      background: linear-gradient(135deg, ${config.primaryColor} 0%, ${adjustColor(config.primaryColor, -20)} 100%);
      border-radius: 50%;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999999;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      border: none;
      outline: none;
    `;

    // Create chat window
    chatWindow = document.createElement('div');
    chatWindow.className = 'ai-assistant-window';
    chatWindow.style.cssText = `
      position: fixed;
      ${config.position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
      bottom: 100px;
      width: 380px;
      max-width: calc(100vw - 40px);
      height: 500px;
      max-height: calc(100vh - 120px);
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.15);
      display: none;
      flex-direction: column;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      border: 1px solid #e9ecef;
    `;

    chatWindow.innerHTML = `
      <div class="ai-assistant-header" style="
        background: linear-gradient(135deg, ${config.primaryColor} 0%, ${adjustColor(config.primaryColor, -20)} 100%);
        color: white;
        padding: 16px 20px;
        border-radius: 12px 12px 0 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-shrink: 0;
      ">
        <div>
          <h3 style="margin: 0; font-size: 16px; font-weight: 600; line-height: 1.2;">AI Support</h3>
          <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.9; line-height: 1.2;">Online now</p>
        </div>
        <button class="ai-assistant-close" style="
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          line-height: 1;
          transition: background-color 0.2s ease;
        ">×</button>
      </div>
      <div class="ai-assistant-messages" style="
        flex: 1;
        overflow-y: auto;
        padding: 20px;
        background: #f8f9fa;
        display: flex;
        flex-direction: column;
        gap: 12px;
      "></div>
      <div class="ai-assistant-input" style="
        padding: 16px;
        border-top: 1px solid #e9ecef;
        background: white;
        border-radius: 0 0 12px 12px;
        flex-shrink: 0;
      ">
        <div style="display: flex; gap: 8px; align-items: center;">
          <input type="text" placeholder="Type your message..." style="
            flex: 1;
            padding: 12px 16px;
            border: 1px solid #e9ecef;
            border-radius: 24px;
            outline: none;
            font-size: 14px;
            font-family: inherit;
            transition: border-color 0.2s ease;
          ">
          <button class="ai-assistant-send" style="
            width: 40px;
            height: 40px;
            background: ${config.primaryColor};
            color: white;
            border: none;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            transition: background-color 0.2s ease;
            flex-shrink: 0;
          ">→</button>
        </div>
      </div>
    `;

    // Get references to elements
    messageList = chatWindow.querySelector('.ai-assistant-messages');
    inputBox = chatWindow.querySelector('input');
    sendButton = chatWindow.querySelector('.ai-assistant-send');
    closeButton = chatWindow.querySelector('.ai-assistant-close');

    // Add to DOM
    document.body.appendChild(chatBubble);
    document.body.appendChild(chatWindow);

    // Add event listeners
    chatBubble.addEventListener('click', toggleChat);
    closeButton.addEventListener('click', closeChat);
    sendButton.addEventListener('click', sendMessage);
    inputBox.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        sendMessage();
      }
    });

    // Add hover effects
    chatBubble.addEventListener('mouseenter', function() {
      this.style.transform = 'scale(1.1)';
      this.style.boxShadow = '0 6px 24px rgba(0,0,0,0.2)';
    });
    chatBubble.addEventListener('mouseleave', function() {
      this.style.transform = 'scale(1)';
      this.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)';
    });

    closeButton.addEventListener('mouseenter', function() {
      this.style.backgroundColor = 'rgba(255,255,255,0.3)';
    });
    closeButton.addEventListener('mouseleave', function() {
      this.style.backgroundColor = 'rgba(255,255,255,0.2)';
    });

    sendButton.addEventListener('mouseenter', function() {
      this.style.backgroundColor = adjustColor(config.primaryColor, -10);
    });
    sendButton.addEventListener('mouseleave', function() {
      this.style.backgroundColor = config.primaryColor;
    });

    inputBox.addEventListener('focus', function() {
      this.style.borderColor = config.primaryColor;
    });
    inputBox.addEventListener('blur', function() {
      this.style.borderColor = '#e9ecef';
    });

    // Add welcome message
    addMessage('assistant', config.welcomeMessage);
  }

  function setupAutoOpen() {
    if (config.autoOpenDelay > 0) {
      autoOpenTimer = setTimeout(() => {
        if (!isOpen) {
          toggleChat();
        }
      }, config.autoOpenDelay * 1000);
    }
  }

  function toggleChat() {
    isOpen = !isOpen;
    chatWindow.style.display = isOpen ? 'flex' : 'none';
    chatBubble.style.transform = isOpen ? 'scale(0.9)' : 'scale(1)';
    
    if (isOpen) {
      inputBox.focus();
      // Clear auto-open timer if chat is opened manually
      if (autoOpenTimer) {
        clearTimeout(autoOpenTimer);
        autoOpenTimer = null;
      }
    }
  }

  function closeChat() {
    isOpen = false;
    chatWindow.style.display = 'none';
    chatBubble.style.transform = 'scale(1)';
  }

  function addMessage(role, content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `ai-assistant-message ai-assistant-message-${role}`;
    messageDiv.style.cssText = `
      display: flex;
      ${role === 'user' ? 'justify-content: flex-end;' : 'justify-content: flex-start;'}
    `;

    const messageContent = document.createElement('div');
    messageContent.style.cssText = `
      max-width: 80%;
      padding: 12px 16px;
      border-radius: 12px;
      font-size: 14px;
      line-height: 1.4;
      word-wrap: break-word;
      ${role === 'user' 
        ? `background: ${config.primaryColor}; color: white; border-bottom-right-radius: 4px;`
        : 'background: white; color: #333; border-bottom-left-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);'
      }
    `;
    messageContent.textContent = content;

    messageDiv.appendChild(messageContent);
    messageList.appendChild(messageDiv);
    messageList.scrollTop = messageList.scrollHeight;

    messages.push({ role, content });
  }

  function showTyping() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'ai-assistant-typing';
    typingDiv.style.cssText = `
      display: flex;
      justify-content: flex-start;
    `;

    const typingContent = document.createElement('div');
    typingContent.style.cssText = `
      background: white;
      padding: 12px 16px;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      display: flex;
      gap: 4px;
      align-items: center;
    `;

    for (let i = 0; i < 3; i++) {
      const dot = document.createElement('div');
      dot.style.cssText = `
        width: 8px;
        height: 8px;
        background: #999;
        border-radius: 50%;
        animation: ai-typing 1.4s infinite;
        animation-delay: ${i * 0.2}s;
      `;
      typingContent.appendChild(dot);
    }

    typingDiv.appendChild(typingContent);
    messageList.appendChild(typingContent);
    messageList.scrollTop = messageList.scrollHeight;

    return typingDiv;
  }

  function removeTyping(typingElement) {
    if (typingElement && typingElement.parentNode) {
      typingElement.parentNode.removeChild(typingElement);
    }
  }

  async function sendMessage() {
    const message = inputBox.value.trim();
    if (!message) return;

    // Add user message
    addMessage('user', message);
    inputBox.value = '';

    // Show typing indicator
    const typingElement = showTyping();

    try {
      // Send to app proxy
      const response = await fetch(`/apps/aibot/chat?shop=${config.shop}&timestamp=${Date.now()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          conversationId: conversationId
        })
      });

      const data = await response.json();

      // Remove typing indicator
      removeTyping(typingElement);

      if (data.reply) {
        addMessage('assistant', data.reply);
        if (data.conversationId) {
          conversationId = data.conversationId;
          localStorage.setItem('ai_assistant_conversation_id', conversationId);
        }
      } else {
        addMessage('assistant', 'Sorry, I encountered an error. Please try again.');
      }

    } catch (error) {
      console.error('AI Assistant Chat error:', error);
      removeTyping(typingElement);
      addMessage('assistant', 'Sorry, I\'m having trouble connecting. Please try again in a moment.');
    }
  }

  function loadConversationId() {
    conversationId = localStorage.getItem('ai_assistant_conversation_id');
  }

  function adjustColor(color, amount) {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * amount);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  }

  // Add CSS for typing animation
  if (!document.getElementById('ai-assistant-styles')) {
    const style = document.createElement('style');
    style.id = 'ai-assistant-styles';
    style.textContent = `
      @keyframes ai-typing {
        0%, 60%, 100% {
          transform: translateY(0);
          opacity: 0.7;
        }
        30% {
          transform: translateY(-10px);
          opacity: 1;
        }
      }
      
      .ai-assistant-messages::-webkit-scrollbar {
        width: 6px;
      }
      
      .ai-assistant-messages::-webkit-scrollbar-track {
        background: transparent;
      }
      
      .ai-assistant-messages::-webkit-scrollbar-thumb {
        background: #ddd;
        border-radius: 3px;
      }
      
      .ai-assistant-messages::-webkit-scrollbar-thumb:hover {
        background: #bbb;
      }

      /* Mobile responsiveness */
      @media (max-width: 768px) {
        .ai-assistant-window {
          width: calc(100vw - 40px) !important;
          height: calc(100vh - 120px) !important;
          right: 20px !important;
          left: 20px !important;
          bottom: 100px !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      if (window.AIAssistantWidget) {
        window.AIAssistantWidget.init();
      }
    });
  } else {
    if (window.AIAssistantWidget) {
      window.AIAssistantWidget.init();
    }
  }

})();