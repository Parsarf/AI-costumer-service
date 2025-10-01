import { useState, useCallback, useRef } from 'react';
import { sendChatMessage, getWelcomeMessage } from '../services/api';

function useChat(config) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [error, setError] = useState(null);
  
  const { shop, apiUrl } = config;
  const loadedWelcome = useRef(false);

  const loadWelcomeMessage = useCallback(async () => {
    if (loadedWelcome.current) return;
    
    try {
      const data = await getWelcomeMessage(shop, apiUrl);
      if (data.message) {
        setMessages([{
          role: 'assistant',
          content: data.message,
          timestamp: new Date().toISOString()
        }]);
      }
      loadedWelcome.current = true;
    } catch (err) {
      console.error('Failed to load welcome message:', err);
    }
  }, [shop, apiUrl]);

  const sendMessage = useCallback(async (content) => {
    if (!content.trim()) return;

    // Add user message to UI immediately
    const userMessage = {
      role: 'user',
      content: content.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      // Get customer info from browser (if available)
      const customerEmail = localStorage.getItem('customer_email') || null;
      const customerName = localStorage.getItem('customer_name') || null;

      // Send message to backend
      const data = await sendChatMessage({
        message: content.trim(),
        conversationId,
        shop,
        customerEmail,
        customerName
      }, apiUrl);

      // Update conversation ID
      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId);
        localStorage.setItem('conversationId', data.conversationId);
      }

      // Add assistant response
      const assistantMessage = {
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toISOString(),
        metadata: data.metadata
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Handle escalation
      if (data.needsEscalation) {
        console.log('Conversation escalated to human support');
      }

    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Failed to send message. Please try again.');
      
      // Add error message
      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, I\'m having trouble processing your message right now. Please try again in a moment.',
        timestamp: new Date().toISOString(),
        isError: true
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, shop, apiUrl]);

  return {
    messages,
    isLoading,
    error,
    conversationId,
    sendMessage,
    loadWelcomeMessage
  };
}

export default useChat;

