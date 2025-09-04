import { getToken } from './auth';

export type ApiErrorKind = 'unauth' | 'notfound' | 'server' | 'network' | 'unknown';

export interface ApiError extends Error {
  kind: ApiErrorKind;
  status?: number;
  data?: unknown;
  hasCredentials?: boolean; // nuevo: había token al fallar
}

export function mapAxiosError(err: any): ApiError {
  const e: ApiError = new Error('API error') as ApiError;
  e.hasCredentials = !!getToken();

  if (err?.response) {
    const status = err.response.status;
    e.status = status;
    e.data = err.response.data;
    if (status === 401 || status === 419) {
      e.kind = 'unauth';
    } else if (status === 404) {
      e.kind = 'notfound';
    } else if (status >= 500) {
      e.kind = 'server';
    } else {
      e.kind = 'unknown';
    }
    e.message = `HTTP ${status}`;
    return e;
  }

  if (err?.request) {
    e.kind = 'network';
    e.message = 'Network/CORS error';
    return e;
  }

  e.kind = 'unknown';
  e.message = err?.message || 'Unknown error';
  return e;
}
