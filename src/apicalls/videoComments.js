import axiosInstance from "./index";

// Get comments for a specific video
export const getVideoComments = async (videoId, page = 1, limit = 20) => {
  try {
    const response = await axiosInstance.get(`/api/video-comments/${videoId}?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    return error.response?.data || { success: false, message: "Network error" };
  }
};

// Add a new comment to a video
export const addVideoComment = async (payload) => {
  try {
    console.log('🚀 Making video comment API call with payload:', payload);
    console.log('🔍 Payload details:');
    console.log('  - videoId:', payload.videoId, '(type:', typeof payload.videoId, ', length:', payload.videoId?.length, ')');
    console.log('  - text:', payload.text, '(type:', typeof payload.text, ', length:', payload.text?.length, ')');
    console.log('  - Keys in payload:', Object.keys(payload));

    const response = await axiosInstance.post("/api/video-comments/add", payload);
    console.log('✅ Video comment API response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Video comment API error:', error);
    console.error('❌ Error response:', error.response?.data);
    console.error('❌ Error status:', error.response?.status);
    console.error('❌ Error message:', error.response?.data?.message);
    return error.response?.data || { success: false, message: "Network error" };
  }
};

// Add a reply to a comment
export const addCommentReply = async (commentId, payload) => {
  try {
    const response = await axiosInstance.post(`/api/video-comments/reply/${commentId}`, payload);
    return response.data;
  } catch (error) {
    return error.response?.data || { success: false, message: "Network error" };
  }
};

// Like or unlike a comment/reply
export const likeComment = async (commentId, payload) => {
  try {
    const response = await axiosInstance.post(`/api/video-comments/like/${commentId}`, payload);
    return response.data;
  } catch (error) {
    return error.response?.data || { success: false, message: "Network error" };
  }
};

// Delete a comment
export const deleteVideoComment = async (commentId) => {
  try {
    const response = await axiosInstance.delete(`/api/video-comments/delete/${commentId}`);
    return response.data;
  } catch (error) {
    return error.response?.data || { success: false, message: "Network error" };
  }
};
