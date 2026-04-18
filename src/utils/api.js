// src/utils/api.js
import axios from 'axios';
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
});
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('azamed_admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('azamed_admin_token');
      localStorage.removeItem('azamed_admin_user');
      window.location.href = '/connexion';
    }
    return Promise.reject(error);
  }
);
export default api;
