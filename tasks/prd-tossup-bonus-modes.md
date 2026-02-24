# PRD: Toss-Up and Bonus Round Game Modes

## Introduction

Add two new playable game modes -- Toss-Up and Bonus Round -- to the Wheel of Fortune practice app. Both modes exist as partial stubs in the engine (RoundType enum, some state fields, basic RSTLNE reveal logic) but have no UI, no complete game flow, and no way to start them from the iOS app. This PRD covers finishing the engine rules, building the UI screens, enriching puzzle metadata for mode compatibility, and validating everything on iOS.

### Current State (Audit Summary)

**What exists:**
- `RoundType = 'MAIN' | 'TOSSUP' | 'BONUS'` enum in `ios/src/engine/types.ts`
- `GameState` has fields: `tossUpRevealOrder`, `tossUpIndex`, `bonusTimer`, `bonusPicks`
- `START_ROUND` handles BONUS (reveals RSTLNE positions) and TOSSUP (shuffles letter positions for reveal order)
- `TOSS_UP_TICK` action reveals one letter per dispatch
- SeededRNG (Mulberry32) for deterministic reveal order

**What's missing:**
- No buzz-in, lockout, or timed-reveal logic in the reducer
- No bonus letter-picking actions, timer countdown, or solve-under-timer gating
- No UI screens for either mode; `StandardModeApp` only runs standard spin/guess
- All 18,000+ puzzles are tagged `round_type: "MAIN"` -- none tagged for TOSSUP or BONUS
- No mode selector on the home screen
- No `allowed_modes` metadata on puzzles

**Decisions:**
- Any puzzle can be played in any mode. Add `allowed_modes: RoundType[]` metadata to puzzles, defaulting to `['MAIN', 'TOSSUP', 'BONUS']` for most categories. Certain categories (e.g., "Before & After", "Same Name") are excluded from Bonus Round per show conventions because they tend to be very long phrases.
- Engine rules will be extended in the existing reducer (not a separate pluggable abstraction yet) to keep changes minimal. A `RoundRules` interface can be extracted later if a third mode is added.
- Scoring is pass/fail only (practice app focus). No money accumulation for Toss-Up or Bonus.

## Goals

- Players can start Toss-Up or Bonus Round from the iOS home screen alongside Standard mode
- Toss-Up mode works end-to-end: auto-reveal at ~1 letter/second, buzz-in, lockout on wrong solve, pass/fail outcome
- Bonus Round works end-to-end: category shown, RSTLNE revealed, pick 3 consonants + 1 vowel, 20-second timed solve, pass/fail outcome
- Puzzle packs remain backward-compatible; mode eligibility derived from category metadata
- All engine logic is deterministic and testable without UI
- Existing Standard mode is unaffected

## User Stories

### US-001: Enrich puzzle metadata with mode eligibility
**Description:** As a developer, I need puzzles tagged with which modes they can be played in, so the app can filter puzzles appropriately per mode.

**Acceptance Criteria:**
- [ ] Add `allowed_modes` field to `Puzzle` interface: `RoundType[]` (optional, defaults to `['MAIN', 'TOSSUP', 'BONUS']`)
- [ ] Define category-to-mode mapping: all categories eligible for MAIN and TOSSUP; exclude long-phrase categories from BONUS ("Before & After", "Same Name", "Rhyme Time", "Song Lyrics", "Title/Author")
- [ ] `mapPuzzles()` in `packs.ts` populates `allowed_modes` based on category at load time (no pack file changes needed)
- [ ] Puzzle filtering helper: `getPuzzlesForMode(puzzles: Puzzle[], mode: RoundType): Puzzle[]`
- [ ] Typecheck passes
- [ ] Unit tests verify category-to-mode mapping for representative categories

### US-002: Home screen mode selector
**Description:** As a player, I want to choose between Standard, Toss-Up, and Bonus Round from the home screen so I can practice different game formats.

**Acceptance Criteria:**
- [ ] Home screen shows 3 activity cards: "Standard Game", "Toss-Up", "Bonus Round"
- [ ] Each card has a brief description of the mode's rules
- [ ] Tapping a card navigates to the game screen with the selected mode
- [ ] Selected mode is passed to game screen and used to filter puzzle selection
- [ ] Typecheck passes
- [ ] Verify on iOS simulator

### US-003: Toss-Up engine rules -- auto-reveal with timing
**Description:** As a developer, I need the engine to support timed auto-reveal of letters for Toss-Up mode, with deterministic reveal order.

**Acceptance Criteria:**
- [ ] New action `TOSS_UP_TICK` enhanced: accepts `{ type: 'TOSS_UP_TICK'; dtMs: number }` to track elapsed time
- [ ] New state fields: `tossUpElapsedMs: number` (time since last reveal), `tossUpRevealIntervalMs: number` (default 1000ms, configurable)
- [ ] Reveal one letter when `tossUpElapsedMs >= tossUpRevealIntervalMs`, then reset elapsed counter
- [ ] Reveal order: seeded-random shuffle of letter positions (already implemented), documented as canonical
- [ ] When all letters revealed without solve: round ends as loss
- [ ] `START_ROUND` for TOSSUP sets `turnState: 'TOSSUP_REVEALING'`
- [ ] Typecheck passes
- [ ] Unit tests: reveal cadence respects interval, reveal order is deterministic for same seed, round ends when all revealed

### US-004: Toss-Up engine rules -- buzz-in and lockout
**Description:** As a developer, I need buzz-in and lockout mechanics so the player can attempt to solve during Toss-Up.

**Acceptance Criteria:**
- [ ] New action `BUZZ_IN`: pauses auto-reveal, sets `turnState: 'TOSSUP_BUZZED'`
- [ ] New action `TOSS_UP_SOLVE_ATTEMPT`: accepts `{ phrase: string }`
  - Correct: `turnState: 'ROUND_OVER'`, reveal all letters, mark as win
  - Wrong: `turnState: 'TOSSUP_LOCKED_OUT'`, start lockout timer
- [ ] New state fields: `tossUpLockoutMs: number` (remaining lockout), `tossUpLockoutDurationMs: number` (default 3000ms)
- [ ] `TOSS_UP_TICK` during lockout: decrement `tossUpLockoutMs`; when <= 0, resume to `'TOSSUP_REVEALING'`
- [ ] Cannot buzz in during lockout
- [ ] Typecheck passes
- [ ] Unit tests: buzz pauses reveal, correct solve ends round, wrong solve triggers lockout, lockout expires and resumes reveal

### US-005: Toss-Up UI screen
**Description:** As a player, I want to play Toss-Up rounds with a "Buzz In" button, see letters reveal progressively, and submit a solve attempt.

**Acceptance Criteria:**
- [ ] Game screen in TOSSUP mode shows: category, puzzle board (letters reveal over time), "Buzz In" button
- [ ] Wheel is hidden in Toss-Up mode
- [ ] Keyboard is hidden (no letter-by-letter guessing)
- [ ] Tapping "Buzz In" pauses reveal and shows solve modal (TextInput for full phrase)
- [ ] During lockout: "Buzz In" disabled, countdown indicator shown (e.g., "Wait 3s...")
- [ ] On correct solve: celebration, "Next Puzzle" button
- [ ] On full reveal without solve: "Puzzle Revealed" message, "Next Puzzle" button
- [ ] Status banner shows mode-appropriate text ("TOSS-UP" header, "Buzz in to solve!")
- [ ] Haptic feedback on buzz-in tap and solve result
- [ ] Typecheck passes
- [ ] Verify on iOS simulator

### US-006: Bonus Round engine rules -- RSTLNE and letter picking
**Description:** As a developer, I need the engine to support the Bonus Round letter selection phase: reveal RSTLNE, then accept exactly 3 consonants + 1 vowel.

**Acceptance Criteria:**
- [ ] `START_ROUND` for BONUS already reveals RSTLNE (exists). Verify and add `turnState: 'BONUS_PICKING'`
- [ ] New action `BONUS_CHOOSE_LETTERS`: accepts `{ consonants: [string, string, string]; vowel: string }`
  - Validates: exactly 3 distinct consonants, exactly 1 vowel
  - Validates: no letter is in RSTLNE set
  - Validates: all are valid letters (A-Z)
  - On valid: reveal chosen letter positions, set `bonusPicks`, transition to `turnState: 'BONUS_SOLVE_TIMER'`
  - On invalid: return state unchanged (UI prevents this, but engine guards it)
- [ ] Revealed positions updated to include all occurrences of chosen letters
- [ ] Typecheck passes
- [ ] Unit tests: valid picks reveal correct positions, RSTLNE letters rejected, duplicate letters rejected, non-letter input rejected

### US-007: Bonus Round engine rules -- timed solve
**Description:** As a developer, I need the Bonus Round solve timer that counts down and gates solve attempts.

**Acceptance Criteria:**
- [ ] New state fields: `bonusTimerMs: number` (remaining ms, default 20000), `bonusTimerDurationMs: number` (configurable, default 20000)
- [ ] `BONUS_TICK` action: accepts `{ dtMs: number }`, decrements `bonusTimerMs`
- [ ] When `bonusTimerMs <= 0`: `turnState: 'ROUND_OVER'`, mark as loss (time expired)
- [ ] `BONUS_SOLVE_ATTEMPT` action: accepts `{ phrase: string }`
  - Correct: `turnState: 'ROUND_OVER'`, reveal all, mark as win
  - Wrong: remain in `'BONUS_SOLVE_TIMER'` (can try again within time)
- [ ] Cannot submit solve before timer starts (engine guards `turnState`)
- [ ] Typecheck passes
- [ ] Unit tests: timer decrements correctly, solve during timer works, wrong solve allows retry, timer expiry ends round as loss

### US-008: Bonus Round UI screen
**Description:** As a player, I want to play Bonus Rounds: see my category, see RSTLNE revealed, pick my letters, then solve under a timer.

**Acceptance Criteria:**
- [ ] Game screen in BONUS mode shows: category prominently, puzzle board with RSTLNE revealed
- [ ] Wheel is hidden in Bonus Round mode
- [ ] Letter picking phase: keyboard shows only eligible consonants and vowels (RSTLNE letters disabled)
  - Player taps 3 consonants, then 1 vowel (order enforced: consonants first)
  - Selected letters highlighted; "Confirm" button enabled when 3+1 selected
  - Can deselect before confirming
- [ ] After confirming picks: chosen letters revealed on board, 20-second countdown timer starts
- [ ] Timer shown prominently (large countdown display)
- [ ] Solve input: TextInput always visible during timer (no modal needed since this is the only action)
- [ ] On correct solve: celebration, timer stops, "Next Puzzle" button
- [ ] On wrong solve: brief shake/flash feedback, TextInput cleared, timer continues
- [ ] On timer expiry: "Time's Up!" message, full puzzle revealed, "Next Puzzle" button
- [ ] Haptic feedback: letter pick taps, correct/incorrect solve, timer expiry warning (last 5s)
- [ ] Typecheck passes
- [ ] Verify on iOS simulator

### US-009: TurnState enum extension
**Description:** As a developer, I need the TurnState type extended to support Toss-Up and Bonus flow states.

**Acceptance Criteria:**
- [ ] `TurnState` extended with: `'TOSSUP_REVEALING'`, `'TOSSUP_BUZZED'`, `'TOSSUP_LOCKED_OUT'`, `'BONUS_PICKING'`, `'BONUS_SOLVE_TIMER'`
- [ ] Existing states (`IDLE`, `SPINNING`, `GUESSING_CONSONANT`, `BUYING_VOWEL`, `SOLVING`, `ROUND_OVER`) unchanged
- [ ] StandardModeApp continues to work with existing states only
- [ ] Typecheck passes

### US-010: iOS timer lifecycle -- background/foreground handling
**Description:** As a player, I don't want timers to desync when I background and re-open the app.

**Acceptance Criteria:**
- [ ] When app goes to background during Toss-Up or Bonus: record timestamp via `AppState` listener
- [ ] On foreground resume: compute elapsed time, dispatch accumulated ticks to engine
- [ ] Toss-Up: if enough time passed during background, reveal appropriate number of letters (catch up)
- [ ] Bonus: if timer would have expired during background, end the round as loss
- [ ] No timer drift or desync after background/foreground cycle
- [ ] Typecheck passes
- [ ] Manual QA: background app during active timer, verify correct state on resume

### US-011: Engine unit tests -- round simulation
**Description:** As a developer, I need end-to-end round simulation tests for both modes.

**Acceptance Criteria:**
- [ ] Toss-Up simulation test: start round → tick through several reveals → buzz in → wrong solve → lockout → resume → buzz in → correct solve → round over
- [ ] Toss-Up simulation test: start round → tick through all reveals → round ends as loss (fully revealed)
- [ ] Bonus simulation test: start round → RSTLNE revealed → choose valid letters → letters revealed → tick timer → solve correctly → round over (win)
- [ ] Bonus simulation test: start round → RSTLNE revealed → choose valid letters → tick timer to expiry → round over (loss)
- [ ] All tests use injected seeds for determinism; no real timers
- [ ] Tests run via `cd ios && npx vitest run`

### US-012: Puzzle pack backward compatibility validation
**Description:** As a developer, I need to confirm existing puzzle packs still load and work after metadata changes.

**Acceptance Criteria:**
- [ ] All existing pack JSON files load without errors
- [ ] `mapPuzzles()` correctly derives `allowed_modes` for all puzzles
- [ ] Standard mode game flow works identically to before (regression test)
- [ ] No changes to pack JSON file format required
- [ ] Typecheck passes
- [ ] Existing 17+ tests continue to pass

## Functional Requirements

- FR-1: Extend `TurnState` type with 5 new states for Toss-Up and Bonus flows
- FR-2: Add `allowed_modes` to `Puzzle` interface, derived at load time from category
- FR-3: Categories excluded from Bonus Round: "Before & After", "Same Name", "Rhyme Time", "Song Lyrics", "Title/Author" (long multi-part phrases that are too easy/hard with RSTLNE)
- FR-4: All other categories eligible for all three modes
- FR-5: Add `getPuzzlesForMode(puzzles, mode)` filter helper to `packs.ts`
- FR-6: Toss-Up auto-reveal: ~1 letter/second (1000ms interval), seeded-random order
- FR-7: Toss-Up buzz-in pauses reveal; wrong solve triggers 3-second lockout
- FR-8: Toss-Up round ends on correct solve (win) or all letters revealed (loss)
- FR-9: Bonus Round reveals RSTLNE on start (existing logic)
- FR-10: Bonus Round letter picking: exactly 3 consonants + 1 vowel, not in RSTLNE, validated by engine
- FR-11: Bonus Round solve timer: 20 seconds, multiple attempts allowed within timer
- FR-12: Bonus Round ends on correct solve (win) or timer expiry (loss)
- FR-13: Home screen shows 3 mode cards with mode selection
- FR-14: Wheel and standard keyboard hidden in Toss-Up and Bonus modes
- FR-15: Haptic feedback for buzz-in, letter picks, solve results, timer warnings
- FR-16: App background/foreground: pause/catch-up timers using `AppState` listener
- FR-17: Pass/fail outcome only (no scoring for Toss-Up or Bonus)
- FR-18: Engine rules are pure functions; all timing via `dtMs` parameter (no `Date.now()` in reducer)

## Non-Goals

- No separate apps per mode (single app, mode selector)
- No separate puzzle pack formats (derive mode eligibility from category)
- No money/scoring for Toss-Up or Bonus (practice focus)
- No multiplayer or turn-taking
- No pluggable `RoundRules` abstraction yet (premature; extract later if needed)
- No puzzle pack JSON file modifications (metadata derived at runtime)
- No new puzzle categories or pack import pipeline changes
- No web version changes (iOS only)

## Design Considerations

- Toss-Up UI: clean, minimal -- puzzle board dominates, single "Buzz In" button centered below
- Bonus UI: two distinct phases (letter picking → timed solve) with clear visual transition
- Timer display: large, prominent countdown (seconds + tenths) during Bonus solve phase
- Lockout indicator: subtle but clear (grayed "Buzz In" button with countdown text)
- Reuse existing components: `InteractiveBoard`, `Modal`, `Keyboard` (with mode-specific filtering)
- Mode cards on home screen: use existing card styling from home screen activity cards

## Technical Considerations

- Engine changes are additive to `gameReducer` -- new actions and state fields, existing actions unchanged
- `TurnState` extension is a union type addition -- TypeScript will catch any unhandled cases in exhaustive switches
- Timer ticks driven by `requestAnimationFrame` or `setInterval` in UI, dispatching `dtMs` to reducer
- Background/foreground: use React Native `AppState` API to detect transitions
- All new state fields have safe defaults in `INITIAL_STATE` (no migration needed)
- Existing tests must continue passing without modification

## Success Metrics

- Player can start all 3 modes from home screen and play through a complete round
- Toss-Up: letters reveal at ~1/second, buzz-in works, lockout prevents spam, pass/fail shown
- Bonus: RSTLNE + picked letters display correctly, 20s timer counts down, solve works under pressure
- All existing tests pass + new mode-specific tests pass
- No changes to puzzle pack JSON files

## Open Questions

- Should there be a "practice mode" variant of Toss-Up with slower reveal speed (configurable in settings)?
- Should Bonus Round show a hint about how many letters remain unrevealed after picks?
- Should lockout duration (3s) and reveal interval (1s) be exposed in settings, or hardcoded with constants?
- Should the app track win/loss history per mode for future statistics features?

## Manual QA Checklist (iOS)

### Toss-Up Mode
- [ ] Tap "Toss-Up" on home screen → game starts with puzzle board and category
- [ ] Letters reveal approximately 1 per second in random order
- [ ] Tap "Buzz In" → reveal pauses, solve modal appears
- [ ] Submit correct answer → celebration, all letters revealed, "Next Puzzle" shown
- [ ] Submit wrong answer → lockout indicator (3s), then reveal resumes
- [ ] Cannot buzz in during lockout
- [ ] Let all letters reveal → "Puzzle Revealed" message shown
- [ ] "Next Puzzle" loads new puzzle and restarts flow
- [ ] Background app during reveal → resume shows correct number of letters revealed
- [ ] Haptic feedback on buzz-in and solve result

### Bonus Round Mode
- [ ] Tap "Bonus Round" on home screen → game starts with category and RSTLNE revealed
- [ ] RSTLNE letters correctly highlighted on board wherever they appear
- [ ] Keyboard shows eligible letters only (RSTLNE disabled/grayed)
- [ ] Can select exactly 3 consonants + 1 vowel; "Confirm" enables at 3+1
- [ ] Can deselect letters before confirming
- [ ] After confirm → chosen letters revealed on board, 20s timer starts
- [ ] Timer counts down visibly
- [ ] Submit correct answer → celebration, timer stops
- [ ] Submit wrong answer → feedback, input cleared, timer continues
- [ ] Timer reaches 0 → "Time's Up!", full puzzle revealed
- [ ] "Next Puzzle" loads new puzzle and restarts flow
- [ ] Background app during timer → resume shows correct remaining time (or round ended)
- [ ] Haptic feedback on letter picks, solve result, last-5-seconds warning
