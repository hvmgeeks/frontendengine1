/**
 * Automatic Cache Clearing Utility
 * Clears old caches automatically on app startup
 */

// Current app version - increment this when you want to force cache clear
const APP_VERSION = '2.0.0';
const VERSION_KEY = 'brainwave_app_version';
const LAST_CACHE_CLEAR_KEY = 'brainwave_last_cache_clear';

/**
 * Check if cache should be cleared based on version or time
 */
const shouldClearCache = () => {
  const storedVersion = localStorage.getItem(VERSION_KEY);
  const lastCacheClear = localStorage.getItem(LAST_CACHE_CLEAR_KEY);
  
  // Clear cache if version changed
  if (storedVersion !== APP_VERSION) {
    console.log(`🔄 Version changed from ${storedVersion} to ${APP_VERSION}`);
    return true;
  }
  
  // Clear cache if it's been more than 24 hours (optional)
  if (lastCacheClear) {
    const hoursSinceLastClear = (Date.now() - parseInt(lastCacheClear)) / (1000 * 60 * 60);
    if (hoursSinceLastClear > 24) {
      console.log(`🔄 Cache is ${hoursSinceLastClear.toFixed(1)} hours old`);
      return true;
    }
  }
  
  return false;
};

/**
 * Clear all browser caches
 */
export const clearAllCaches = async () => {
  try {
    console.log('🗑️ Starting automatic cache clear...');
    
    // Clear Cache Storage API
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      console.log(`📦 Found ${cacheNames.length} caches to clear`);
      
      await Promise.all(
        cacheNames.map(async (cacheName) => {
          await caches.delete(cacheName);
          console.log(`✅ Deleted cache: ${cacheName}`);
        })
      );
    }
    
    // Clear old localStorage items (keep user auth and preferences)
    const keysToKeep = [
      'token',
      'user',
      VERSION_KEY,
      LAST_CACHE_CLEAR_KEY,
      'theme',
      'language',
      'pwa-install-dismissed'
    ];
    
    const allKeys = Object.keys(localStorage);
    allKeys.forEach(key => {
      if (!keysToKeep.includes(key) && !key.startsWith('brainwave_')) {
        localStorage.removeItem(key);
        console.log(`🗑️ Removed localStorage: ${key}`);
      }
    });
    
    // Clear sessionStorage (except critical items)
    const sessionKeysToKeep = ['token'];
    const sessionKeys = Object.keys(sessionStorage);
    sessionKeys.forEach(key => {
      if (!sessionKeysToKeep.includes(key)) {
        sessionStorage.removeItem(key);
      }
    });
    
    // Update version and timestamp
    localStorage.setItem(VERSION_KEY, APP_VERSION);
    localStorage.setItem(LAST_CACHE_CLEAR_KEY, Date.now().toString());
    
    console.log('✅ Cache cleared successfully!');
    return true;
  } catch (error) {
    console.error('❌ Error clearing cache:', error);
    return false;
  }
};

/**
 * Clear only old/stale caches (keeps recent data)
 */
export const clearStaleCaches = async () => {
  try {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      const currentCaches = [
        'brainwave-v2',
        'brainwave-runtime-v2',
        'brainwave-videos-v2',
        'brainwave-api-v2',
        'brainwave-quiz-v2',
        'brainwave-auth-v2'
      ];
      
      // Delete old version caches
      await Promise.all(
        cacheNames.map(async (cacheName) => {
          if (!currentCaches.includes(cacheName)) {
            await caches.delete(cacheName);
            console.log(`🗑️ Deleted old cache: ${cacheName}`);
          }
        })
      );
    }
  } catch (error) {
    console.error('❌ Error clearing stale caches:', error);
  }
};

/**
 * Initialize automatic cache management
 * Call this on app startup
 */
export const initAutoCacheClear = async () => {
  console.log('🚀 Initializing cache management...');
  
  // Check if we should clear cache
  if (shouldClearCache()) {
    console.log('🔄 Cache clear required');
    await clearAllCaches();
  } else {
    console.log('✅ Cache is up to date');
    // Still clear stale caches
    await clearStaleCaches();
  }
  
  console.log(`📱 App Version: ${APP_VERSION}`);
};

/**
 * Force clear all caches (for manual use)
 */
export const forceClearCache = async () => {
  console.log('🔨 Force clearing all caches...');
  await clearAllCaches();
  
  // Unregister service workers
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      await registration.unregister();
      console.log('✅ Service worker unregistered');
    }
  }
  
  console.log('✅ Force clear complete! Reloading...');
  setTimeout(() => {
    window.location.reload(true);
  }, 1000);
};

