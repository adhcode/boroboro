import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { secureStorage } from './secure-storage';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
  withCredentials: false, // No cookies - using Bearer tokens
});

// Request interceptor - add auth token to requests
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from secure storage
    const token = secureStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Update last activity on each request
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('lastActivity', Date.now().toString());
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = secureStorage.getItem('refreshToken');
        
        if (!refreshToken) {
          // No refresh token, redirect to login
          if (typeof window !== 'undefined') {
            secureStorage.removeItem('accessToken');
            secureStorage.removeItem('refreshToken');
            secureStorage.removeItem('user');
            window.location.href = '/auth/signin';
          }
          return Promise.reject(error);
        }

        // Attempt to refresh the token
        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          { refreshToken },
          {
            headers: { 'Content-Type': 'application/json' },
          }
        );

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data;

        // Update tokens
        secureStorage.setItem('accessToken', newAccessToken);
        secureStorage.setItem('refreshToken', newRefreshToken);

        // Retry original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        if (typeof window !== 'undefined') {
          secureStorage.removeItem('accessToken');
          secureStorage.removeItem('refreshToken');
          secureStorage.removeItem('user');
          window.location.href = '/auth/signin';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
