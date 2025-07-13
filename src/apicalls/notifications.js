import axiosInstance from "./index";

// Get user notifications
export const getUserNotifications = async (params = {}) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false, type = null } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      unreadOnly: unreadOnly.toString(),
      ...(type && { type })
    });
    
    const response = await axiosInstance.get(`/api/notifications?${queryParams}`);
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

// Get unread notification count
export const getUnreadNotificationCount = async () => {
  try {
    const response = await axiosInstance.get("/api/notifications/unread-count");
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId) => {
  try {
    const response = await axiosInstance.put(`/api/notifications/${notificationId}/read`);
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async () => {
  try {
    const response = await axiosInstance.put("/api/notifications/mark-all-read");
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

// Send heartbeat (update activity)
export const sendHeartbeat = async () => {
  try {
    const response = await axiosInstance.post("/api/notifications/heartbeat");
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

// Set user online
export const setUserOnline = async () => {
  try {
    const response = await axiosInstance.post("/api/notifications/online");
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

// Set user offline
export const setUserOffline = async () => {
  try {
    const response = await axiosInstance.post("/api/notifications/offline");
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

// Get online users
export const getOnlineUsers = async (limit = 50) => {
  try {
    const response = await axiosInstance.get(`/api/notifications/online-users?limit=${limit}`);
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

// Get online count
export const getOnlineCount = async () => {
  try {
    const response = await axiosInstance.get("/api/notifications/online-count");
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

// Check user online status
export const getUserOnlineStatus = async (userId) => {
  try {
    const response = await axiosInstance.get(`/api/notifications/status/${userId}`);
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

// Admin notification functions
export const sendAdminNotification = async (notificationData) => {
  try {
    const response = await axiosInstance.post("/api/notifications/admin/send", notificationData);
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

export const getAdminNotifications = async () => {
  try {
    const response = await axiosInstance.get("/api/notifications/admin/sent");
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

export const deleteAdminNotification = async (notificationId) => {
  try {
    const response = await axiosInstance.delete(`/api/notifications/admin/${notificationId}`);
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};
