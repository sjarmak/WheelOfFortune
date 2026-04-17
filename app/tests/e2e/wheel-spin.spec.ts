import { test, expect } from '@playwright/test';

/**
 * e2e test: StandardWheel spin loop on WebKit (Safari engine).
 *
 * The old CSS-transition implementation would hang on Safari because the
 * compositor occasionally drops `transitionend`. StandardWheel replaces that
 * with the Web Animations API — `element.animate(...).finished` — which Safari
 * honors reliably. This test proves 10 consecutive spins all complete and
 * record a wedge result.
 *
 * The harness page renders ONLY <StandardWheel /> so the test is insulated
 * from parallel work on App.tsx.
 */
test.describe('StandardWheel spin — WebKit', () => {
  test('spins 10 times consecutively without hanging', async ({ page }) => {
    test.setTimeout(120_000);

    await page.goto('/tests/e2e/fixtures/wheel-harness.html');

    // Wait for the wheel to mount.
    await page.waitForSelector('[data-testid="standard-wheel"]');

    const TOTAL_SPINS = 10;

    for (let i = 0; i < TOTAL_SPINS; i++) {
      // Vary the seed between spins so each spin uses a fresh RNG draw.
      if (i > 0) {
        await page.evaluate(() => window.__wheel.bumpSeed());
      }

      // Wait until the wheel is not currently spinning (should be idle between
      // spins). This guards against race conditions.
      await page.waitForFunction(
        () =>
          document
            .querySelector('[data-testid="standard-wheel"]')
            ?.getAttribute('data-spinning') === 'false',
      );

      const before = await page.evaluate(() => window.__wheel.spinCount);

      // Click the wheel to start a spin.
      await page.locator('[data-testid="standard-wheel"]').click();

      // Wait for spinCount to increment (proves onSpinComplete fired).
      await page.waitForFunction(
        (expected) => window.__wheel.spinCount >= expected,
        before + 1,
        { timeout: 15_000 },
      );
    }

    // Assert all 10 spins recorded.
    const results = await page.evaluate(() => window.__wheel.spinResults);
    expect(results.length).toBe(TOTAL_SPINS);

    // Every result must be a valid wedge (index in [0, 24) + non-empty label).
    for (const r of results) {
      expect(r.index).toBeGreaterThanOrEqual(0);
      expect(r.index).toBeLessThan(24);
      expect(typeof r.label).toBe('string');
      expect(r.label.length).toBeGreaterThan(0);
    }

    // Wheel should be idle at the end (no stuck spin).
    const finalSpinning = await page
      .locator('[data-testid="standard-wheel"]')
      .getAttribute('data-spinning');
    expect(finalSpinning).toBe('false');
  });

  test('ignores rapid re-clicks while a spin is in flight', async ({ page }) => {
    test.setTimeout(60_000);

    await page.goto('/tests/e2e/fixtures/wheel-harness.html');
    await page.waitForSelector('[data-testid="standard-wheel"]');
    await page.evaluate(() => window.__wheel.reset());

    const wheel = page.locator('[data-testid="standard-wheel"]');

    // Fire 5 clicks in quick succession while a spin animates.
    await wheel.click();
    await wheel.click({ force: true });
    await wheel.click({ force: true });
    await wheel.click({ force: true });
    await wheel.click({ force: true });

    // Wait for the in-flight spin to complete.
    await page.waitForFunction(() => window.__wheel.spinCount >= 1, undefined, {
      timeout: 15_000,
    });

    // Give the page a moment — extra callbacks (if any) would fire here.
    await page.waitForTimeout(500);

    const count = await page.evaluate(() => window.__wheel.spinCount);
    expect(count).toBe(1);
  });
});
