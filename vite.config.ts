import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api-proxy': {
        target: 'http://10.0.65.40:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-proxy/, ''),
      },
      '/incident-api': {
        target: 'http://localhost:3090',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/incident-api/, ''),
      },
    },
  },
})
