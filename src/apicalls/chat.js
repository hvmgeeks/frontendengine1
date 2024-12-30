const { default: axiosInstance } = require(".");

// add report
export const uploadImg = async (payload) => {
    try {
        const response = await axiosInstance.post("/api/image/upload", payload);
        return response.data;
    } catch (error) {
        return error.response.data;
    }
}

export const chatWithChatGPT = async (payload) => {
    try {
        const response = await axiosInstance.post("/api/chatgpt/chat", payload);
        return response.data;
    } catch (error) {
        return error.response.data;
    }
}

