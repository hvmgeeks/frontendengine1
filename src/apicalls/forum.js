const { default: axiosInstance } = require(".");

// add question
export const addQuestion = async (payload) => {
    try {
        const response = await axiosInstance.post("/api/forum/add-question", payload);
        return response.data;
    } catch (error) {
        return error.response.data;
    }
}

// add reply
export const addReply = async (payload) => {
    try {
        const response = await axiosInstance.post("/api/forum/add-reply", payload);
        return response.data;
    } catch (error) {
        return error.response.data;
    }
}

// get all questions
export const getAllQuestions = async (params = {}) => {
    try {
        const { page = 1, limit = 50 } = params;
        const response = await axiosInstance.get(`/api/forum/get-all-questions?page=${page}&limit=${limit}`);
        return response.data;
    } catch (error) {
        return error.response.data;
    }
}

// delete question
export const deleteQuestion = async (questionId) => {
    try {
        const response = await axiosInstance.delete(`/api/forum/delete-question/${questionId}`);
        return response.data;
    } catch (error) {
        return error.response.data;
    }
}

// delete question
export const updateQuestion = async (payload, questionId) => {
    try {
        const response = await axiosInstance.put(`/api/forum/update-question/${questionId}`, payload);
        return response.data;
    } catch (error) {
        return error.response.data;
    }
}

// approve reply
export const updateReplyStatus = async (payload, questionId) => {
    try {
        const response = await axiosInstance.put(`/api/forum/update-reply-status/${questionId}`, payload);
        return response.data;
    } catch (error) {
        return error.response.data;
    }
}



