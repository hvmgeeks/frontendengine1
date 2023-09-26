const { default: axiosInstance } = require(".");

export const registerUser = async (payload) => {
    try {
        const response = await axiosInstance.post('/api/users/register', payload);
        console.log(response);
        return response.data;
    } catch (error) {
        return error.response.data;
    }
}

export const loginUser = async (payload) => {
    try {
        const response = await axiosInstance.post('/api/users/login', payload);
        console.log(response);
        return response.data;
    } catch (error) {
        // Log the error for debugging.
        console.error(error);

        // Check if error.response is defined.
        if (error.response) {
            return error.response.data;
        } else {
            // Handle error differently if error.response is undefined.
            return { error: 'Network error or server is unreachable' };
        }
    }
}

// export const loginUser = async (payload) => {
//     try {
//         const response = await axiosInstance.post('/api/users/login', payload);
//         console.log(response);
//         return response.data;
//     } catch (error) {
//         return error.response.data;
//     }
// }

export const getUserInfo = async () => {
    try {
        const response = await axiosInstance.post('/api/users/get-user-info');
        console.log(response);
        return response.data;
    } catch (error) {
        return error.response.data;
    }
}
