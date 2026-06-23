import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000
});

api.interceptors.response.use(
  res => res,
  err => {
    const message = err.response?.data?.message || 'Something went wrong';
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    if (err.response?.status !== 401) toast.error(message);
    return Promise.reject(err);
  }
);

export default api;
