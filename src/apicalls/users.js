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
        const response = await axiosInstance.post('/api/users/generate-otp', payload);
        return response.data;
    } catch (error) {
        // Return the error object so we can handle it properly in the component
        throw error;
    }
}

export const contactUs = async (payload) => {
    try {
        const response = await axiosInstance.post('/api/users/contact-us', payload);
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

export const getAllUsers = async () => {
    try {
        const response = await axiosInstance.get('/api/users/get-all-users');
        console.log("data :", response.data);
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
        console.log('🔄 Making API call to update user info:', payload);
        const response = await axiosInstance.post('/api/users/update-user-info', payload);
        console.log('✅ API call successful:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ API call failed:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            message: error.message
        });

        // Return error response data if available, otherwise throw the error
        if (error.response?.data) {
            return error.response.data;
        }
        throw error;
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

export const blockUserById = async (payload) => {
    try {
        const response = await axiosInstance.patch('/api/users/block-user', payload);
        return response.data;
    } catch (error) {
        return error.response.data;
    }
}

export const wipeLevelData = async (payload) => {
    try {
        const response = await axiosInstance.post('/api/users/wipe-level-data', payload);
        return response.data;
    } catch (error) {
        return error.response.data;
    }
}

export const deleteUserById = async (payload) => {
    try {
        const response = await axiosInstance.delete('/api/users/delete-user', { data: payload });
        return response.data;
    } catch (error) {
        return error.response.data;
    }
}