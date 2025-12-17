import React, { useState, useEffect } from 'react';
import { message } from 'antd';

const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowIndicator(true);
      message.success('🌐 Back online!');
      setTimeout(() => setShowIndicator(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowIndicator(true);
      message.warning('📡 You are offline. Some features may be limited.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showIndicator && isOnline) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 10000,
        padding: '12px 20px',
        borderRadius: '12px',
        background: isOnline
          ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
          : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        color: 'white',
        fontWeight: '600',
        fontSize: '14px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        animation: 'slideInFromTop 0.3s ease-out'
      }}
    >
      <span style={{ fontSize: '20px' }}>
        {isOnline ? '🌐' : '📡'}
      </span>
      <span>
        {isOnline ? 'Back Online' : 'Offline Mode'}
      </span>
    </div>
  );
};

export default OfflineIndicator;

