import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: https://backend-r0tz.onrender.com',
    headers: {
         Authorization : `Bearer ${localStorage.getItem('token')}`
    }
});

export default axiosInstance;
