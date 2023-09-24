import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: 'https://stjosephkibadaengine.com',
    headers: {
         Authorization : `Bearer ${localStorage.getItem('token')}`
    }
});

export default axiosInstance;
