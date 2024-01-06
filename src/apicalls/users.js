const { default: axiosInstance } = require(".");

export const registerUser = async (payload) => {
    try {
        const response = await axiosInstance.post('/api/users/register', payload);
        return response.data;
    } catch (error) {
        return error.response.data;
    }
}

export const sendOTP = async (payload) => {
    try {
        const response = await axiosInstance.post('/api/users/otp', payload);
        return response.data;
    } catch (error) {
        return error.response.data;
    }
}


export const loginUser = async (payload) => {
    try {
        const response = await axiosInstance.post('/api/users/login', payload);
        return response.data;
    } catch (error) {
        return error.response.data;
    }
}

export const getUserInfo = async () => {
    try {
        const response = await axiosInstance.post('/api/users/get-user-info');
        return response.data;
    } catch (error) {
        return error.response.data;
    }
}

export const updateUserInfo = async (payload) => {
    try {
        const response = await axiosInstance.post('/api/users/update-user-info', payload);
        return response.data;
    } catch (error) {
        return error.response.data;
    }
}

export const updateUserPhoto = async (payload) => {
    try {
        const response = await axiosInstance.post('/api/users/update-user-photo', payload);
        return response.data;
    } catch (error) {
        return error.response.data;
    }
}