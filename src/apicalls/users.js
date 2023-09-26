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
In the code above, axiosInstance is assumed to be an instance of Axios that you have configured. It's used to send HTTP requests to your API server.

2. Using the registerUser and loginUser Functions:
Below is an example of how you can use these functions in your component or wherever you need to call them. It includes error handling to ensure that your application can gracefully handle and display errors to the user.

javascript
Copy code
// ExampleComponent.js
import React, { useState } from 'react';
import { loginUser, registerUser }



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
