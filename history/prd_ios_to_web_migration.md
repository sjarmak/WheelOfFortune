# PRD: Port iOS Standard Mode Improvements to Web App

## Problem Statement

The iOS app at `ios/` is 27 commits ahead of the web app at `app/` with significant gameplay improvements — Toss-Up round, Bonus Round, a modernized dark theme, a new Standard wheel with radial SVG text, home mode selector cards, a PackBrowser, a `mustSpin` rule, simplified wedge types (`VALUE|BANKRUPT|LOSE_TURN`), and supporting timer/roundResult state. The web app has diverged and also carries kid-mode extras (PhonicsHelper, HearWords, MusicRoom, PictureClue, WordBuilder, TreasureBox, AchievementModal, BarChart, WheelLegend) that must be preserved.

Critically, research surfaced a **pre-existing latent bug**: web's pack (`seasons_40_42_all.json`) is 60% TOSSUP/BONUS puzzles (3463 of 5724), but `App.tsx:189-190` draws uniformly at random and the reducer has only half-baked TOSSUP/BONUS branches with no corresponding UI. Users hitting a TOSSUP puzzle see letters auto-reveal and then sit in IDLE with no win condition.

Research (3 independent lenses: prior art, first-principles, risk) converged strongly on a shared-engine + separate-UIs approach, explicit rejection of `react-native-web`, and an engine-first migration order. The iOS engine is already 99% platform-free (1 of 16 engine files imports a platform module — `tts.ts`), and the web's existing `Wheel.tsx` already uses native SVG `<textPath>`, so the port is less heroic than the raw line count suggests.

## Goals & Non-Goals

### Goals
- Port iOS Standard Mode improvements (Toss-Up, Bonus Round, dark theme, new wheel, mode selector, pack browser, `mustSpin`, simplified wedges) to the web app
- Extract a single shared engine to eliminate drift going forward
- Fix the latent round_type bug in the web immediately (one-line change before the port)
- Preserve all web-only kid-mode UI (PhonicsHelper, HearWords, MusicRoom, PictureClue, WordBuilder, TreasureBox, AchievementModal, BarChart, WheelLegend) untouched
- Keep the `kidGame.ts` web-specific `KID_HYDRATE_STATE` action (localStorage rehydration) working on both platforms
- Produce a test suite that catches regressions across both platforms

### Non-Goals
- Use `react-native-web` or attempt shared UI components (explicitly rejected)
- Migrate to a full monorepo with Turborepo on day one (relative-path shared folder is sufficient)
- Add haptics to the web (no reliable cross-browser API worth abstracting)
- Unify `package.json` / React versions (iOS React 19, web React 18 — intentional drift)
- Write a Solito / Expo-Router-web migration
- Replace `App.tsx` wholesale — it stays and delegates to new components

## Requirements

### Must-Have

- **R1: Shared engine at `/shared/engine/`** (or `/packages/engine/`)
  - Acceptance: `ls shared/engine/` contains `types.ts game.ts rng.ts kidGame.ts kidTypes.ts phonics.ts letterSuggestions.ts shopTypes.ts strategyAnalytics.ts wheelSpin.ts vannaAnimation.ts packs.ts defaultPack.ts pictureClues.ts`. Both `ios/src/engine/` and `app/src/engine/` are either emptied (re-exports only) or deleted in favor of imports from the shared path. `grep -r "from.*shared/engine" ios/src app/src` shows imports resolving. `tsc --noEmit` passes in both `ios/` and `app/`.

- **R2: Platform-specific `tts.ts` stays in each app**
  - Acceptance: `app/src/engine/tts.ts` uses Web Speech API; `ios/src/engine/tts.ts` uses `expo-speech`. Both export identical function signatures: `isTTSAvailable()`, `initializeTTS()`, `speak()`. Kid-mode components (`PhonicsHelper`, `HearWords`) render without errors after migration.

- **R3: Fix latent round_type bug in web first (immediate)**
  - Acceptance: `app/src/App.tsx` calls `getPuzzlesForMode(puzzles, 'MAIN')` before `nextRound()` selection. Manual verification: open http://localhost:3000/, play 10 rounds, confirm no TOSSUP/BONUS puzzles appear in Main Game. Unit test in `app/src/engine/__tests__/packs.test.ts` asserts filter returns only MAIN puzzles for `'MAIN'` mode.

- **R4: Resolve FREE_PLAY / wedge-type reconciliation**
  - Acceptance: A single canonical wedge type definition lives in `shared/engine/types.ts`. Either (a) FREE_PLAY is dropped from web (matches iOS commit `194793d`) and all 12 web references are updated, **OR** (b) FREE_PLAY is restored on iOS. **Decision needs user confirmation before implementation** — this is a game-design choice, not a technical one. `grep -r "FREE_PLAY\|freePlay" app/src ios/src` returns 0 ambiguous references after resolution.

- **R5: Engine reducer parity**
  - Acceptance: `app/src/engine/game.ts` supports all 11 iOS actions (`TOSS_UP_TICK {dtMs}`, `BUZZ_IN`, `TOSS_UP_SOLVE_ATTEMPT`, `CANCEL_TOSS_UP_ATTEMPT`, `BONUS_CHOOSE_LETTERS`, `BONUS_TICK`, `BONUS_SOLVE_ATTEMPT`, `RESET_ROUND`, `RANDOM_PUZZLE`, `SELECT_PUZZLE`) plus `mustSpin` semantics on existing actions. All 7 new `turnState` values (`TOSSUP_REVEALING`, `TOSSUP_BUZZED`, `TOSSUP_LOCKED_OUT`, `BONUS_PICKING`, `BONUS_SOLVE_TIMER`, etc.) are in the union.

- **R6: Port iOS test suite to web vitest**
  - Acceptance: Files `bonusEngine.test.ts`, `tossUpEngine.test.ts`, `tossUpCancel.test.ts`, `wheelSpin.test.ts`, `puzzleModes.test.ts` exist under `app/src/engine/__tests__/` (or `shared/engine/__tests__/` with both apps running them). Running `cd app && npm test` produces ≥17 passing tests. Running `cd ios && npm test` produces ≥17 passing tests against the same shared engine.

- **R7: Web StandardWheel component**
  - Acceptance: `app/src/components/StandardWheel.tsx` exists, renders 24 wedges with radial SVG `<textPath>`, uses CSS `transform: rotate(Xdeg)` + `transition: transform 4s cubic-bezier(...)` for spin. Guards against rapid re-clicks with an `isAnimating` state. Manual check on http://localhost:3000/: spin the wheel 10 times, verify smooth animation and correct wedge-stop detection. No haptics (web has no reliable API). No framer-motion required.

- **R8: Web Toss-Up UI**
  - Acceptance: When `gameState.turnState === 'TOSSUP_REVEALING'`, the web app shows the auto-revealing puzzle board with a buzz-in button. Buzzing dispatches `BUZZ_IN`, transitions to `TOSSUP_BUZZED`, prompts for solve. Incorrect solve triggers `TOSSUP_LOCKED_OUT` for the configured lockout duration. Correct solve ends the round with `roundResult: 'win'`. Acceptance test: `app/src/__tests__/tossup-integration.test.tsx` drives the full flow in Testing Library.

- **R9: Web Bonus Round UI**
  - Acceptance: When `gameState.turnState === 'BONUS_PICKING'`, the web app reveals RSTLNE pre-filled and prompts for 3 consonants + 1 vowel. Transitions to `BONUS_SOLVE_TIMER` with a visible countdown timer. Timer expiry or correct solve ends the round. Acceptance test: `app/src/__tests__/bonus-integration.test.tsx` drives the full flow.

- **R10: Dark theme / visual parity**
  - Acceptance: Web app homepage and gameplay screens render with a dark purple/navy gradient matching iOS (see `ios/src/styles/theme.ts`). Tailwind theme tokens in `app/tailwind.config.js` include the iOS color palette. Visual spot-check on http://localhost:3000/ matches iOS screenshots for home screen, wheel, and puzzle board.

- **R11: Preserve kid-mode extras**
  - Acceptance: After all migration commits, `app/src/components/{PhonicsHelper,HearWords,MusicRoom,PictureClue,WordBuilder,TreasureBox,AchievementModal,BarChart,WheelLegend,KidModeApp,KidModeHUD,KidWheel,KidOutcomeCard,ModeSelector,PackSelector,StarCollection}.tsx` are functionally unchanged. Kid mode tests (`app/src/engine/kidGame.test.ts`, 611 lines) still pass. Manual verification: select Kid Mode on home screen, verify phonics helper, hear words, music room, picture clue, and word builder all work.

### Should-Have

- **R12: Home mode selector with cards**
  - Acceptance: Web home screen shows three cards (Main Game, Toss-Up, Bonus Round) matching iOS layout. Selecting each routes to the correct flow.

- **R13: PackBrowser screen**
  - Acceptance: After mode selection, user sees a pack browser with available puzzle packs. Selecting a pack starts the round.

- **R14: `mustSpin` rule**
  - Acceptance: After a wrong guess, bankrupt, or lose-turn, vowel-buying is disabled until the player spins again. Test case in `wheelSpin.test.ts` or `game.test.ts` asserts `mustSpin` toggles correctly.

- **R15: Merge `KID_HYDRATE_STATE` back to iOS**
  - Acceptance: iOS `shared/engine/kidGame.ts` includes the `KID_HYDRATE_STATE` action. iOS uses AsyncStorage; the action handler is platform-agnostic. Prevents iOS kid-mode regression when pulling shared engine.

- **R16: Translation table documented**
  - Acceptance: `docs/web-port-translation.md` (or similar) lists RN→DOM mappings: `View→div`, `Text→span`, `Pressable→button`, `react-native-svg→svg`, `Reanimated withTiming→CSS transition`, `expo-haptics→drop`, `expo-linear-gradient→Tailwind bg-gradient`, `AsyncStorage→localStorage`, `Gesture.Pan→touch handlers`, `lucide-react-native→lucide-react`. Applied consistently across all ported components.

### Nice-to-Have

- **R17: pnpm workspaces + Turborepo**
  - Acceptance: If relative-path imports become painful (e.g., editor IntelliSense issues, Metro caching bugs), migrate to pnpm workspaces with `apps/ios/`, `apps/web/`, `packages/engine/`. Not required day-one.

- **R18: Unified puzzle data source**
  - Acceptance: If duplicate puzzle JSONs exist across `data/`, `ios/src/assets/`, and `app/src/assets/`, collapse to one canonical location with symlinks or build-time copies.

- **R19: Merge web branch to main + push**
  - Acceptance: `ralph/tossup-bonus-modes` merged to local `main`. `main` pushed to `origin/main`. GitHub repo reflects current state.

## Design Considerations

### Key tensions (from divergence points)

**1. FREE_PLAY removal vs restoration**
- iOS intentionally removed it (commit `194793d feat: remove FREE_PLAY`).
- Web has ~12 references (`App.tsx`, `strategyAnalytics.ts`, `StrategyDashboard.tsx`, etc.).
- **Resolution path**: user chooses. If dropping: ~1-2 hours to update web refs. If restoring: ~30 min to re-add wedge id 12 on iOS and update tests.

**2. Monorepo now or later**
- Agent 1 favored pnpm+Turborepo.
- Agents 2 & 3 favored plain relative imports.
- **Resolution**: start with `/shared/engine/` + relative imports (faster, no tooling churn). Upgrade only if import paths become painful.

**3. Animation approach for wheel**
- Agent 1 recommended framer-motion (already in web package.json).
- Agent 2 recommended plain CSS transitions (simpler, no dep).
- **Resolution**: use CSS transitions for the wheel (single `transform: rotate()`). Reserve framer-motion for cases that actually need orchestrated animations (none identified).

### Tradeoffs

- **Shared engine via relative paths** (chosen) saves tooling overhead but means each app still has its own `node_modules/`. Acceptable given identical runtime versions for core deps.
- **Direct RN→DOM substitution** (chosen) means two UI codebases to maintain. Offset by the fact that the 10 kid-mode components already diverged and accepting that divergence is cheaper than fixing it.
- **CSS transitions over framer-motion** (chosen) for the wheel. Simpler, but loses the `onAnimationComplete` callback guarantee — mitigated by the existing `setTimeout` pattern in `Wheel.tsx` plus an `isAnimating` state guard.

## Converged Migration Plan (from Phase 2 structured debate)

After three debaters (Pragmatist, Architect, Risk-Mitigator) exchanged arguments across two rounds, these points reached consensus:

### Resolved (unanimous)
1. **R3 round_type filter fix ships FIRST as standalone commit.** One-line change, 15 min, no dependencies. Stops users from hitting broken TOSSUP/BONUS puzzles immediately.
2. **Characterization tests precede any engine change.** Snapshot current web reducer behavior before modifying — catches kid-mode regressions automatically.
3. **`/shared/engine/` extraction is DEFERRED until after UI ports land.** Extract against a proven/stable reducer API, not a speculative one. Avoids double-refactor.
4. **FREE_PLAY: restore to iOS.** All three debaters converged here. Adding wedge id 12 + reducer branch on iOS (~30 min) is cheaper than stripping 12 web references AND it preserves `strategyAnalytics.ts` modeling. Resolves R4 without user gating.
5. **In-place reducer port over vendoring.** Port iOS reducer deltas into web `game.ts` piecemeal, one delta per commit, characterization tests green between each. Preserves rollback granularity.
6. **Vertical slices for UI.** Toss-Up = one PR. Bonus Round = one PR. Each independently revertable.

### Commit sequence (converged)
1. **Commit 1** (15 min): R3 — `getPuzzlesForMode(puzzles, 'MAIN')` in `app/src/App.tsx`
2. **Commit 2** (1 hr): Characterization test suite on current web reducer (`app/src/engine/__tests__/characterization.test.ts`)
3. **Commit 3** (30 min): Restore FREE_PLAY to iOS — wedge id 12 + reducer branch + test
4. **Commit 4** (2 hr): Port iOS reducer + types to web in-place (vendored wholesale OR piecemeal — small tension remaining, see below). Characterization tests gate it.
5. **Commit 5** (1–2 days): Toss-Up vertical slice — engine deltas (`TOSS_UP_TICK {dtMs}`, `BUZZ_IN`, `TOSS_UP_SOLVE_ATTEMPT`, `CANCEL_TOSS_UP_ATTEMPT`) + UI + integration test (R8)
6. **Commit 6** (1–2 days): Bonus Round vertical slice — engine deltas (`BONUS_CHOOSE_LETTERS`, `BONUS_TICK`, `BONUS_SOLVE_ATTEMPT`) + UI + integration test (R9)
7. **Commit 7** (1 day): StandardWheel component — CSS transitions (R7)
8. **Commit 8** (0.5 day): Dark theme + home mode selector cards (R10, R12)
9. **Commit 9** (deferred, conditional): Extract `/shared/engine/` once UI ports prove reducer API is stable. Optional CI drift tripwire compares `ios/src/engine/` vs `app/src/engine/` hashes as interim guardrail.

### Minor tension still open (low blast radius)
- **Reducer port granularity in Commit 4**: Pragmatist prefers wholesale vendor; Risk-Mitigator prefers per-action commits. Both are acceptable given characterization-test gating. **Resolution: piecemeal per-action commits** — small downside on speed, bigger upside on rollback precision.

## Remaining Open Questions (unresolved, post-debate)

1. **Is the web app deploy target desktop, mobile Safari, or both?** Affects TTS initialization retries and whether `navigator.vibrate` is worth adding. Not a blocker — sensible defaults work.
2. **Is there an ongoing cadence of iOS-side development?** If iOS stops, the deferred `/shared/engine/` extraction (Commit 9) may never be needed. Not a blocker — decision can wait.
3. **Are there triple copies of the puzzle JSON?** `/data/packs/`, `/ios/src/assets/`, `/app/src/assets/`. Worth inspecting in Commit 1 window; not a blocker.
4. **Does `vannaAnimation.ts` use Reanimated?** Quick grep settles this. Moves to shared engine only if pure. Not a blocker — web has its own animation story.

## Research Provenance

### Divergence (Phase 1)
- **Lens 1 (Prior Art)**: Solito 5 dropped react-native-web in 2025 → strong signal against UI sharing. pnpm+Turborepo is overkill here. react-native-web friction with Reanimated/Tailwind/expo-haptics is well-documented.
- **Lens 2 (First Principles)**: iOS engine is 1-of-16 files platform-coupled. Wheel is 95% portable. Wedge type simplification is the only breaking change.
- **Lens 3 (Risk)**: Surfaced critical latent bug (web serves TOSSUP/BONUS puzzles with no UI). Kid-mode coupling is near-zero. FREE_PLAY removal breaks 12 web files if adopted naively.

### Convergence (Phase 2 debate)
- **Pragmatist's strongest contribution**: Small-commit discipline and speed bias — insisted that web has zero prod users, so "ship working" beats "ship perfect architecture"
- **Architect's strongest contribution**: "We are literally running this migration because drift happened once — not extracting eventually guarantees a third migration" + FREE_PLAY restoration economics (30 min vs 2 hr)
- **Risk-Mitigator's strongest contribution**: Characterization tests as a mandatory gate + vertical-slice rollback granularity + the observation that bundling R3+engine+FREE_PLAY into one commit is exactly the anti-pattern that causes painful reverts

### Key decisive arguments
- **FREE_PLAY restore (vs delete)**: Architect's cost math won — 30 min on iOS side < 2 hr on web side + preserves analytics modeling
- **Deferred extraction (vs now)**: Pragmatist and Risk-Mitigator convinced Architect that extracting before UI ports means refactoring shared boundary twice
- **R3 first (standalone)**: Unanimous — no debate

---

## Risk Annotations (Phase 3 Premortem)

Full risk report: `/Users/sjarmak/WheelOfFortune/history/premortem_ios_to_web_migration.md`

### Top 3 risks (Risk Score = Severity × Likelihood)

1. **[Critical×High=12] Operational — localStorage schema break crashes returning users.** Commit 4 changes `GameState` shape. Any user who played the archived web app has stale `localStorage` that will crash on hydrate. No `ErrorBoundary` → white screen → no error tracking → developer learns days later.
   - **Mitigation**: Insert **commit 3.5** with Zod schema + `migrateState()` + legacy fixture test. Add `ErrorBoundary` in commit 1.5. Delete `app/dist/` from git.

2. **[Critical×High=12] Technical — CSS `transitionend` unreliable on Safari → wheel hangs.** Reanimated worklets guarantee completion on UI thread; CSS `transitionend` is dropped by Safari under compositor pressure, backgrounded tabs, or rapid re-clicks. The "RN→DOM substitution" principle missed that animation completion semantics are fundamentally different.
   - **Mitigation**: Rewrite commit 7 — use Web Animations API `element.animate(...).finished` Promise (not CSS `transitionend`). Compute `<text>` positions manually (not `textPath startOffset` — Safari renders differently). Dispatch-once guard by `spinId`.

3. **[Critical×High=12] Team/Process — premature bead closure + rewritten tests.** Solo + AI-assisted sessions lose context. Session 1 closes bead with "validated manually" after testing wrong stack. Session 2 builds on broken foundation. Session 3 rewrites failing tests. By month 2, two competing PRDs exist and nobody knows what's canonical.
   - **Mitigation**: Require `Validated by: tests/<file>::<test>` in every `bd close --reason`. Split vertical slices into reducer/ui/e2e sub-beads. Add `SNAPSHOT_LOCK.md` to characterization tests. Session-start checklist reads PRD + recent closed beads.

### Cross-cutting themes
- **"Safari wasn't tested"** (3 lenses) → Insert commit 6.5: Playwright WebKit CI gate before StandardWheel
- **"Persisted state + snapshots can lock in bugs"** (4 lenses) → Schema migration + SNAPSHOT_LOCK + forbid test rewrite without investigation
- **"Solo + AI loses state between turns"** (2 lenses) → session checklist + bd closure protocol
- **"Engine duplication drifts"** (3 lenses) → 10-line CI diff script comparing `ios/src/engine/game.ts` vs `app/src/engine/game.ts` hashes (cheap substitute for pulling commit 9 forward)

### Mod 1 — User answers (RESOLVED 2026-04-17)

1. **Full feature parity** — web should play exactly like iOS (Toss-Up, Bonus Round, dark theme, wheel, mode selector, pack browser all in scope)
2. **iPad + laptop, mostly iPad** — Safari is the **primary** target, not secondary. Every UI commit must pass on WebKit.
3. **No FREE_PLAY** — iOS's commit 194793d stays. **Drop FREE_PLAY from web** (~2 hr to strip 12 references), not restore to iOS.

### Implications for the converged plan

- **FREE_PLAY decision REVERSES Phase 2 Architect win**. Phase 3 answer 3 overrides it. Commit 3 is now "Remove FREE_PLAY from web" (~2 hr) instead of "Restore FREE_PLAY to iOS" (30 min).
- **iPad Safari as primary target promotes Mod 4 from P1 to P0**. Playwright WebKit gate should be set up BEFORE any UI work, not before commit 7.
- **Web Animations API for wheel is non-negotiable** (not "optional" — it's now load-bearing because Safari on iPad has more compositor-throttling than desktop Chrome).
- **Touch gestures on iPad** — wheel swipe-to-spin must work with `onTouchStart/Move/End` tuned for iPad's 120Hz ProMotion displays and Safari touch-action CSS quirks.
- **Kid-mode accessibility gate still applies** (Scope lens flagged this) — dark theme contrast must pass on iPad kid-user scenarios.

### Final commit sequence (resolved 2026-04-17, iPad-Safari-primary)

1. **R3 fix** — `getPuzzlesForMode(puzzles, 'MAIN')` in `app/src/App.tsx` (15 min)
1.5. **Safety infra** — `ErrorBoundary` + delete tracked `app/dist/` + `.gitignore` dist + disable Dependabot on app/ + stack banner on dev build (30 min)
1.75. **Playwright WebKit gate** — PROMOTED to before any UI work (3 hr). One smoke test: `vite dev` up, load homepage on WebKit, no console errors. Add to every subsequent commit's definition-of-done.
2. **Characterization tests** on current web reducer + `SNAPSHOT_LOCK.md` with reducer SHA + pinned `snapshotFormat` (1.5 hr)
3. **Drop FREE_PLAY from web** — remove `'FREE_PLAY'` + `'PRIZE'` from wedge union, delete wedge id 12, update `types.ts`, `game.ts`, `App.tsx`, `strategyAnalytics.ts`, `StrategyDashboard.tsx`, every consonant/vowel cost check. Update the 3 existing tests referencing `type: 'CASH'`. (~2 hr)
3.5. **Schema migration harness** — `SCHEMA_VERSION=2`, Zod schema for new `GameState`, `migrateState()` that returns `null` on legacy blob, hydration try/catch in `App.tsx` falling back to `INITIAL_STATE`, legacy localStorage fixture test (1–2 hr). **CRITICAL for returning users.**
4. **Port iOS reducer deltas to web in-place, piecemeal** (2 hr): add 11 new actions + 7 new turnStates + mustSpin semantics. One commit per action-group. Characterization tests green between each.
5. **Toss-Up slice** (2 days): 5a reducer actions, 5b `TossUpScreen.tsx` UI, 5c Playwright WebKit e2e test (full reveal→buzz→solve flow).
6. **Bonus Round slice** (2 days): 6a reducer actions, 6b `BonusRoundScreen.tsx` UI, 6c Playwright WebKit e2e test (RSTLNE→pick→timer→solve flow).
7a. **StandardWheel geometry** (0.5 day): SVG wedges, static. No animation yet.
7b. **Wheel spin + labels** (1 day): `element.animate(...).finished` Promise (Web Animations API — **not** CSS transitionend). Manual `<text x y rotate>` per glyph (**not** `<textPath startOffset>` — Safari bug). Dispatch-once guard by `spinId`. Touch events tuned for iPad.
8. **Dark theme + home mode selector + PackBrowser + accessibility contrast gate** (1 day): Tailwind theme tokens mirroring `ios/src/styles/theme.ts`. Contrast ratio check on kid-mode screens.
9. **Extract `/shared/engine/`** — deferred. Interim: 10-line bash CI script hashing `ios/src/engine/game.ts` and `app/src/engine/game.ts`, warning on divergence.

**Total**: ~8–10 working days. Every commit ends with "Playwright WebKit passes."
