import 'dotenv/config'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globalSetup: ['test/globalSetup.ts'],
    env: {
      DATABASE_URL: process.env.DATABASE_URL_TEST ?? '',
      JWT_SECRET: process.env.JWT_SECRET ?? 'test-secret',
    },
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/generated/**', 'src/index.ts'],
      thresholds: { lines: 70, 'src/services/**': { lines: 80 } },
    },
  },
})
