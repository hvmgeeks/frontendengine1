import axios from 'axios';
import { message } from 'antd';

const axiosInstance = axios.create({
    baseURL: 'https://server-fmff.onrender.com',
    timeout: 30000, // 30 seconds timeout for better user experience
});

// Add a request interceptor to dynamically set the authorization header
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            // Check if token is still valid before making request
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                const currentTime = Date.now() / 1000;

                if (payload.exp && payload.exp < currentTime) {
                    console.log('🔒 Token expired, clearing storage');
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                    return Promise.reject(new Error('Token expired'));
                }
            } catch (e) {
                console.log('⚠️ Invalid token format, clearing storage');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }

            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle authentication errors
axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Handle different types of errors
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
            // Don't redirect on timeout errors
            console.log('⏰ Request timeout detected');
            return Promise.reject(error);
        }

        // Handle 401 Unauthorized errors
        if (error.response && error.response.status === 401) {
            console.log('🔒 Authentication error detected:', error.response.data?.message);

            // Check if this is an AI-related request
            const isAIRequest = error.config?.url?.includes('/ai-questions') ||
                               error.config?.url?.includes('/auth/');

            if (isAIRequest) {
                // For AI requests, don't auto-redirect - let the component handle it
                console.log('🤖 AI authentication error - letting component handle');
                return Promise.reject(error);
            }

            // Only redirect for non-AI requests if it's a real authentication error
            const errorMessage = error.response.data?.message || '';
            const isRealAuthError = errorMessage.includes('expired') ||
                                   errorMessage.includes('Invalid token') ||
                                   errorMessage.includes('not authenticated');

            if (isRealAuthError) {
                // Clear the token
                localStorage.removeItem('token');
                localStorage.removeItem('user');

                // Show error message
                message.error('Your session has expired. Please login again.');

                // Redirect to login page only for non-AI requests
                setTimeout(() => {
                    window.location.href = '/login';
                }, 1000);
            }

            return Promise.reject(error);
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;