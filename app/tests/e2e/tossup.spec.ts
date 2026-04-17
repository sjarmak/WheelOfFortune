import { test, expect } from '@playwright/test';

/**
 * End-to-end test for the Toss-Up mode UI.
 *
 * Drives the reveal -> buzz -> solve flow against a running Vite dev
 * server using real UI interactions.
 *
 * Test hook: the app exposes `?tossup=1` which forces the next round to
 * pick a TOSSUP puzzle (searches ALL_PACKS if the active pack has none).
 * This avoids having to navigate a home -> pack-select flow that does
 * not exist in App.tsx yet.
 */

// Clear localStorage before every test so we start from a known, fresh
// state. The app persists GameState via `wof_state` and the mode via
// `wof_game_mode`.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      window.localStorage.clear();
    } catch {
      /* ignore */
    }
  });
});

test.describe('Toss-Up mode @tossup', () => {
  test('renders the TossUpScreen in TOSSUP_REVEALING on load with ?tossup=1', async ({ page }) => {
    await page.goto('/?tossup=1');

    const screen = page.getByTestId('tossup-screen');
    await expect(screen).toBeVisible({ timeout: 15_000 });
    await expect(screen).toHaveAttribute('data-turn-state', /TOSSUP_REVEALING|TOSSUP_BUZZED/);
    await expect(page.getByTestId('tossup-board')).toBeVisible();
    await expect(page.getByTestId('tossup-buzz-button')).toBeVisible();
  });

  test('reveals tiles progressively during the reveal phase', async ({ page }) => {
    await page.goto('/?tossup=1');

    const screen = page.getByTestId('tossup-screen');
    await expect(screen).toBeVisible({ timeout: 15_000 });

    // Count revealed letter tiles at t0
    const revealedAtStart = await page
      .locator('[data-tile-kind="letter"][data-revealed="true"]')
      .count();

    // Wait for at least 1 new reveal (tick interval is 1s). Use waitForFunction
    // instead of a bare timeout so the test is robust.
    await page.waitForFunction(
      (startCount) =>
        document.querySelectorAll('[data-tile-kind="letter"][data-revealed="true"]')
          .length > startCount,
      revealedAtStart,
      { timeout: 10_000 }
    );

    const revealedAfter = await page
      .locator('[data-tile-kind="letter"][data-revealed="true"]')
      .count();
    expect(revealedAfter).toBeGreaterThan(revealedAtStart);
  });

  test('buzz -> cancel returns to reveal phase', async ({ page }) => {
    await page.goto('/?tossup=1');
    await expect(page.getByTestId('tossup-screen')).toBeVisible({ timeout: 15_000 });

    await page.getByTestId('tossup-buzz-button').click();
    await expect(page.getByTestId('tossup-solve-input')).toBeVisible();
    await expect(page.getByTestId('tossup-screen')).toHaveAttribute('data-turn-state', 'TOSSUP_BUZZED');

    await page.getByTestId('tossup-cancel-button').click();
    await expect(page.getByTestId('tossup-buzz-button')).toBeVisible();
    await expect(page.getByTestId('tossup-screen')).toHaveAttribute('data-turn-state', 'TOSSUP_REVEALING');
  });

  test('buzz -> incorrect solve -> TOSSUP_LOCKED_OUT', async ({ page }) => {
    await page.goto('/?tossup=1');
    await expect(page.getByTestId('tossup-screen')).toBeVisible({ timeout: 15_000 });

    await page.getByTestId('tossup-buzz-button').click();
    const input = page.getByTestId('tossup-solve-input');
    await expect(input).toBeVisible();
    await input.fill('DEFINITELY NOT THE ANSWER');
    await page.getByTestId('tossup-submit-button').click();

    await expect(page.getByTestId('tossup-locked-out')).toBeVisible();
    await expect(page.getByTestId('tossup-screen')).toHaveAttribute('data-turn-state', 'TOSSUP_LOCKED_OUT');
  });
});
