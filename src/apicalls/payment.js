const { default: axiosInstance } = require(".");

export const addPayment = async (payload) => {
  try {
    const response = await axiosInstance.post("/api/payment/create-invoice", payload);
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};


export const checkPaymentStatus = async () => {
  try {
    const response = await axiosInstance.get(`/api/payment/check-payment-status`,);
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};