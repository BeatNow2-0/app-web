# BeatNow Producer Web

## Local

```bash
cp .env.example .env.local
npm install
npm run dev
```

Por defecto Vite arranca en `http://localhost:5173` y hace proxy de `/v1/api/*` a `http://127.0.0.1:8000`.

Si tu backend escucha en otro puerto, cambia `VITE_API_PROXY_TARGET` en `.env.local`.

## Vercel

- Root Directory: `app-web`
- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`

Variables recomendadas en Vercel:

```bash
VITE_API_BASE_URL=https://api.beatnow.app
```
