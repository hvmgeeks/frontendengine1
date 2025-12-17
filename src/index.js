import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import store from "./redux/store";
import { Provider } from "react-redux";
import { initAutoCacheClear } from "./utils/autoCacheClear";

// Suppress ResizeObserver errors (benign warnings from Ant Design components)
const resizeObserverErrorHandler = (e) => {
  if (
    e.message === 'ResizeObserver loop completed with undelivered notifications.' ||
    e.message === 'ResizeObserver loop limit exceeded'
  ) {
    const resizeObserverErrDiv = document.getElementById('webpack-dev-server-client-overlay-div');
    const resizeObserverErr = document.getElementById('webpack-dev-server-client-overlay');
    if (resizeObserverErr) {
      resizeObserverErr.setAttribute('style', 'display: none');
    }
    if (resizeObserverErrDiv) {
      resizeObserverErrDiv.setAttribute('style', 'display: none');
    }
  }
};

window.addEventListener('error', resizeObserverErrorHandler);

// Initialize automatic cache clearing before rendering
initAutoCacheClear().then(() => {
  console.log('✅ Cache management initialized');
}).catch(err => {
  console.error('❌ Cache management error:', err);
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <Provider store={store}>
    <App />
  </Provider>
);

// Register Service Worker for PWA and offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Use absolute path with proper scope for both browser and installed PWA
    const swUrl = `${window.location.origin}/service-worker.js`;

    navigator.serviceWorker
      .register(swUrl, {
        scope: '/',
        updateViaCache: 'none' // Always check for updates
      })
      .then((registration) => {
        console.log('✅ Service Worker registered successfully:', registration.scope);
        console.log('📱 PWA Mode:', window.matchMedia('(display-mode: standalone)').matches ? 'Installed App' : 'Browser');

        // Check for updates every hour
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker available, show update notification
              console.log('🔄 New version available! Please refresh.');
              if (window.confirm('New version available! Refresh to update?')) {
                newWorker.postMessage({ type: 'SKIP_WAITING' });
                window.location.reload();
              }
            }
          });
        });
      })
      .catch((error) => {
        console.error('❌ Service Worker registration failed:', error);
        console.error('Error details:', error.message);
      });
  });

  // Handle service worker updates
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });
}

reportWebVitals();