import axiosInstance from "./index";
import { message } from 'antd';

/**
 * Refresh authentication token
 */
export const refreshToken = async () => {
  try {
    console.log("🔄 Refreshing authentication token...");
    const response = await axiosInstance.post("/api/auth/refresh-token");
    
    if (response.data.success) {
      // Update stored token and user data
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
      console.log("✅ Token refreshed successfully");
      return response.data;
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    console.error("❌ Token refresh failed:", error);
    throw error;
  }
};

/**
 * Validate current session
 */
export const validateSession = async () => {
  try {
    console.log("🔍 Validating current session...");
    const response = await axiosInstance.get("/api/auth/validate-session");
    
    if (response.data.success) {
      console.log("✅ Session is valid");
      return response.data;
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    console.error("❌ Session validation failed:", error);
    throw error;
  }
};

/**
 * Quick login specifically for AI features
 */
export const quickLogin = async (credentials) => {
  try {
    console.log("🚀 Quick login for AI features...");
    const response = await axiosInstance.post("/api/auth/quick-login", credentials);
    
    if (response.data.success) {
      // Store authentication data
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
      
      console.log("✅ Quick login successful");
      message.success("Login successful! You can now use AI features.");
      
      return response.data;
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    console.error("❌ Quick login failed:", error);
    
    let errorMessage = "Login failed. Please try again.";
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    }
    
    message.error(errorMessage);
    throw error;
  }
};

/**
 * Auto-refresh token if needed
 */
export const autoRefreshToken = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return false;
    }

    // Check if token needs refresh (less than 1 hour left)
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    const timeLeft = payload.exp - currentTime;
    
    if (timeLeft < 3600 && timeLeft > 0) { // Less than 1 hour but not expired
      console.log("🔄 Auto-refreshing token...");
      await refreshToken();
      return true;
    }
    
    return false;
  } catch (error) {
    console.error("❌ Auto-refresh failed:", error);
    return false;
  }
};

/**
 * Enhanced session check for AI operations
 */
export const checkAIAccess = async () => {
  try {
    const sessionData = await validateSession();
    
    if (sessionData.success) {
      const { user, tokenInfo, aiAccess } = sessionData.data;
      
      // Check if token needs refresh
      if (tokenInfo.needsRefresh) {
        await autoRefreshToken();
      }
      
      return {
        hasAccess: aiAccess?.enabled !== false,
        user,
        tokenInfo,
        requiresUpgrade: aiAccess?.requiresUpgrade || false
      };
    }
    
    return { hasAccess: false };
  } catch (error) {
    console.error("❌ AI access check failed:", error);
    return { hasAccess: false, error: error.message };
  }
};
