import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

export function setupInterceptors() {
  // Request interceptor: attach Authorization header
  axios.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Response interceptor: handle 401
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error?.response?.status === 401) {
        useAuthStore.getState().logout();
      }
      return Promise.reject(error);
    },
  );
}
