import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { configDefaults, defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    // e2e/ — спеки Playwright (npm run test:e2e), Vitest их не запускает
    exclude: [...configDefaults.exclude, 'e2e/**'],
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    // e2e-сервис (Playwright) обращается по compose-имени "frontend" —
    // Vite 5+ по умолчанию блокирует незнакомый Host-заголовок.
    allowedHosts: ['frontend'],
    proxy: {
      '/api': {
        target: 'http://web:3000',
        // keep the original Host header: Rails dev host authorization
        // allows "localhost" but blocks the compose hostname "web"
        changeOrigin: false,
      },
    },
  },
})
