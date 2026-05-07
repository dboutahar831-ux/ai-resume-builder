import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3000/api' : '/api'),
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    const url = err.config?.url || '';
    const isHeartbeat = url.includes('heartbeat');
    if (err.response?.status === 401 && !isHeartbeat) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    if (err.response?.status === 429) {
      console.warn('Rate limited:', err.response?.data?.error || 'Too many requests');
    }
    return Promise.reject(err);
  }
);

export default api;
