import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(process.cwd(), 'src') },
  },
  server: {
    port: 5173,
    open: true,
    // Optional convenience: lets you call the API as `/api/...` in dev.
    proxy: {
      '/api': { target: 'http://localhost:8000', changeOrigin: true },
    },
  },
})
