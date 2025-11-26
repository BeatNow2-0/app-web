import apiConfig from './apiConfig.json';

// Producción: https://51.91.109.185:8001 (o dominio cuando lo tengas)
const baseUrl = apiConfig.API_BASE_URL.replace(/\/$/, '');

export const API_BASE_URL = baseUrl;

export const buildApiUrl = (path: string = ''): string => {
  // ⚠️ En desarrollo usamos rutas relativas para que Vite proxy funcione
  if (import.meta.env.DEV) {
    // Ej: buildApiUrl('/v1/api/users/login') → '/v1/api/users/login'
    return path.startsWith('/') ? path : `/${path}`;
  }

  // Producción: URL absoluta
  if (!path) {
    return baseUrl;
  }

  return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
};
