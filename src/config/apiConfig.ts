const defaultApiBaseUrl = 'https://api.beatnow.app';
const envApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const baseUrl = (envApiBaseUrl || defaultApiBaseUrl).replace(/\/$/, '');
const devProxyPrefix = import.meta.env.VITE_API_PROXY_PREFIX?.trim() || '';

export const API_BASE_URL = baseUrl;

export const buildApiUrl = (path: string = ''): string => {
  if (import.meta.env.DEV) {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${devProxyPrefix}${normalizedPath}`;
  }

  if (!path) {
    return baseUrl;
  }

  return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
};
