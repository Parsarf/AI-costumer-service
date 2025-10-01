import React, { useState, useEffect } from 'react';
import ChatBubble from './components/ChatBubble';
import ChatWindow from './components/ChatWindow';
import useChat from './hooks/useChat';

function App({ config }) {
  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useState({
    primaryColor: '#4F46E5',
    position: 'bottom-right'
  });

  const {
    messages,
    isLoading,
    conversationId,
    sendMessage,
    loadWelcomeMessage
  } = useChat(config);

  useEffect(() => {
    // Load welcome message and theme on mount
    loadWelcomeMessage();

    // Listen for external commands
    const handleMessage = (event) => {
      if (event.data.type === 'SUPPORT_BOT_OPEN') {
        setIsOpen(true);
      } else if (event.data.type === 'SUPPORT_BOT_CLOSE') {
        setIsOpen(false);
      } else if (event.data.type === 'SUPPORT_BOT_TOGGLE') {
        setIsOpen(prev => !prev);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [loadWelcomeMessage]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleSend = async (message) => {
    await sendMessage(message);
  };

  return (
    <div className="support-bot-widget" style={{ '--primary-color': theme.primaryColor }}>
      {!isOpen && (
        <ChatBubble onClick={handleToggle} position={theme.position} />
      )}
      
      {isOpen && (
        <ChatWindow
          messages={messages}
          isLoading={isLoading}
          onSend={handleSend}
          onClose={handleClose}
          position={theme.position}
        />
      )}
    </div>
  );
}

export default App;

