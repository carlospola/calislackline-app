// @ts-check
const { defineConfig, devices } = require('@playwright/test');

// Harness E2E ISOLATO per il funnel trial.
// Il dev server (vercel dev su http://localhost:3000) si avvia A MANO con dev.ps1
// dalla root del repo: qui NON c'e' webServer. NESSUN globalSetup (ancora).
module.exports = defineConfig({
  testDir: './specs',
  retries: 0,
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
