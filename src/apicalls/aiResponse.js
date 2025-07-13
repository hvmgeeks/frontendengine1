import axiosInstance from "./index";

// Auto AI Response for Forum Questions
export const getForumAIResponse = async (questionData) => {
  try {
    const response = await axiosInstance.post("/api/ai-response/forum-response", questionData);
    return response.data;
  } catch (error) {
    return error.response?.data || { success: false, message: "Error getting AI response" };
  }
};

// Auto AI Response for Video Comments
export const getVideoCommentAIResponse = async (commentData) => {
  try {
    const response = await axiosInstance.post("/api/ai-response/video-comment-response", commentData);
    return response.data;
  } catch (error) {
    return error.response?.data || { success: false, message: "Error getting AI response" };
  }
};

// Past Paper Discussion with AI
export const getPastPaperAIResponse = async (discussionData) => {
  try {
    const response = await axiosInstance.post("/api/ai-response/past-paper-discussion", discussionData);
    return response.data;
  } catch (error) {
    return error.response?.data || { success: false, message: "Error getting AI response" };
  }
};

// Get AI Conversation History
export const getAIConversationHistory = async (contextType, contextId) => {
  try {
    const response = await axiosInstance.get(`/api/ai-response/conversation/${contextType}/${contextId}`);
    return response.data;
  } catch (error) {
    return error.response?.data || { success: false, message: "Error getting conversation history" };
  }
};

// Check AI Service Health
export const checkAIServiceHealth = async () => {
  try {
    const response = await axiosInstance.get("/api/ai-response/health");
    return response.data;
  } catch (error) {
    return error.response?.data || { success: false, message: "AI service unavailable" };
  }
};
