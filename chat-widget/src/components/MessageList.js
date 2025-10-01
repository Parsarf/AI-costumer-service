import React, { useEffect, useRef } from 'react';
import Message from './Message';
import TypingIndicator from './TypingIndicator';

function MessageList({ messages, isLoading }) {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  return (
    <div className="chat-messages">
      {messages.length === 0 && !isLoading && (
        <div className="chat-empty-state">
          <div className="empty-state-icon">💬</div>
          <p>Start a conversation with our support team!</p>
        </div>
      )}

      {messages.map((message, index) => (
        <Message
          key={`${message.timestamp}-${index}`}
          role={message.role}
          content={message.content}
          timestamp={message.timestamp}
        />
      ))}

      {isLoading && <TypingIndicator />}

      <div ref={messagesEndRef} />
    </div>
  );
}

export default MessageList;

