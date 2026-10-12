import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  testMatch: 'events.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 120_000,
  use: { baseURL: process.env.EVENTS_BASE_URL || 'http://127.0.0.1:3127', locale: 'pt-BR', trace: 'retain-on-failure' },
  projects: ['chromium', 'webkit', 'firefox'].map(browserName => ({ name: browserName, use: { browserName: browserName as 'chromium' | 'webkit' | 'firefox' } })),
  webServer: process.env.EVENTS_BASE_URL ? undefined : {
    command: 'npm run dev -- --port 3127', url: 'http://127.0.0.1:3127/login', reuseExistingServer: !process.env.CI, timeout: 120_000,
  },
})
