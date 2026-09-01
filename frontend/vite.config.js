import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Backend origin the dev server proxies to. Override with API_TARGET when
// running against a backend on a non-default port.
const apiTarget = process.env.API_TARGET || 'http://localhost:8081'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
      },
      '/uploads': {
        target: apiTarget,
        changeOrigin: true,
      },
    },
  },
})
