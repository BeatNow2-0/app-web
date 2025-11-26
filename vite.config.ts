import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: true
  },
  server: {
    proxy: {
      '/v1': {
        target: 'https://51.91.109.185:8001',
        changeOrigin: true,
        secure: false
      },
      // Proxy para el endpoint /token (si tu backend expone /token a la raíz)
      '/token': {
        target: 'https://51.91.109.185:8001',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
