export function validateApiBaseUrl(value: string, production: boolean): string {
  const url = value.trim().replace(/\/$/, '');
  if (!url || (/^\/(?!\/)/.test(url) && !url.includes('\\'))) return url;
  const parsed = new URL(url);
  if (parsed.username || parsed.password || parsed.search || parsed.hash) throw new Error('Invalid API configuration');
  if (parsed.protocol !== 'https:' && (production || parsed.protocol !== 'http:')) throw new Error('The API must use HTTPS');
  return url;
}
export const API_BASE_URL = validateApiBaseUrl(import.meta.env.VITE_API_URL || '', import.meta.env.PROD);
export const buildApiUrl = (path = '') => `${API_BASE_URL}${path && !path.startsWith('/') ? '/' : ''}${path}`;
