import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/ChatWidget.css';
import App from './App';

// Initialize widget
window.SupportBotWidget = window.SupportBotWidget || {};

window.SupportBotWidget.init = function(config) {
  const root = document.getElementById('support-bot-widget-root');
  
  if (!root) {
    console.error('Support Bot: Widget root element not found');
    return;
  }

  const reactRoot = ReactDOM.createRoot(root);
  reactRoot.render(
    <React.StrictMode>
      <App config={config} />
    </React.StrictMode>
  );
};

// Auto-initialize if config is already available
if (window.SupportBotWidgetConfig) {
  window.SupportBotWidget.init(window.SupportBotWidgetConfig);
}

