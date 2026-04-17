import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for the Wheel Practice web app.
 *
 * Only the `webkit` project is configured because the existing
 * acceptance criteria explicitly target `--project=webkit`. The
 * `webServer` entry starts Vite's dev server before running tests
 * and reuses an already-running server when available.
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  timeout: 30_000,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npx vite --port 3000',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
