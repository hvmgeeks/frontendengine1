/**
 * Secure Storage Utility for Remember Me Feature
 * Uses Base64 encoding for basic obfuscation (not true encryption)
 * For production, consider using a proper encryption library
 */

const STORAGE_KEY = 'brainwave_remember_me';
const SALT = 'BrainWave2024SecureKey'; // In production, use environment variable

/**
 * Simple encoding function for credential obfuscation
 * @param {string} data - Data to encode
 * @returns {string} Encoded data
 */
const encode = (data) => {
  try {
    // Add salt and encode
    const salted = SALT + data + SALT;
    return btoa(encodeURIComponent(salted));
  } catch (error) {
    console.error('Encoding error:', error);
    return null;
  }
};

/**
 * Simple decoding function for credential obfuscation
 * @param {string} encodedData - Encoded data
 * @returns {string} Decoded data
 */
const decode = (encodedData) => {
  try {
    const decoded = decodeURIComponent(atob(encodedData));
    // Remove salt from both ends
    return decoded.substring(SALT.length, decoded.length - SALT.length);
  } catch (error) {
    console.error('Decoding error:', error);
    return null;
  }
};

/**
 * Save credentials securely to localStorage
 * @param {string} email - User email/username
 * @param {string} password - User password
 * @returns {boolean} Success status
 */
export const saveCredentials = (email, password) => {
  try {
    const credentials = {
      email: encode(email),
      password: encode(password),
      timestamp: Date.now(),
      version: '1.0'
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(credentials));
    console.log('✅ Credentials saved securely');
    return true;
  } catch (error) {
    console.error('❌ Error saving credentials:', error);
    return false;
  }
};

/**
 * Retrieve saved credentials from localStorage
 * @returns {object|null} Credentials object or null if not found
 */
export const getCredentials = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return null;
    }

    const credentials = JSON.parse(stored);
    
    // Check if credentials are expired (30 days)
    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
    if (Date.now() - credentials.timestamp > thirtyDaysInMs) {
      console.log('⚠️ Stored credentials expired');
      clearCredentials();
      return null;
    }

    return {
      email: decode(credentials.email),
      password: decode(credentials.password),
      timestamp: credentials.timestamp
    };
  } catch (error) {
    console.error('❌ Error retrieving credentials:', error);
    return null;
  }
};

/**
 * Clear saved credentials from localStorage
 */
export const clearCredentials = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log('✅ Credentials cleared');
  } catch (error) {
    console.error('❌ Error clearing credentials:', error);
  }
};

/**
 * Check if credentials are saved
 * @returns {boolean} True if credentials exist
 */
export const hasStoredCredentials = () => {
  return localStorage.getItem(STORAGE_KEY) !== null;
};

/**
 * Update timestamp of stored credentials (refresh expiry)
 */
export const refreshCredentialsTimestamp = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const credentials = JSON.parse(stored);
      credentials.timestamp = Date.now();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(credentials));
      console.log('✅ Credentials timestamp refreshed');
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Error refreshing credentials:', error);
    return false;
  }
};

