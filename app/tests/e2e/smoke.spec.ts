import { test, expect, type ConsoleMessage } from '@playwright/test'

/**
 * Smoke test: load the homepage in WebKit (iPad Safari proxy) and assert
 * that no console errors are emitted during initial render.
 *
 * This gate exists because iPad Safari is the primary platform per the PRD;
 * if WebKit can't render the app without console errors, downstream units
 * that assume a working web target are invalid.
 */
test('homepage renders in WebKit without console errors', async ({ page }) => {
  const consoleErrors: string[] = []

  page.on('console', (message: ConsoleMessage) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text())
    }
  })

  page.on('pageerror', (error: Error) => {
    consoleErrors.push(`pageerror: ${error.message}`)
  })

  await page.goto('/')

  // Root container from index.html — waits for React to mount into #root
  const root = page.locator('#root')
  await expect(root).toBeAttached()
  await expect(root).not.toBeEmpty()

  // Small settle window so any async render errors surface before we assert.
  await page.waitForLoadState('networkidle')

  expect(
    consoleErrors,
    `Expected no console errors but got:\n${consoleErrors.join('\n')}`
  ).toEqual([])
})
