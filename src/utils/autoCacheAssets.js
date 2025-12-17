// Auto-cache essential assets for offline use
// This utility automatically caches profile pictures and sounds

/**
 * Cache user profile picture for offline access
 */
export const cacheProfilePicture = async (profilePictureUrl) => {
  if (!profilePictureUrl) return;

  try {
    // Check if service worker is available
    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker not supported');
      return;
    }

    // Wait for service worker to be ready
    const registration = await navigator.serviceWorker.ready;
    
    // Open cache
    const cache = await caches.open('brainwave-runtime-v2');
    
    // Fetch and cache the profile picture
    const response = await fetch(profilePictureUrl);
    if (response.ok) {
      await cache.put(profilePictureUrl, response);
      console.log('✅ Profile picture cached for offline access');
    }
  } catch (error) {
    console.error('❌ Failed to cache profile picture:', error);
  }
};

/**
 * Cache all sound files for offline access
 */
export const cacheSoundFiles = async () => {
  const soundFiles = [
    '/sounds/excellent.mp3',
    '/sounds/fail.mp3',
    '/sounds/pass.mp3',
    '/sounds/perfect.mp3'
  ];

  try {
    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker not supported');
      return;
    }

    const cache = await caches.open('brainwave-runtime-v2');
    
    // Cache all sound files
    const cachePromises = soundFiles.map(async (soundUrl) => {
      try {
        const response = await fetch(soundUrl);
        if (response.ok) {
          await cache.put(soundUrl, response);
          console.log(`✅ Sound cached: ${soundUrl}`);
        }
      } catch (error) {
        console.warn(`⚠️ Failed to cache sound: ${soundUrl}`, error);
      }
    });

    await Promise.all(cachePromises);
    console.log('✅ All sounds cached for offline access');
  } catch (error) {
    console.error('❌ Failed to cache sounds:', error);
  }
};

/**
 * Cache user's uploaded images (study materials, etc.)
 */
export const cacheUserImages = async (imageUrls) => {
  if (!imageUrls || imageUrls.length === 0) return;

  try {
    if (!('serviceWorker' in navigator)) return;

    const cache = await caches.open('brainwave-runtime-v2');
    
    const cachePromises = imageUrls.map(async (imageUrl) => {
      try {
        const response = await fetch(imageUrl);
        if (response.ok) {
          await cache.put(imageUrl, response);
        }
      } catch (error) {
        console.warn(`Failed to cache image: ${imageUrl}`);
      }
    });

    await Promise.all(cachePromises);
    console.log(`✅ Cached ${imageUrls.length} images for offline access`);
  } catch (error) {
    console.error('❌ Failed to cache images:', error);
  }
};

/**
 * Initialize auto-caching on app load
 */
export const initializeAutoCache = async (user) => {
  try {
    // Cache sounds immediately
    await cacheSoundFiles();

    // Cache user profile picture if available
    if (user?.profilePic) {
      await cacheProfilePicture(user.profilePic);
    }

    console.log('✅ Auto-cache initialized');
  } catch (error) {
    console.error('❌ Auto-cache initialization failed:', error);
  }
};

/**
 * Pre-cache essential app assets
 */
export const preCacheEssentialAssets = async () => {
  const essentialAssets = [
    '/favicon.png',
    '/logo.png',
    '/manifest.json'
  ];

  try {
    if (!('serviceWorker' in navigator)) return;

    const cache = await caches.open('brainwave-runtime-v2');
    
    const cachePromises = essentialAssets.map(async (assetUrl) => {
      try {
        const response = await fetch(assetUrl);
        if (response.ok) {
          await cache.put(assetUrl, response);
        }
      } catch (error) {
        console.warn(`Failed to cache asset: ${assetUrl}`);
      }
    });

    await Promise.all(cachePromises);
    console.log('✅ Essential assets cached');
  } catch (error) {
    console.error('❌ Failed to cache essential assets:', error);
  }
};

