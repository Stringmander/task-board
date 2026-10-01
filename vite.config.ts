import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Must match task-api's CORS_ORIGIN default (http://localhost:5173).
    port: 5173,
    strictPort: true,
  },
})
