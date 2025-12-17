// Offline Authentication Utility
// Handles persistent login and offline authentication

const DB_NAME = 'BrainwaveAuth';
const DB_VERSION = 1;
const STORE_NAME = 'authData';

// Global database instance
let authDbInstance = null;

/**
 * Initialize and get auth database instance
 */
const getAuthDatabase = async () => {
  if (authDbInstance) {
    return authDbInstance;
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('❌ Failed to open auth database:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      authDbInstance = request.result;
      console.log('✅ Auth IndexedDB opened successfully');
      resolve(authDbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      console.log('🔧 Upgrading Auth IndexedDB schema...');
      
      // Delete old object store if it exists
      if (db.objectStoreNames.contains(STORE_NAME)) {
        db.deleteObjectStore(STORE_NAME);
      }
      
      // Create new object store
      const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      objectStore.createIndex('timestamp', 'timestamp', { unique: false });
      
      console.log('✅ Auth IndexedDB schema created');
    };
  });
};

/**
 * Store authentication data for offline access
 */
export const storeAuthData = async (token, userData, rememberMe = false) => {
  try {
    const db = await getAuthDatabase();

    if (!db.objectStoreNames.contains(STORE_NAME)) {
      throw new Error('Auth object store not found');
    }

    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    // Store token
    await new Promise((resolve, reject) => {
      const tokenRequest = store.put({
        key: 'token',
        value: token,
        timestamp: Date.now(),
        rememberMe
      });
      tokenRequest.onsuccess = () => resolve();
      tokenRequest.onerror = () => reject(tokenRequest.error);
    });

    // Store user data
    await new Promise((resolve, reject) => {
      const userRequest = store.put({
        key: 'user',
        value: userData,
        timestamp: Date.now(),
        rememberMe
      });
      userRequest.onsuccess = () => resolve();
      userRequest.onerror = () => reject(userRequest.error);
    });

    // Store remember me preference
    await new Promise((resolve, reject) => {
      const rememberRequest = store.put({
        key: 'rememberMe',
        value: rememberMe,
        timestamp: Date.now()
      });
      rememberRequest.onsuccess = () => resolve();
      rememberRequest.onerror = () => reject(rememberRequest.error);
    });

    console.log('✅ Auth data stored in IndexedDB');
    
    // Also store in localStorage for backward compatibility
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    
    return true;
  } catch (error) {
    console.error('❌ Error storing auth data:', error);
    // Fallback to localStorage only
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    return false;
  }
};

/**
 * Get authentication data from offline storage
 */
export const getAuthData = async () => {
  try {
    const db = await getAuthDatabase();

    if (!db.objectStoreNames.contains(STORE_NAME)) {
      // Fallback to localStorage
      return getAuthDataFromLocalStorage();
    }

    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    const token = await new Promise((resolve) => {
      const request = store.get('token');
      request.onsuccess = () => resolve(request.result?.value || null);
      request.onerror = () => resolve(null);
    });

    const user = await new Promise((resolve) => {
      const request = store.get('user');
      request.onsuccess = () => resolve(request.result?.value || null);
      request.onerror = () => resolve(null);
    });

    const rememberMe = await new Promise((resolve) => {
      const request = store.get('rememberMe');
      request.onsuccess = () => resolve(request.result?.value || false);
      request.onerror = () => resolve(false);
    });

    return { token, user, rememberMe };
  } catch (error) {
    console.error('❌ Error getting auth data:', error);
    return getAuthDataFromLocalStorage();
  }
};

/**
 * Fallback to localStorage
 */
const getAuthDataFromLocalStorage = () => {
  try {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const rememberMe = localStorage.getItem('rememberMe') === 'true';

    return { token, user, rememberMe };
  } catch (error) {
    console.error('❌ Error reading from localStorage:', error);
    return { token: null, user: null, rememberMe: false };
  }
};

/**
 * Clear authentication data
 */
export const clearAuthData = async () => {
  try {
    const db = await getAuthDatabase();

    if (db.objectStoreNames.contains(STORE_NAME)) {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      await new Promise((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }

    console.log('✅ Auth data cleared from IndexedDB');
  } catch (error) {
    console.error('❌ Error clearing auth data:', error);
  }

  // Always clear localStorage
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('rememberMe');
};

/**
 * Check if user is authenticated (online or offline)
 */
export const isAuthenticated = async () => {
  const { token, user } = await getAuthData();

  if (!token || !user) {
    return false;
  }

  // Check token expiration
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;

    // If token is expired, clear auth data
    if (payload.exp && payload.exp < currentTime) {
      console.log('🔒 Token expired');
      await clearAuthData();
      return false;
    }

    return true;
  } catch (error) {
    console.error('❌ Error checking token:', error);
    return false;
  }
};

/**
 * Get current user data
 */
export const getCurrentUser = async () => {
  const { user } = await getAuthData();
  return user;
};

/**
 * Update user data in offline storage
 */
export const updateUserData = async (userData) => {
  try {
    const db = await getAuthDatabase();

    if (!db.objectStoreNames.contains(STORE_NAME)) {
      localStorage.setItem('user', JSON.stringify(userData));
      return true;
    }

    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    await new Promise((resolve, reject) => {
      const request = store.put({
        key: 'user',
        value: userData,
        timestamp: Date.now()
      });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    localStorage.setItem('user', JSON.stringify(userData));
    console.log('✅ User data updated');
    return true;
  } catch (error) {
    console.error('❌ Error updating user data:', error);
    localStorage.setItem('user', JSON.stringify(userData));
    return false;
  }
};

/**
 * Initialize auth database on module load
 */
if (typeof window !== 'undefined') {
  setTimeout(() => {
    getAuthDatabase().catch(error => {
      console.error('Failed to initialize auth database:', error);
    });
  }, 500);
}

