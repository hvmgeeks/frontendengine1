const { default: axiosInstance } = require(".");

// add report
export const uploadImg = async (payload) => {
    try {
        const response = await axiosInstance.post("/api/image", payload);
        return response.data;
    } catch (error) {
        return error.response.data;
    }
}

