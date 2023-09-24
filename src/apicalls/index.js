import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: 'http://16.16.56.238:5000',
    headers: {
         Authorization : `Bearer ${localStorage.getItem('token')}`
    }
});

export default axiosInstance;
