const defaultApiBaseUrl = 'https://api.beatnow.app';
const configuredUrl = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || defaultApiBaseUrl).trim();

export const API_BASE_URL = configuredUrl.replace(/\/$/, '');

export const buildApiUrl = (path: string = ''): string => {
  if (!path) {
    return API_BASE_URL;
  }
  return `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};
