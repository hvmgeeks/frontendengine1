import React, { useState, useEffect } from 'react';
import { FaTimes, FaDownload } from 'react-icons/fa';

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      
      // Check if user has dismissed the prompt before
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (!dismissed) {
        // Show prompt after 30 seconds
        setTimeout(() => {
          setShowPrompt(true);
        }, 30000);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log('✅ App is already installed');
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('✅ User accepted the install prompt');
    } else {
      console.log('❌ User dismissed the install prompt');
    }

    // Clear the deferredPrompt
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10000,
        background: 'linear-gradient(135deg, #007BFF 0%, #0056D2 100%)',
        color: 'white',
        padding: '16px 24px',
        borderRadius: '16px',
        boxShadow: '0 8px 24px rgba(0, 123, 255, 0.3)',
        maxWidth: '90%',
        width: '400px',
        animation: 'slideUp 0.4s ease-out'
      }}
    >
      <button
        onClick={handleDismiss}
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          background: 'rgba(255, 255, 255, 0.2)',
          border: 'none',
          borderRadius: '50%',
          width: '28px',
          height: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'white'
        }}
      >
        <FaTimes />
      </button>

      <div style={{ marginBottom: '12px' }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700' }}>
          📱 Install Brainwave App
        </h3>
        <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>
          Install our app for offline access, faster loading, and a better experience!
        </p>
      </div>

      <button
        onClick={handleInstall}
        style={{
          width: '100%',
          padding: '12px',
          background: 'white',
          color: '#007BFF',
          border: 'none',
          borderRadius: '10px',
          fontSize: '15px',
          fontWeight: '700',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'translateY(-2px)';
          e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'translateY(0)';
          e.target.style.boxShadow = 'none';
        }}
      >
        <FaDownload />
        Install Now
      </button>

      <style>
        {`
          @keyframes slideUp {
            from {
              transform: translateX(-50%) translateY(100px);
              opacity: 0;
            }
            to {
              transform: translateX(-50%) translateY(0);
              opacity: 1;
            }
          }
        `}
      </style>
    </div>
  );
};

export default PWAInstallPrompt;

