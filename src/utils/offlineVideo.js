// Offline Video Utility Functions
// Handles video downloads and offline playback

const DB_NAME = 'BrainwaveVideos';
const DB_VERSION = 3; // Increment version to trigger upgrade
const STORE_NAME = 'videos';

// Global database instance
let dbInstance = null;
let dbInitializing = false;
let dbInitPromise = null;

/**
 * Clear and reset the database (for debugging)
 */
export const clearDatabase = async () => {
  try {
    // Close existing connection
    if (dbInstance) {
      dbInstance.close();
      dbInstance = null;
    }

    // Delete the database
    return new Promise((resolve, reject) => {
      const deleteRequest = indexedDB.deleteDatabase(DB_NAME);

      deleteRequest.onsuccess = () => {
        console.log('✅ Database deleted successfully');
        dbInitializing = false;
        dbInitPromise = null;
        resolve();
      };

      deleteRequest.onerror = () => {
        console.error('❌ Failed to delete database:', deleteRequest.error);
        reject(deleteRequest.error);
      };

      deleteRequest.onblocked = () => {
        console.warn('⚠️ Database deletion blocked. Please close all tabs.');
      };
    });
  } catch (error) {
    console.error('Error clearing database:', error);
    throw error;
  }
};

/**
 * Initialize and get database instance
 */
const getDatabase = async () => {
  // If database is already initialized, return it
  if (dbInstance) {
    return dbInstance;
  }

  // If database is currently being initialized, wait for it
  if (dbInitializing && dbInitPromise) {
    return dbInitPromise;
  }

  // Start initialization
  dbInitializing = true;
  dbInitPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('❌ Failed to open database:', request.error);
      dbInitializing = false;
      dbInitPromise = null;
      reject(request.error);
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      dbInitializing = false;
      console.log('✅ IndexedDB opened successfully');

      // Handle database close/error events
      dbInstance.onclose = () => {
        console.log('⚠️ Database connection closed');
        dbInstance = null;
      };

      dbInstance.onerror = (event) => {
        console.error('❌ Database error:', event.target.error);
      };

      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      console.log('🔧 Upgrading IndexedDB schema to version', DB_VERSION);

      // Delete old object store if it exists
      if (db.objectStoreNames.contains(STORE_NAME)) {
        console.log('🗑️ Deleting old object store...');
        db.deleteObjectStore(STORE_NAME);
      }

      // Create new object store
      console.log('📦 Creating new object store...');
      const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'url' });
      objectStore.createIndex('title', 'title', { unique: false });
      objectStore.createIndex('downloadedAt', 'downloadedAt', { unique: false });

      console.log('✅ IndexedDB schema upgraded successfully');
    };

    request.onblocked = () => {
      console.warn('⚠️ IndexedDB upgrade blocked. Please close other tabs with this site open.');
      dbInitializing = false;
      dbInitPromise = null;
    };
  });

  return dbInitPromise;
};

/**
 * Download video for offline playback
 * @param {string} videoUrl - URL of the video to download
 * @param {string} videoTitle - Title of the video
 * @param {Function} onProgress - Progress callback (0-100)
 * @param {Function} onComplete - Completion callback
 * @param {Function} onError - Error callback
 * @param {Object} videoDetails - Complete video object with all metadata
 */
export const downloadVideoForOffline = async (videoUrl, videoTitle, onProgress, onComplete, onError, videoDetails = null) => {
  try {
    console.log('📥 Starting video download:', videoTitle);

    // Check if service worker is available
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service Worker not supported');
    }

    // Check if we have enough storage
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const availableSpace = estimate.quota - estimate.usage;
      console.log(`💾 Available storage: ${(availableSpace / 1024 / 1024).toFixed(2)} MB`);

      if (availableSpace < 50 * 1024 * 1024) { // Less than 50MB
        throw new Error('Not enough storage space. Please free up some space.');
      }
    }

    // Fetch video with progress tracking
    const response = await fetch(videoUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch video: ${response.statusText}`);
    }

    const contentLength = response.headers.get('content-length');
    const total = parseInt(contentLength, 10);
    let loaded = 0;

    const reader = response.body.getReader();
    const chunks = [];

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      chunks.push(value);
      loaded += value.length;

      if (total && onProgress) {
        const progress = Math.round((loaded / total) * 100);
        onProgress(progress);
      }
    }

    // Combine chunks into blob
    const blob = new Blob(chunks, { type: 'video/mp4' });
    const blobUrl = URL.createObjectURL(blob);

    // Store in IndexedDB for offline access with complete video details
    await storeVideoInIndexedDB(videoUrl, blob, videoTitle, videoDetails);

    // Also cache in service worker
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CACHE_VIDEO',
        url: videoUrl,
        title: videoTitle
      });
    }

    console.log('✅ Video downloaded successfully:', videoTitle);

    if (onComplete) {
      onComplete(blobUrl);
    }

    return blobUrl;
  } catch (error) {
    console.error('❌ Video download failed:', error);
    if (onError) {
      onError(error.message);
    }
    throw error;
  }
};

/**
 * Store video in IndexedDB with complete video details
 */
const storeVideoInIndexedDB = async (videoUrl, blob, title, videoDetails = null) => {
  try {
    const db = await getDatabase();

    // Verify the object store exists
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      throw new Error('Object store not found. Database may need upgrade.');
    }

    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const videoData = {
      url: videoUrl,
      blob: blob,
      title: title,
      downloadedAt: new Date().toISOString(),
      size: blob.size,
      // Store complete video details for offline browsing
      details: videoDetails || {
        title: title,
        videoUrl: videoUrl
      }
    };

    return new Promise((resolve, reject) => {
      const addRequest = store.put(videoData);
      addRequest.onsuccess = () => {
        console.log('✅ Video stored in IndexedDB:', title);
        resolve();
      };
      addRequest.onerror = () => {
        console.error('❌ Failed to store video:', addRequest.error);
        reject(addRequest.error);
      };

      transaction.onerror = () => {
        console.error('❌ Transaction error:', transaction.error);
        reject(transaction.error);
      };
    });
  } catch (error) {
    console.error('Error storing video in IndexedDB:', error);
    throw error;
  }
};

/**
 * Get video from IndexedDB
 */
export const getOfflineVideo = async (videoUrl) => {
  try {
    const db = await getDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const getRequest = store.get(videoUrl);

      getRequest.onsuccess = () => {
        if (getRequest.result) {
          const blobUrl = URL.createObjectURL(getRequest.result.blob);
          resolve(blobUrl);
        } else {
          resolve(null);
        }
      };

      getRequest.onerror = () => {
        console.error('❌ Failed to get video:', getRequest.error);
        reject(getRequest.error);
      };
    });
  } catch (error) {
    console.error('Error getting video from IndexedDB:', error);
    return null;
  }
};

/**
 * Check if video is downloaded
 */
export const isVideoDownloaded = async (videoUrl) => {
  try {
    const db = await getDatabase();

    // Verify the object store exists before creating transaction
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      console.warn('⚠️ Object store not found, database may need upgrade');
      return false;
    }

    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const getRequest = store.get(videoUrl);

        getRequest.onsuccess = () => {
          resolve(getRequest.result !== undefined);
        };

        getRequest.onerror = () => {
          console.error('❌ Failed to check video:', getRequest.error);
          resolve(false);
        };

        transaction.onerror = () => {
          console.error('❌ Transaction error:', transaction.error);
          resolve(false);
        };
      } catch (txError) {
        console.error('❌ Transaction creation error:', txError);
        resolve(false);
      }
    });
  } catch (error) {
    console.error('Error checking video in IndexedDB:', error);
    return false;
  }
};

/**
 * Delete offline video
 */
export const deleteOfflineVideo = async (videoUrl) => {
  try {
    const db = await getDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const deleteRequest = store.delete(videoUrl);

      deleteRequest.onsuccess = () => {
        console.log('✅ Video deleted from IndexedDB');
        resolve();
      };
      deleteRequest.onerror = () => {
        console.error('❌ Failed to delete video:', deleteRequest.error);
        reject(deleteRequest.error);
      };
    });
  } catch (error) {
    console.error('Error deleting video from IndexedDB:', error);
    throw error;
  }
};

/**
 * Get all downloaded videos
 */
export const getAllDownloadedVideos = async () => {
  try {
    const db = await getDatabase();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const getAllRequest = store.getAll();

      getAllRequest.onsuccess = () => {
        resolve(getAllRequest.result);
      };
      getAllRequest.onerror = () => {
        console.error('❌ Failed to get all videos:', getAllRequest.error);
        reject(getAllRequest.error);
      };
    });
  } catch (error) {
    console.error('Error getting all videos from IndexedDB:', error);
    return [];
  }
};

/**
 * Get total storage used by downloaded videos
 */
export const getStorageUsed = async () => {
  try {
    const videos = await getAllDownloadedVideos();
    const totalSize = videos.reduce((sum, video) => sum + (video.size || 0), 0);
    return {
      totalSize,
      totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
      videoCount: videos.length
    };
  } catch (error) {
    console.error('Error getting storage info:', error);
    return { totalSize: 0, totalSizeMB: '0', videoCount: 0 };
  }
};

// Initialize database when module loads
if (typeof window !== 'undefined') {
  // Make clearDatabase available globally for debugging
  window.clearBrainwaveDB = clearDatabase;

  // Wait a bit to avoid blocking initial page load
  setTimeout(() => {
    getDatabase().catch(error => {
      console.error('Failed to initialize database on load:', error);
      console.log('💡 Try running: window.clearBrainwaveDB() in console, then refresh');
    });
  }, 1000);
}
