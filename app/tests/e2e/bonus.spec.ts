import { test, expect } from '@playwright/test';

/**
 * Bonus Round WebKit e2e test.
 *
 * Drives the full flow end-to-end in iPad Safari (WebKit):
 *  1. Home -> click "Bonus Round" mode card.
 *  2. Pack browser -> pick a pack that contains BONUS puzzles.
 *  3. Bonus screen renders in BONUS_PICKING with RSTLNE pre-revealed.
 *  4. Pick 3 consonants + 1 vowel, submit -> transitions to BONUS_SOLVE_TIMER.
 *  5. Timer visibly counts down (driven by BONUS_TICK dispatch on interval).
 *  6. Type the real puzzle phrase (read from the screen's data-puzzle-phrase
 *     attribute) and submit -> ROUND_OVER with a win message.
 */

test.describe('Bonus Round flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start with a clean slate so any prior state doesn't force us into a
    // different round type or puzzle.
    await page.addInitScript(() => {
      try {
        window.localStorage.clear();
      } catch {
        /* ignore */
      }
    });
  });

  test('drives RSTLNE -> pick -> timer -> solve in WebKit', async ({ page }) => {
    await page.goto('/');

    // ── Home: click the Bonus Round card ──
    const bonusCard = page.getByTestId('mode-card-BONUS');
    await expect(bonusCard).toBeVisible();
    await bonusCard.click();

    // ── Pack browser: pick a pack that contains BONUS puzzles ──
    // The large seasons-1-20 pack reliably contains BONUS-tagged puzzles.
    const packBrowser = page.getByTestId('pack-browser-screen');
    await expect(packBrowser).toBeVisible();

    const seasonsPackCard = page.getByTestId('pack-card-seasons-1-20-all');
    await expect(seasonsPackCard).toBeVisible();
    await seasonsPackCard.click();

    // ── Bonus screen visible in BONUS_PICKING ──
    const bonusScreen = page.getByTestId('bonus-round-screen');
    await expect(bonusScreen).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('bonus-turn-state')).toHaveText(
      'BONUS_PICKING',
    );
    await expect(page.getByTestId('bonus-picker-panel')).toBeVisible();

    // Extract the puzzle phrase from the test-only data attribute so we can
    // later submit a correct solve regardless of which BONUS puzzle was drawn.
    const phrase = await bonusScreen.getAttribute('data-puzzle-phrase');
    expect(phrase).toBeTruthy();

    // ── Pick 3 consonants + 1 vowel (any valid pick will advance state) ──
    // Using consonants B, C, D and vowel A. None of these are in RSTLNE,
    // so the reducer will accept them.
    await page.getByTestId('bonus-consonant-B').click();
    await page.getByTestId('bonus-consonant-C').click();
    await page.getByTestId('bonus-consonant-D').click();
    await expect(
      page.getByTestId('bonus-consonants-selected-count'),
    ).toHaveText('(3/3)');

    await page.getByTestId('bonus-vowel-A').click();
    await expect(page.getByTestId('bonus-vowel-selected-count')).toHaveText(
      '(1/1)',
    );

    // Submit picks
    await page.getByTestId('bonus-submit-picks').click();

    // ── Now on BONUS_SOLVE_TIMER with visible countdown ──
    await expect(page.getByTestId('bonus-turn-state')).toHaveText(
      'BONUS_SOLVE_TIMER',
    );
    const timer = page.getByTestId('bonus-timer');
    await expect(timer).toBeVisible();

    const initialTimerMs = Number(
      await timer.getAttribute('data-timer-ms'),
    );
    expect(initialTimerMs).toBeGreaterThan(0);

    // ── Wait briefly so the BONUS_TICK interval fires and decrements ──
    await page.waitForTimeout(600);

    const tickedTimerMs = Number(await timer.getAttribute('data-timer-ms'));
    expect(tickedTimerMs).toBeLessThan(initialTimerMs);

    // ── Submit the correct solve ──
    const solveInput = page.getByTestId('bonus-solve-input');
    await solveInput.fill(phrase ?? '');
    await page.getByTestId('bonus-solve-submit').click();

    // ── Transitions to ROUND_OVER with a win heading ──
    await expect(page.getByTestId('bonus-result-panel')).toBeVisible();
    await expect(page.getByTestId('bonus-result-heading')).toHaveText(
      'YOU WIN!',
    );
  });
});
