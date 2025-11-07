import axios, { AxiosHeaders, InternalAxiosRequestConfig } from 'axios';

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

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Create a new config object to avoid mutating the original
    const newConfig = { ...config };
    
    // Initialize headers if they don't exist
    if (!newConfig.headers) {
      newConfig.headers = new AxiosHeaders();
    }
    
    // Only run in browser environment
    if (typeof window !== 'undefined') {
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      // Log token for debugging
      console.log('Token from localStorage:', token ? 'Found' : 'Not found');
      
      // Add authorization header if token exists
      if (token) {
        newConfig.headers.set('Authorization', `Bearer ${token}`);
        console.log('Authorization header set with token');
      }
      
      // Set default headers if not already set
      if (!newConfig.headers['Accept']) {
        newConfig.headers.set('Accept', 'application/json');
      }
      
      if (!newConfig.headers['X-Requested-With']) {
        newConfig.headers.set('X-Requested-With', 'XMLHttpRequest');
      }
      
      // For file uploads, let the browser set the Content-Type with the boundary
      if (newConfig.data instanceof FormData) {
        newConfig.headers.delete('Content-Type');
      } else if (!newConfig.headers['Content-Type']) {
        newConfig.headers.set('Content-Type', 'application/json');
      }
      
      // Set CORS headers for browser environment
      newConfig.headers.set('Access-Control-Allow-Credentials', 'true');
      newConfig.headers.set('Access-Control-Allow-Origin', window.location.origin);
      
      // Log final headers for debugging
      console.log('Request headers:', JSON.stringify(newConfig.headers, null, 2));
    }
    
    return newConfig;
    
    // Return the new config with updated headers
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('API Error Response:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
      });
    } else if (error.request) {
      // The request was made but no response was received
      console.error('API Request Error:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('API Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

