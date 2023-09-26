const { default: axiosInstance } = require(".");


export const loginUser = async (payload) => {
    try {
        const response = await axiosInstance.post('/api/users/login', payload);
        console.log(response);
        return response.data;
    } catch (error) {
        console.error(error);
        if (error.response) {
            return error.response.data;
        } else {
            return { error: 'Network error or server is unreachable' };
        }
    }
}

export const registerUser = async (payload) => {
    try {
        const response = await axiosInstance.post('/api/users/register', payload);
        console.log(response);
        return response.data;
    } catch (error) {
        console.error(error);
        if (error.response) {
            return error.response.data;
        } else {
            return { error: 'Network error or server is unreachable' };
        }
    }
}

// export const registerUser = async (payload) => {
//     try {
//         const response = await axiosInstance.post('/api/users/register', payload);
//         console.log(response);
//         return response.data;
//     } catch (error) {
//         return error.response.data;
//     }
// }


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
