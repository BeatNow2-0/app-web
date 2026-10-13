import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '../../config/apiConfig';
import type { AuthResponse } from '../../types/api';

declare module 'axios' { export interface AxiosRequestConfig { skipAuthRefresh?: boolean } }
const options = { baseURL: API_BASE_URL || undefined, timeout: 30_000, withCredentials: true, headers: { Accept: 'application/json' } };
export const apiClient = axios.create(options);
export const authClient = axios.create(options);
let accessToken: string | null = null;
let sessionGeneration = 0;
let refreshPromise: Promise<string> | null = null;
export const getAccessToken = () => accessToken;

// One-time migration: old versions persisted secrets. Never read or migrate their values.
export function removeLegacySession(): void {
  for (const storage of [localStorage, sessionStorage]) {
    for (const key of ['token', 'refresh_token', 'password', 'credentials', 'beatnow_verification_token']) storage.removeItem(key);
  }
}
export function persistSessionTokens(session: AuthResponse): void {
  if (!session || typeof session.access_token !== 'string' || !session.access_token) throw new Error('Invalid session response. Please sign in again.');
  accessToken = session.access_token;
  window.dispatchEvent(new Event('beatnow:session-change'));
}
export function clearSessionTokens(): void {
  sessionGeneration++;
  accessToken = null;
  window.dispatchEvent(new Event('beatnow:session-expired'));
}
export function restoreSession(): Promise<string> {
  if (!refreshPromise) {
    const generation = sessionGeneration;
    refreshPromise = authClient.post<AuthResponse>('/v1/api/users/web/refresh').then(({ data }) => {
      if (generation !== sessionGeneration) throw new Error('Session ended. Please sign in again.');
      persistSessionTokens(data);
      return data.access_token;
    }).finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}
apiClient.interceptors.request.use((config) => {
  if (accessToken && !config.skipAuthRefresh && !config.headers.Authorization) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});
export function validateJsonResponse<T extends { status: number; data: unknown; headers: Record<string, unknown> }>(response: T): T {
  if (response.status !== 204 && response.data !== '' && !String(response.headers['content-type'] || '').includes('json')) {
    throw new Error('The server returned an unexpected response. Please try again.');
  }
  return response;
}
authClient.interceptors.response.use(validateJsonResponse);
apiClient.interceptors.response.use(validateJsonResponse, async (error: AxiosError) => {
  const config = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
  if (error.response?.status === 401 && config && !config.skipAuthRefresh && !config._retry) {
    config._retry = true;
    try {
      const token = await restoreSession();
      config.headers.Authorization = `Bearer ${token}`;
      return apiClient(config);
    } catch (refreshError) {
      // Network failures retain the session so the user can retry; rejected refresh ends it.
      if (axios.isAxiosError(refreshError) && [401, 403].includes(refreshError.response?.status || 0)) clearSessionTokens();
      throw refreshError;
    }
  }
  if (error.response?.status === 401 && config?._retry) clearSessionTokens();
  throw error;
});
const statusMessages: Record<number, string> = {
  400: 'Review the information and try again.', 401: 'Your session has expired. Sign in again.',
  403: 'You do not have permission to perform this action.', 404: 'This content is no longer available.',
  409: 'This change conflicts with existing information. Reload and try again.',
  413: 'The selected file is larger than allowed.', 415: 'The file format is not supported or the file is damaged.',
  422: 'Some fields or files are invalid. Review the form and try again.',
  429: 'Too many attempts. Wait a minute and try again.',
};
export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (!axios.isAxiosError(error)) return error instanceof Error ? error.message : fallback;
  if (error.code === 'ERR_CANCELED') return 'The request was cancelled. Check your catalog before retrying a publication.';
  if (['ECONNABORTED', 'ETIMEDOUT'].includes(error.code || '')) return 'The request took too long. Check your connection and try again.';
  if (!error.response) return 'We could not connect to BeatNow. Check your connection and retry.';
  if (error.response.status >= 500) return 'BeatNow is temporarily unavailable. Please try again shortly.';
  return statusMessages[error.response.status] || fallback;
}
export const isUnauthorized = (error: unknown) => axios.isAxiosError(error) && [401, 403].includes(error.response?.status || 0);
