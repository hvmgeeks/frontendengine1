import React, { useEffect, useState } from 'react';
import { forceClearCache } from '../utils/autoCacheClear';

/**
 * Cache Clear Button Component
 * Shows a floating button to manually clear cache
 * Activated by pressing Ctrl+Shift+C
 */
const CacheClearButton = () => {
  const [showButton, setShowButton] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    // Listen for Ctrl+Shift+C to toggle button
    const handleKeyPress = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        setShowButton(prev => !prev);
        console.log('🔧 Cache clear button toggled');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const handleClearCache = async () => {
    if (window.confirm('⚠️ This will clear all caches and reload the page. Continue?')) {
      setIsClearing(true);
      await forceClearCache();
    }
  };

  if (!showButton) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 9999,
        backgroundColor: '#ff4444',
        color: 'white',
        padding: '12px 20px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        cursor: 'pointer',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        transition: 'all 0.3s ease',
        opacity: isClearing ? 0.5 : 1,
        pointerEvents: isClearing ? 'none' : 'auto'
      }}
      onClick={handleClearCache}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)';
        e.currentTarget.style.backgroundColor = '#ff6666';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.backgroundColor = '#ff4444';
      }}
    >
      {isClearing ? (
        <>
          <span>⏳</span>
          <span>Clearing Cache...</span>
        </>
      ) : (
        <>
          <span>🗑️</span>
          <span>Clear All Cache</span>
        </>
      )}
    </div>
  );
};

export default CacheClearButton;

