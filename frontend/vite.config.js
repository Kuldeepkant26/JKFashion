import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Listen on all interfaces so the site can be opened from a phone on the
    // same Wi-Fi; Vite prints the Network URL on startup.
    host: true,
    proxy: {
      // Proxying keeps the API same-origin in development, so the refresh
      // cookie is first-party and CORS never enters the picture.
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
    },
  },
})
