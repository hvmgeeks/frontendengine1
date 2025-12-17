import axiosInstance from ".";

// Ask AI a question about the PDF
export const askPDFQuestion = async (payload) => {
  try {
    const response = await axiosInstance.post("/api/pdf-chat/ask", payload);
    return response.data;
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || error.message
    };
  }
};

// Clear conversation history
export const clearPDFChatHistory = async (language = 'english') => {
  try {
    const response = await axiosInstance.post("/api/pdf-chat/clear-history", { language });
    return response.data;
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || error.message
    };
  }
};

