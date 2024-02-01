const { default: axiosInstance } = require(".");

// add review
export const addReview = async (payload) => {
    try {
        const response = await axiosInstance.post("/api/reviews/add-review", payload);
        return response.data;
    } catch (error) {
        return error.response.data;
    }
}

// get all reviews
export const getAllReviews = async () => {
    try {
        const response = await axiosInstance.get("/api/reviews/get-all-reviews");
        return response.data;
    } catch (error) {
        return error.response.data;
    }
}
 
