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
export const getAllQuestions = async () => {
    try {
        const response = await axiosInstance.get("/api/forum/get-all-questions");
        return response.data;
    } catch (error) {
        return error.response.data;
    }
}
 
