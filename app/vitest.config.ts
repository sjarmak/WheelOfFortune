import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    // Exclude Playwright e2e specs — those use a different test runner
    // and try to import '@playwright/test', which has incompatible globals.
    exclude: ['**/node_modules/**', '**/dist/**', 'tests/e2e/**'],
  },
});
