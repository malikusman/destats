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
        // Live platform gateway on TDK (VPN). Local mock-api: http://localhost:3090
        target: process.env.INCIDENT_API_TARGET || 'http://10.0.65.19:8088/incident-api',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/incident-api/, ''),
      },
      '/control-plane-api': {
        // TDK Control Plane (AI / Agent / Policy / Execution). Not .19:8000 (Attu).
        target: process.env.CONTROL_PLANE_API_TARGET || 'http://10.0.65.40:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/control-plane-api/, ''),
      },
    },
  },
})
