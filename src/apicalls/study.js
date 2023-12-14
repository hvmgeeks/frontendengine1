const { default: axiosInstance } = require(".");

// get all reports
export const getStudyMaterial = async (filters) => {
    try {
        const response = await axiosInstance.post("/api/study/get-study-content" , filters);
        return response;
    } catch (error) {
        return error.response;
    }
} 
