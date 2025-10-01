import React from 'react';
import Header from './Header';
import MessageList from './MessageList';
import InputBox from './InputBox';

function ChatWindow({ messages, isLoading, onSend, onClose, position = 'bottom-right' }) {
  const positionClass = position === 'bottom-left' ? 'left' : 'right';

  return (
    <div className={`chat-window ${positionClass}`}>
      <Header onClose={onClose} />
      <MessageList messages={messages} isLoading={isLoading} />
      <InputBox onSend={onSend} disabled={isLoading} />
    </div>
  );
}

export default ChatWindow;

