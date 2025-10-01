/**
 * Support Bot Widget Loader
 * This script is injected into Shopify stores via script tag
 */
(function() {
  'use strict';

  // Prevent multiple initializations
  if (window.SupportBotWidget) {
    return;
  }

  // Get shop from script tag or query parameter
  const currentScript = document.currentScript;
  const scriptSrc = currentScript ? currentScript.src : '';
  const urlParams = new URLSearchParams(scriptSrc.split('?')[1] || '');
  const shop = urlParams.get('shop') || currentScript?.getAttribute('data-shop');

  if (!shop) {
    console.error('Support Bot: Missing shop parameter');
    return;
  }

  // Configuration
  const API_URL = scriptSrc.includes('localhost') 
    ? 'http://localhost:3001' 
    : scriptSrc.split('/widget/')[0];

  // Create widget container
  const widgetContainer = document.createElement('div');
  widgetContainer.id = 'support-bot-widget-root';
  document.body.appendChild(widgetContainer);

  // Load CSS
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `${API_URL}/widget/static/css/main.css`;
  document.head.appendChild(link);

  // Load React bundle
  const script = document.createElement('script');
  script.src = `${API_URL}/widget/static/js/main.js`;
  script.async = true;
  script.onload = function() {
    if (window.SupportBotWidget && window.SupportBotWidget.init) {
      window.SupportBotWidget.init({
        shop: shop,
        apiUrl: API_URL,
        position: 'bottom-right'
      });
    }
  };
  document.body.appendChild(script);

  // Export widget API
  window.SupportBotWidget = {
    open: function() {
      window.postMessage({ type: 'SUPPORT_BOT_OPEN' }, '*');
    },
    close: function() {
      window.postMessage({ type: 'SUPPORT_BOT_CLOSE' }, '*');
    },
    toggle: function() {
      window.postMessage({ type: 'SUPPORT_BOT_TOGGLE' }, '*');
    }
  };
})();

