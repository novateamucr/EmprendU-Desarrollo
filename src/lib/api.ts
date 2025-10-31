import axios, { AxiosHeaders, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://emprendu-desarrollo-production.up.railway.app/api';

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
    // Create new headers object using AxiosHeaders
    const headers = new AxiosHeaders({
      ...config.headers,
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'Access-Control-Allow-Credentials': 'true'
    });
    
    // Only run in browser environment
    if (typeof window !== 'undefined') {
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      // Add authorization header if token exists
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      
      // For file uploads, let the browser set the Content-Type with the boundary
      if (config.data instanceof FormData) {
        headers.delete('Content-Type');
      } else {
        headers.set('Content-Type', 'application/json');
      }
      
      // Set CORS headers for browser environment
      headers.set('Access-Control-Allow-Origin', window.location.origin);
    } else {
      // Set default CORS headers for non-browser environment
      headers.set('Access-Control-Allow-Origin', '*');
    }
    
    // Return new config with updated headers
    return {
      ...config,
      headers
    };
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

