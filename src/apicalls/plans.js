const { default: axiosInstance } = require(".");

export const getPlans = async (payload) => {
    try {
      const response = await axiosInstance.get("/api/plans", payload);
      return response.data;
    } catch (error) {
      return error.response.data;
    }
  };