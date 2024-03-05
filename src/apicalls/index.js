import axios from 'axios';

const axiosInstance = axios.create({
     baseURL: 'https://server-fmff.onrender.com' ,
    //baseURL: 'http://localhost:5000' ,
    headers: {
        Authorization : `Bearer ${localStorage.getItem('token')}`
    }
});

export default axiosInstance;