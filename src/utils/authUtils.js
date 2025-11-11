import { message } from 'antd';

/**
 * Check if the current session is valid
 * @returns {boolean} true if session is valid, false otherwise
 */
export const isSessionValid = () => {
  const token = localStorage.getItem('token');
  const userData = localStorage.getItem('user');

  if (!token || !userData) {
    return false;
  }

  try {
    // Parse user data
    const user = JSON.parse(userData);
    if (!user._id) {
      return false;
    }

    // Check token format and expiration
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;

    if (payload.exp && payload.exp < currentTime) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error validating session:', error);
    return false;
  }
};

/**
 * Validate token format and content
 * @param {string} token - JWT token to validate
 * @returns {object} validation result with isValid and error
 */
export const validateTokenFormat = (token) => {
  if (!token) {
    return { isValid: false, error: 'No token provided' };
  }

  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { isValid: false, error: 'Invalid token format - wrong number of parts' };
    }

    // Try to decode the payload
    const payload = JSON.parse(atob(parts[1]));

    if (!payload.userId) {
      return { isValid: false, error: 'Token missing userId' };
    }

    const currentTime = Date.now() / 1000;
    if (payload.exp && payload.exp < currentTime) {
      return { isValid: false, error: 'Token expired' };
    }

    return {
      isValid: true,
      payload,
      expiresAt: payload.exp,
      timeLeft: payload.exp - currentTime
    };
  } catch (error) {
    return { isValid: false, error: `Token decode error: ${error.message}` };
  }
};

/**
 * Clean up invalid session data
 */
export const cleanupInvalidSession = () => {
  console.log('🧹 Cleaning up invalid session data');
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  // Note: We keep 'rememberedUser' for auto-login on next visit
};

/**
 * Clear session data and redirect to login
 * @param {string} errorMessage - Optional error message to display
 */
export const clearSessionAndRedirect = (errorMessage = 'Your session has expired. Please login again.') => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  // Note: We keep 'rememberedUser' for auto-login on next visit
  message.error(errorMessage);

  setTimeout(() => {
    window.location.href = '/login';
  }, 1000);
};

/**
 * Validate session and redirect if invalid
 * @param {string} errorMessage - Optional error message to display
 * @returns {boolean} true if session is valid, false if redirected
 */
export const validateSessionOrRedirect = (errorMessage) => {
  if (!isSessionValid()) {
    clearSessionAndRedirect(errorMessage);
    return false;
  }
  return true;
};

/**
 * Get current user data if session is valid
 * @returns {object|null} user data or null if session invalid
 */
export const getCurrentUser = () => {
  if (!isSessionValid()) {
    return null;
  }

  try {
    return JSON.parse(localStorage.getItem('user'));
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

/**
 * Get current token if session is valid
 * @returns {string|null} token or null if session invalid
 */
export const getCurrentToken = () => {
  if (!isSessionValid()) {
    return null;
  }

  return localStorage.getItem('token');
};

/**
 * Check if token will expire soon (within next 5 minutes)
 * @returns {boolean} true if token expires soon
 */
export const isTokenExpiringSoon = () => {
  const token = localStorage.getItem('token');

  if (!token) {
    return true;
  }

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    const fiveMinutesFromNow = currentTime + (5 * 60); // 5 minutes

    return payload.exp && payload.exp < fiveMinutesFromNow;
  } catch (error) {
    return true;
  }
};

/**
 * Get token expiry information
 * @returns {object} token expiry details
 */
export const getTokenExpiryInfo = () => {
  const token = localStorage.getItem('token');

  if (!token) {
    return { expired: true, timeLeft: 0 };
  }

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    const timeLeft = payload.exp - currentTime;

    return {
      expired: timeLeft <= 0,
      timeLeft: Math.max(0, timeLeft),
      expiresAt: new Date(payload.exp * 1000),
      needsRefresh: timeLeft < 3600, // Less than 1 hour
      formattedTimeLeft: formatTimeLeft(timeLeft)
    };
  } catch (error) {
    return { expired: true, timeLeft: 0 };
  }
};

/**
 * Format time left in human readable format
 * @param {number} seconds
 * @returns {string} formatted time
 */
const formatTimeLeft = (seconds) => {
  if (seconds <= 0) return 'Expired';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m`;
  } else {
    return 'Less than 1m';
  }
};
