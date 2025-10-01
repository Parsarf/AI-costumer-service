import React, { useState } from 'react';

function InputBox({ onSend, disabled }) {
  const [message, setMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form className="chat-input-form" onSubmit={handleSubmit}>
      <div className="chat-input-container">
        <input
          type="text"
          className="chat-input"
          placeholder="Type your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={disabled}
          autoFocus
        />
        
        <button
          type="submit"
          className="chat-send-button"
          disabled={!message.trim() || disabled}
          aria-label="Send message"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M2 10L18 2L12 18L10 11L2 10Z"
              fill="currentColor"
            />
          </svg>
        </button>
      </div>
      
      <div className="chat-footer-text">
        Powered by AI • <a href="#" target="_blank">Privacy Policy</a>
      </div>
    </form>
  );
}

export default InputBox;

