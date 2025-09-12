import axios from 'axios';
// TODO: reactivar cuando el equipo de auth dé el flujo final
// import { getToken } from '../domain/auth';
import { mapAxiosError } from '../domain/errors';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true // Usar cookies/sesión en lugar de tokens
});

// TODO: reactivar interceptor de token cuando el equipo de auth dé el flujo final
/*
api.interceptors.request.use(config => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    delete (config.headers as any).Authorization;
  }
  return config;
});
*/

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(mapAxiosError(error))
);
