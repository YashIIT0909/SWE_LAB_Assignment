import 'dotenv/config'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    env: {
      DATABASE_URL: process.env.DATABASE_URL_TEST ?? '',
      JWT_SECRET: process.env.JWT_SECRET ?? 'test-secret',
    },
    fileParallelism: false,
  },
})
