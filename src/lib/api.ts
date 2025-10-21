import axios from 'axios';

// Get the base URL from environment variables or use the default
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://emprendu-backend.test/api';

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


