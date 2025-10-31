import axios, { AxiosRequestConfig } from 'axios';

const API_BASE_URL = 'https://emprendu-desarrollo-production.up.railway.app/api';

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
  (config) => {
    let token = localStorage.getItem('token');
    if (!token && typeof document !== 'undefined') {
      // Fallback: try to read token from cookies (e.g., set by login)
      const match = document.cookie.split('; ').find((c) => c.startsWith('token='));
      if (match) {
        token = decodeURIComponent(match.split('=')[1]);
      }
    }
    
    // Add CORS headers to all requests
    config.headers = config.headers || {};
    config.headers['Access-Control-Allow-Origin'] = window.location.origin;
    config.headers['Access-Control-Allow-Credentials'] = 'true';
    
    const token = localStorage.getItem('token');
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    // For file uploads, let the browser set the Content-Type with the boundary
    if (config.data instanceof FormData) {
      delete headers['Content-Type'];
    }
    
    return {
      ...config,
      headers: {
        ...headers,
        // Ensure these headers are set for CORS
        'Access-Control-Allow-Origin': window.location.origin,
        'Access-Control-Allow-Credentials': 'true',
      },
    };
  },
  (error: any) => {
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

