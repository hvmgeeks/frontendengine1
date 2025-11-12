import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { validateSession, autoRefreshToken, checkAIAccess } from '../apicalls/auth';
import { getTokenExpiryInfo, isSessionValid } from '../utils/authUtils';

/**
 * Enhanced authentication hook specifically for AI features
 * Provides automatic token refresh, session validation, and AI access checking
 */
export const useAIAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasAIAccess, setHasAIAccess] = useState(false);
  const [user, setUser] = useState(null);
  const [tokenInfo, setTokenInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requiresUpgrade, setRequiresUpgrade] = useState(false);

  // Check authentication status
  const checkAuth = useCallback(async () => {
    try {
      setLoading(true);
      
      // Quick check if session is valid
      if (!isSessionValid()) {
        setIsAuthenticated(false);
        setHasAIAccess(false);
        setUser(null);
        setTokenInfo(null);
        return false;
      }

      // Get token expiry info
      const expiry = getTokenExpiryInfo();
      setTokenInfo(expiry);

      // If token is expired, clear everything
      if (expiry.expired) {
        setIsAuthenticated(false);
        setHasAIAccess(false);
        setUser(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return false;
      }

      // Try to auto-refresh if needed
      if (expiry.needsRefresh) {
        try {
          await autoRefreshToken();
          const newExpiry = getTokenExpiryInfo();
          setTokenInfo(newExpiry);
        } catch (error) {
          console.warn('Auto-refresh failed:', error);
        }
      }

      // Validate session and check AI access
      const accessCheck = await checkAIAccess();
      
      if (accessCheck.hasAccess) {
        setIsAuthenticated(true);
        setHasAIAccess(true);
        setUser(accessCheck.user);
        setRequiresUpgrade(accessCheck.requiresUpgrade || false);
        return true;
      } else {
        setIsAuthenticated(!!accessCheck.user);
        setHasAIAccess(false);
        setUser(accessCheck.user || null);
        setRequiresUpgrade(accessCheck.requiresUpgrade || false);
        return false;
      }

    } catch (error) {
      console.error('Auth check failed:', error);
      setIsAuthenticated(false);
      setHasAIAccess(false);
      setUser(null);
      setTokenInfo(null);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh authentication
  const refreshAuth = useCallback(async () => {
    return await checkAuth();
  }, [checkAuth]);

  // Logout
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Clear remembered credentials on explicit logout
    localStorage.removeItem('rememberedUser');
    localStorage.removeItem('brainwave_remember_me');
    setIsAuthenticated(false);
    setHasAIAccess(false);
    setUser(null);
    setTokenInfo(null);
    message.info('Logged out successfully');
  }, []);

  // Login success handler
  const handleLoginSuccess = useCallback((userData) => {
    setIsAuthenticated(true);
    setUser(userData.user);
    
    // Check AI access from login response
    const aiEnabled = userData.aiAccess?.enabled !== false;
    setHasAIAccess(aiEnabled);
    setRequiresUpgrade(userData.aiAccess?.requiresUpgrade || false);
    
    // Update token info
    const expiry = getTokenExpiryInfo();
    setTokenInfo(expiry);
    
    message.success('Successfully logged in for AI features!');
  }, []);

  // Require authentication for AI operations
  const requireAIAuth = useCallback(async () => {
    if (loading) {
      return { success: false, reason: 'loading' };
    }

    if (!isAuthenticated) {
      return { success: false, reason: 'not_authenticated' };
    }

    if (!hasAIAccess) {
      if (requiresUpgrade) {
        return { success: false, reason: 'requires_upgrade' };
      }
      return { success: false, reason: 'no_ai_access' };
    }

    // Check if token is about to expire
    if (tokenInfo?.needsRefresh) {
      try {
        await autoRefreshToken();
        const newExpiry = getTokenExpiryInfo();
        setTokenInfo(newExpiry);
      } catch (error) {
        return { success: false, reason: 'refresh_failed' };
      }
    }

    return { success: true };
  }, [isAuthenticated, hasAIAccess, requiresUpgrade, tokenInfo, loading]);

  // Auto-refresh timer
  useEffect(() => {
    let refreshTimer;

    if (isAuthenticated && tokenInfo && !tokenInfo.expired) {
      // Set timer to refresh token 5 minutes before expiry
      const refreshTime = Math.max(0, (tokenInfo.timeLeft - 300) * 1000);
      
      refreshTimer = setTimeout(async () => {
        try {
          await autoRefreshToken();
          const newExpiry = getTokenExpiryInfo();
          setTokenInfo(newExpiry);
          console.log('🔄 Token auto-refreshed');
        } catch (error) {
          console.warn('Auto-refresh timer failed:', error);
        }
      }, refreshTime);
    }

    return () => {
      if (refreshTimer) {
        clearTimeout(refreshTimer);
      }
    };
  }, [isAuthenticated, tokenInfo]);

  // Initial auth check
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return {
    // State
    isAuthenticated,
    hasAIAccess,
    user,
    tokenInfo,
    loading,
    requiresUpgrade,
    
    // Actions
    checkAuth,
    refreshAuth,
    logout,
    handleLoginSuccess,
    requireAIAuth,
    
    // Computed values
    needsLogin: !isAuthenticated,
    needsUpgrade: isAuthenticated && !hasAIAccess && requiresUpgrade,
    sessionExpiringSoon: tokenInfo?.needsRefresh || false,
    timeUntilExpiry: tokenInfo?.formattedTimeLeft || 'Unknown'
  };
};
