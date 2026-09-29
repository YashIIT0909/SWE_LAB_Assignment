import { defineConfig, devices } from '@playwright/test'

const PORT = process.env.PORT || 3001

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || `http://localhost:${PORT}`,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: process.env.PLAYWRIGHT_TEST_BASE_URL
    ? undefined
    : [
        {
          command: 'PORT=4000 npm run dev -w @sccs/api',
          url: 'http://localhost:4000/api/v1/health',
          reuseExistingServer: true,
          cwd: '../..',
          timeout: 45_000,
        },
        {
          command: `PORT=${PORT} npm run dev -w @sccs/web -- -p ${PORT}`,
          url: `http://localhost:${PORT}`,
          reuseExistingServer: true,
          cwd: '../..',
          timeout: 45_000,
        },
      ],
})
