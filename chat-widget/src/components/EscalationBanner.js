import React from 'react';

function EscalationBanner({ message }) {
  return (
    <div className="escalation-banner">
      <div className="escalation-icon">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M10 2C5.58 2 2 5.58 2 10C2 14.42 5.58 18 10 18C14.42 18 18 14.42 18 10C18 5.58 14.42 2 10 2ZM11 14H9V12H11V14ZM11 10H9V6H11V10Z"
            fill="#F59E0B"
          />
        </svg>
      </div>
      <div className="escalation-text">
        <strong>Escalated to Human Support</strong>
        <p>{message || 'Our team will reach out to you shortly.'}</p>
      </div>
    </div>
  );
}

export default EscalationBanner;

