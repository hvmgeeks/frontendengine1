const { default: axiosInstance } = require(".");

export const addPayment = async (payload) => {
  try {
    const response = await axiosInstance.post("/api/payment/create-invoice", payload);
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};


export const checkPaymentStatus = async (payload = {}) => {
  try {
    console.log('🔍 Checking payment status with payload:', payload);

    // If orderId is provided, use the POST endpoint for order-specific status check
    if (payload.orderId) {
      console.log('📤 Using POST endpoint for order:', payload.orderId);
      const response = await axiosInstance.post(`/api/payment/check-payment-status`, payload);
      console.log('📥 POST response:', response.data);
      return response.data;
    } else {
      // If no orderId, use the GET endpoint for general subscription status
      console.log('📤 Using GET endpoint for general status');
      const response = await axiosInstance.get(`/api/payment/check-payment-status`);
      console.log('📥 GET response:', response.data);
      return response.data;
    }
  } catch (error) {
    console.error('❌ Payment status check error:', error);

    // Handle 404 errors specifically
    if (error.response?.status === 404) {
      console.error('❌ Payment status endpoint not found (404)');
      return {
        success: false,
        message: 'Payment status service temporarily unavailable',
        error: 'ENDPOINT_NOT_FOUND'
      };
    }

    // Handle 401 errors (authentication)
    if (error.response?.status === 401) {
      console.error('❌ Authentication required for payment status check');
      return {
        success: false,
        message: 'Authentication required',
        error: 'AUTH_REQUIRED'
      };
    }

    // Handle other errors
    return error.response?.data || {
      success: false,
      message: error.message || 'Payment status check failed',
      error: 'UNKNOWN_ERROR'
    };
  }
};