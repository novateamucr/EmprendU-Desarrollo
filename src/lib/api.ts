import axios from 'axios';
import { mapAxiosError } from '../domain/errors';

// Get the base URL from environment variables or use the default
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// Create axios instance with base configuration
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  withCredentials: true,
  timeout: 10000, // 10 seconds timeout
});

// Add CORS headers to all responses
api.interceptors.response.use(
  (response) => {
    // Add CORS headers to the response
    if (response.headers) {
      response.headers['Access-Control-Allow-Origin'] = window.location.origin;
      response.headers['Access-Control-Allow-Credentials'] = 'true';
    }
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add request interceptor to include auth token and handle CORS
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    // Add CORS headers to all requests
    config.headers = config.headers || {};
    config.headers['Access-Control-Allow-Origin'] = window.location.origin;
    config.headers['Access-Control-Allow-Credentials'] = 'true';
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // For non-simple requests (like POST with JSON), we need to handle preflight
    if (config.method !== 'get' && config.method !== 'head') {
      config.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
      config.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With';
    }
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        const response = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL || 'http://emprendu-backend.test/api'}/refresh-token`,
          {},
          { withCredentials: true }
        );
        
        const { token } = response.data;
        localStorage.setItem('token', token);
        
        // Update the Authorization header
        originalRequest.headers.Authorization = `Bearer ${token}`;
        
        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, clear auth and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    // For other errors, use the existing error mapping
    return Promise.reject(mapAxiosError(error));
  }
);
