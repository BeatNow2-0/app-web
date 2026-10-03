import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '../../config/apiConfig';
import type { ApiErrorPayload, AuthResponse } from '../../types/api';

export const ACCESS_TOKEN_STORAGE_KEY = 'token';
export const REFRESH_TOKEN_STORAGE_KEY = 'refresh_token';

export const apiClient = axios.create({
  baseURL: API_BASE_URL || undefined,
  timeout: 30_000,
  headers: { Accept: 'application/json' },
});

const authClient = axios.create({
  baseURL: API_BASE_URL || undefined,
  timeout: 20_000,
  headers: { Accept: 'application/json' },
});

let refreshPromise: Promise<string> | null = null;

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
}

export function persistSessionTokens(session: AuthResponse): void {
  localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, session.access_token);
  localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, session.refresh_token);
  window.dispatchEvent(new Event('beatnow:session-change'));
}

export function clearSessionTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  window.dispatchEvent(new Event('beatnow:session-change'));
}

async function refreshAccessToken(): Promise<string> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error('No refresh token available');
  const { data } = await authClient.post<AuthResponse>('/v1/api/users/refresh', { refresh_token: refreshToken });
  persistSessionTokens(data);
  return data.access_token;
}

function getSharedRefresh(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetryableConfig | undefined;
    const isAuthEndpoint = Boolean(config?.url && /\/users\/(login|refresh|logout)$/.test(config.url));
    if (error.response?.status === 401 && config && !config._retry && !isAuthEndpoint && getRefreshToken()) {
      config._retry = true;
      try {
        const accessToken = await getSharedRefresh();
        config.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(config);
      } catch {
        clearSessionTokens();
        window.dispatchEvent(new Event('beatnow:session-expired'));
      }
    }
    return Promise.reject(error);
  },
);

const statusMessages: Record<number, string> = {
  400: 'The request is not valid. Review the information and try again.',
  401: 'Your session has expired. Sign in again.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested content could not be found.',
  409: 'This change conflicts with existing information.',
  413: 'The selected file is larger than allowed.',
  415: 'The selected file format is not supported.',
  422: 'Some fields are invalid. Review the form and try again.',
  429: 'Too many attempts. Wait a moment and try again.',
  500: 'BeatNow had an unexpected problem. Try again shortly.',
  503: 'BeatNow is temporarily unavailable. Try again shortly.',
};

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (!axios.isAxiosError<ApiErrorPayload>(error)) return error instanceof Error ? error.message : fallback;
  if (error.code === 'ERR_CANCELED') return 'The request was cancelled.';
  if (error.code === 'ECONNABORTED') return 'The request took too long. Check your connection and try again.';
  if (!error.response) return 'We could not connect to BeatNow. Check your internet connection.';
  const detail = error.response.data?.detail;
  // FastAPI returns useful field or file validation details with 422 responses.
  // Keep these visible in production so users can tell why an upload was rejected.
  if (error.response.status === 422) {
    if (typeof detail === 'string' && detail.trim()) return detail;
    if (Array.isArray(detail) && detail.length) {
      return detail.map((item) => {
        const field = item.loc?.filter((part) => part !== 'body').join('.');
        return field ? `${field}: ${item.msg || 'Invalid value'}` : item.msg || 'Invalid value';
      }).join('. ');
    }
    if (detail && typeof detail === 'object') {
      if (typeof detail.message === 'string' && detail.message.trim()) return detail.message;
      if (typeof detail.code === 'string' && detail.code.trim()) return detail.code;
    }
  }
  if (typeof detail === 'string' && import.meta.env.DEV) return detail;
  if (Array.isArray(detail) && detail.length && import.meta.env.DEV) {
    return detail.map((item) => item.msg || 'Invalid value').join(', ');
  }
  return statusMessages[error.response.status] || fallback;
}

export function isUnauthorized(error: unknown): boolean {
  return axios.isAxiosError(error) && [401, 403].includes(error.response?.status ?? 0);
}
