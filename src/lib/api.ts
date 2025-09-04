import axios from 'axios';
import { getToken } from '../domain/auth';
import { mapAxiosError } from '../domain/errors';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use(config => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    delete (config.headers as any).Authorization;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(mapAxiosError(error))
);
