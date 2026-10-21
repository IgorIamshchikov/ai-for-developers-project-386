import { defineConfig, devices } from '@playwright/test'

// Сквозной тест в настоящем браузере против уже поднятого docker-compose
// стека (frontend + web + db): `docker compose up -d`, затем
// `docker compose run --rm e2e npx playwright test` — оба сервиса видны
// внутри compose-сети по именам, поэтому базовый URL — http://frontend:5173.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
