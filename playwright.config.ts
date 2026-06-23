import { defineConfig, devices } from '@playwright/test'
import { config } from 'dotenv'

// O processo do test runner não herda .env.local automaticamente como o `next dev`
// faz — checkout.spec.ts depende de STRIPE_SECRET_KEY estar visível aqui também.
config({ path: '.env.local' })

export default defineConfig({
  testDir: './e2e',
  // player.spec.ts e certificate.spec.ts compartilham o mesmo usuário/curso seedado —
  // mantém execução serial para evitar corrida em LessonProgress entre specs.
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npx next dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
