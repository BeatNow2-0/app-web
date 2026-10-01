# BeatNow Producer Web

## Local

```bash
cp .env.example .env.local
npm install
npm run dev
```

Por defecto Vite arranca en `http://localhost:5173` y usa el backend definido en `VITE_API_URL`.

Para trabajar contra un backend local, configura `VITE_API_URL=http://127.0.0.1:8000` en `.env.local`.

## Vercel

- Root Directory: `app-web`
- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`

Variables recomendadas en Vercel:

```bash
VITE_API_URL=https://api.beatnow.app
```
