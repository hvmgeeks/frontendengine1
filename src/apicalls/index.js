import axios from 'axios';
import { message } from 'antd';

const axiosInstance = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
    timeout: 60000, // 60 seconds timeout for file uploads
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
                const timeUntilExpiry = payload.exp - currentTime;

                console.log('🔍 Token check:', {
                    expiresAt: new Date(payload.exp * 1000).toLocaleString(),
                    timeUntilExpiry: `${Math.floor(timeUntilExpiry / 3600)}h ${Math.floor((timeUntilExpiry % 3600) / 60)}m`,
                    isExpired: payload.exp < currentTime
                });

                if (payload.exp && payload.exp < currentTime) {
                    console.error('🔒🔒🔒 TOKEN EXPIRED - NOT REDIRECTING FOR DEBUG 🔒🔒🔒');
                    console.error('Token expired at:', new Date(payload.exp * 1000).toLocaleString());
                    console.error('Current time:', new Date(currentTime * 1000).toLocaleString());
                    // DISABLED AUTO-REDIRECT FOR DEBUGGING
                    // localStorage.removeItem('token');
                    // localStorage.removeItem('user');
                    // window.location.href = '/login';
                    // return Promise.reject(new Error('Token expired'));
                }
            } catch (e) {
                console.error('⚠️⚠️⚠️ INVALID TOKEN FORMAT - NOT CLEARING FOR DEBUG ⚠️⚠️⚠️', e);
                // DISABLED AUTO-CLEAR FOR DEBUGGING
                // localStorage.removeItem('token');
                // localStorage.removeItem('user');
            }

            config.headers.Authorization = `Bearer ${token}`;
        } else {
            console.log('❌ No token found in localStorage - please login again');
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
                console.error('🚨🚨🚨 AUTH ERROR DETECTED - NOT REDIRECTING FOR DEBUG 🚨🚨🚨');
                console.error('Error message:', errorMessage);
                // DISABLED AUTO-REDIRECT FOR DEBUGGING
                // localStorage.removeItem('token');
                // localStorage.removeItem('user');
                // message.error('Your session has expired. Please login again.');
                // setTimeout(() => {
                //     window.location.href = '/login';
                // }, 1000);
            }

            return Promise.reject(error);
        }

        // Handle 403 Payment Required errors
        if (error.response && error.response.status === 403) {
            const errorData = error.response.data;

            if (errorData.errorType === "PAYMENT_PENDING") {
                console.log('💳 Payment pending error detected');

                message.error({
                    content: (
                        <div>
                            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                                Account Not Activated
                            </div>
                            <div style={{ marginBottom: '4px' }}>
                                {errorData.message}
                            </div>
                            {errorData.pendingSubscription && (
                                <div style={{ fontSize: '12px', color: '#666' }}>
                                    Plan: {errorData.pendingSubscription.plan} |
                                    Amount: {errorData.pendingSubscription.amount?.toLocaleString()} TZS
                                </div>
                            )}
                            <div style={{ fontSize: '12px', color: '#1890ff', marginTop: '4px' }}>
                                Complete your payment to access this feature.
                            </div>
                        </div>
                    ),
                    duration: 8,
                    style: { marginTop: '20px' }
                });

                // Redirect to subscription page after a delay
                setTimeout(() => {
                    window.location.href = '/user/subscription';
                }, 3000);

            } else if (errorData.errorType === "SUBSCRIPTION_REQUIRED") {
                console.log('📋 Subscription required error detected');

                message.error({
                    content: (
                        <div>
                            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                                Subscription Required
                            </div>
                            <div style={{ marginBottom: '4px' }}>
                                {errorData.message}
                            </div>
                            <div style={{ fontSize: '12px', color: '#1890ff', marginTop: '4px' }}>
                                Choose a subscription plan to get started.
                            </div>
                        </div>
                    ),
                    duration: 8,
                    style: { marginTop: '20px' }
                });

                // Redirect to subscription page after a delay
                setTimeout(() => {
                    window.location.href = '/user/subscription';
                }, 3000);
            }

            return Promise.reject(error);
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;