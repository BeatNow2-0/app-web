import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const production = mode === 'production';
  const origins = [env.VITE_API_URL, ...(env.VITE_MEDIA_ORIGINS || '').split(',')].map(value => value?.trim()).filter(Boolean).filter(value => !value.startsWith('/')).map(value => {
    const url = new URL(value);
    if (url.username || url.password || (production && (url.protocol !== 'https:' || ['localhost','127.0.0.1','[::1]'].includes(url.hostname)))) throw new Error('Production API/media URLs must use HTTPS without credentials or development hosts');
    return url.origin;
  });
  const allowed = [...new Set(origins)].join(' ');
  const csp = `default-src 'self'; connect-src 'self' ${allowed}; img-src 'self' data: blob: ${allowed}; media-src 'self' blob: ${allowed}; style-src 'self' 'unsafe-inline'; script-src 'self'; font-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests`;
  return {
    plugins: [react(), {
      // react-router includes a server-rendering fallback URL. It is not used in the
      // browser, but keeping a development origin in a production artifact makes
      // security scans noisy and violates our deploy contract.
      name: 'neutral-router-url-base',
      renderChunk(code: string) { return code.includes('http://localhost') ? code.replaceAll('http://localhost', 'https://url.invalid') : null; },
    }, { name: 'production-security-policy', transformIndexHtml(html: string) { return production ? html.replace('<head>', `<head><meta http-equiv="Content-Security-Policy" content="${csp}">`) : html; } }],
    server: { host: '127.0.0.1', port: 5173, strictPort: true, proxy: env.DEV_API_PROXY ? { '/v1/api': { target: env.DEV_API_PROXY }, '/api/v1': { target: env.DEV_API_PROXY } } : undefined },
    build: { sourcemap: false },
  };
});
