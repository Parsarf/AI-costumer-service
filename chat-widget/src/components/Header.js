import React from 'react';

function Header({ onClose }) {
  return (
    <div className="chat-header">
      <div className="chat-header-content">
        <div className="chat-header-avatar">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" fill="white" opacity="0.2"/>
            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 6C13.1 6 14 6.9 14 8C14 9.1 13.1 10 12 10C10.9 10 10 9.1 10 8C10 6.9 10.9 6 12 6ZM12 18C10.34 18 8.84 17.16 8 15.88C8.03 14.58 10.67 13.88 12 13.88C13.32 13.88 15.97 14.58 16 15.88C15.16 17.16 13.66 18 12 18Z" fill="white"/>
          </svg>
        </div>
        <div className="chat-header-info">
          <div className="chat-header-title">Support Assistant</div>
          <div className="chat-header-status">
            <span className="status-dot"></span>
            Online
          </div>
        </div>
      </div>
      
      <button
        className="chat-header-close"
        onClick={onClose}
        aria-label="Close chat"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M15 5L5 15M5 5L15 15"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}

export default Header;

