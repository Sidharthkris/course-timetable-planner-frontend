import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// The backend (Course Timetable Planner API) runs on localhost:8080 by
// default. Proxying /api requests through Vite's dev server means the
// browser sees everything as same-origin — no CORS configuration needed
// on the Spring Boot side for local development.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET ?? 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test-setup.ts',
  },
})
