import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config scoped to the app/ package.
 *
 * WebKit is the primary target because Safari (mobile / iPadOS) is where the
 * original CSS-transition spin implementation hung due to compositor drops of
 * `transitionend`. The Web Animations API path in StandardWheel is specifically
 * designed to avoid that; this harness proves 10 consecutive spins work.
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [['list']],
  use: {
    trace: 'retain-on-failure',
    viewport: { width: 1024, height: 768 },
    baseURL: 'http://localhost:5178',
  },
  projects: [
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npx vite --port 5178 --strictPort',
    port: 5178,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
