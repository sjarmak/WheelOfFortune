# PRD: iOS App Improvements — Wheel Fix, Practice Packs, and Celebrations

## Introduction

The Wheel of Fortune iOS practice app (React Native/Expo) needs three improvements: (1) fix a bug where the wheel visually lands on one wedge but reports a different value, (2) add a full practice packs library with puzzle analytics and strategy dashboard for feature parity with the web version, and (3) add confetti and the dancing 8-bit Vanna avatar when a puzzle is solved. Additionally, rename the header from "Standard" to "Wheel Practice."

## Goals

- Fix wheel spin so the visually landed wedge always matches the reported value
- Port the web StrategyDashboard (all 4 tabs) and pack browser to iOS for full feature parity
- Enable players to reset, shuffle, or select specific puzzles from the pack browser during gameplay
- Port the 8-bit dancing Vanna sprite and confetti celebration to iOS on puzzle solve
- Rename app header from "Standard" to "Wheel Practice"

## User Stories

### Phase 1: Wheel Spin Bug Fix

#### US-001: Fix wheel spin visual-to-value mismatch
**Description:** As a player, I want the wheel to always land on the wedge matching the reported value so I can trust the spin result.

**Acceptance Criteria:**
- [ ] Audit iOS spin formula in `StandardWheel.tsx` against the web formula in `app/src/components/Wheel.tsx`
- [ ] The iOS formula correctly calculates `finalRotation` to place the pointer at the center of the winning wedge
- [ ] Accounts for cumulative rotation state across multiple consecutive spins (web uses `rotation % 360` to track current angle)
- [ ] Visual landing position matches `WHEEL_CONFIG[winningIndex]` value in all cases
- [ ] Add tests that verify: for seeds 1-50, the calculated final rotation angle modulo 360 places the pointer within the correct wedge's angular range
- [ ] Test that consecutive spins (3+ in a row) maintain visual-value consistency
- [ ] Typecheck passes (`npx tsc --noEmit`)

#### US-002: Rename header from "Standard" to "Wheel Practice"
**Description:** As a player, I want the app header to say "Wheel Practice" instead of "Standard" to better reflect the app's purpose.

**Acceptance Criteria:**
- [ ] Header text in `StandardModeApp.tsx` changed from "Standard" to "Wheel Practice"
- [ ] No other references to "Standard" as a user-facing label remain
- [ ] Typecheck passes

---

### Phase 2: Practice Packs & Puzzle Analysis

#### US-003: Port strategyAnalytics engine to iOS
**Description:** As a developer, I need the strategy analytics engine available in the iOS codebase so the StrategyDashboard can compute letter frequencies, category analysis, wheel analysis, and recommendations.

**Acceptance Criteria:**
- [ ] `ios/src/engine/strategyAnalytics.ts` created, ported from `app/src/engine/strategyAnalytics.ts`
- [ ] Exports `analyzePuzzlePack(puzzles)` returning `PuzzleCorpusAnalytics`
- [ ] All 5 core functions ported: `calculateLetterFrequencies`, `calculateCategoryAnalysis`, `findCommonPatterns`, `calculateWheelAnalysis`, `generateRecommendations`
- [ ] Types defined for `LetterFrequency`, `CategoryAnalysis`, `WheelAnalysis`, `StrategyRecommendation`, `PuzzleCorpusAnalytics`
- [ ] Unit tests validate analytics output against known puzzle data
- [ ] Typecheck passes

#### US-004: Build pack browser screen
**Description:** As a player, I want to browse available puzzle packs and see puzzle listings so I can select specific puzzles to practice.

**Acceptance Criteria:**
- [ ] New `PackBrowser` component in `ios/src/components/PackBrowser.tsx`
- [ ] Displays list of available packs with name, puzzle count, and category breakdown
- [ ] Tapping a pack shows its puzzle list with: phrase (masked or revealed based on settings), category, difficulty score
- [ ] Filter puzzles by category (dropdown/chip selector for PHRASE, THING, PLACE, etc.)
- [ ] Filter puzzles by difficulty range (easy/medium/hard or slider)
- [ ] Search puzzles by keyword within revealed phrases
- [ ] Tapping a puzzle starts a new game with that specific puzzle
- [ ] Accessible from main menu as a dedicated screen (not just a modal)
- [ ] Typecheck passes

#### US-005: Build StrategyDashboard screen
**Description:** As a player, I want to view puzzle analytics and strategy recommendations so I can develop better gameplay strategies.

**Acceptance Criteria:**
- [ ] New `StrategyDashboard` component in `ios/src/components/StrategyDashboard.tsx`
- [ ] **Letter Frequency tab:** Bar chart of all 26 letters color-coded by frequency (green >70%, yellow 40-70%, orange 20-40%, red <20%)
- [ ] **Optimal Strategy tab:** Top 5 consonants, top 5 vowels, RSTLNE ranking by actual frequency, vowel buy threshold display
- [ ] **Wheel Analysis tab:** Expected value per spin, outcome probabilities (cash, bankrupt, lose turn, free play), average cash value
- [ ] **Category Insights tab:** Category selector dropdown, top 15 letters for selected category, vowel ratio, common patterns list
- [ ] Tab navigation between the 4 views
- [ ] Accessible from main menu as a dedicated screen
- [ ] Typecheck passes

#### US-006: Add main menu / home screen navigation
**Description:** As a player, I want a main menu to navigate between game, pack browser, and strategy dashboard so I can access all features.

**Acceptance Criteria:**
- [ ] New `HomeScreen` component in `ios/src/components/HomeScreen.tsx` (or equivalent navigation state in `StandardModeApp.tsx`)
- [ ] Navigation options: "Play" (current game), "Puzzle Packs" (pack browser), "Strategy" (dashboard)
- [ ] Consistent back-navigation from each screen to home
- [ ] Current game state preserved when navigating away and back
- [ ] Header shows "Wheel Practice" on all screens
- [ ] No external routing library required (state-based navigation matching existing pattern)
- [ ] Typecheck passes

#### US-007: Add in-game quick-switch and game controls
**Description:** As a player, I want to reset, shuffle, or select a new puzzle during gameplay so I can quickly change what I'm practicing.

**Acceptance Criteria:**
- [ ] In-game menu (accessible from settings gear or new control bar) with options:
  - **Reset Game:** Resets current puzzle to initial state (same puzzle, fresh guesses) — new reducer action `RESET_ROUND`
  - **Random Puzzle:** Shuffles to a random new puzzle from the current pack — new reducer action `RANDOM_PUZZLE`
  - **Browse Puzzles:** Opens pack browser as a modal overlay for in-game puzzle selection
- [ ] `RESET_ROUND` action: clears `guessedLetters`, `revealedPositions`, `spinResult`, resets `turnState` to `IDLE`, resets `currentRoundScore` to 0, keeps same `currentPuzzle` and `totalScore`
- [ ] `RANDOM_PUZZLE` action: selects a random puzzle from the loaded pack (excluding current puzzle), resets round state
- [ ] `SELECT_PUZZLE` action: accepts a puzzle ID, loads that puzzle, resets round state
- [ ] Existing `RESET_GAME` action unchanged (full reset including total score)
- [ ] Unit tests for all new reducer actions
- [ ] Typecheck passes

---

### Phase 3: Puzzle Solve Celebrations

#### US-008: Port confetti animation on puzzle solve
**Description:** As a player, I want to see confetti when I solve a puzzle so the experience feels rewarding.

**Acceptance Criteria:**
- [ ] Confetti triggers when `turnState` transitions to `ROUND_OVER` (puzzle solved successfully)
- [ ] Uses `react-native-confetti-cannon` (already in `package.json`)
- [ ] Confetti parameters: ~100 particles, spread across screen, falls from top
- [ ] Confetti does NOT trigger on round loss (bankrupt out, etc.) — only on successful solve
- [ ] No confetti on game reset or puzzle skip
- [ ] Typecheck passes

#### US-009: Port 8-bit dancing Vanna sprite
**Description:** As a player, I want to see the dancing 8-bit Vanna character celebrate when I solve a puzzle, matching the web version's charm.

**Acceptance Criteria:**
- [ ] New `Vanna` component in `ios/src/components/Vanna.tsx`
- [ ] 8-bit pixelated character rendered using React Native Views (colored rectangles matching web sprite):
  - Hair (5 yellow bars), face (yellow rectangle with blue eyes), dress (colored rectangle with white stripe), arms, legs, shoes
- [ ] 4-frame walk animation cycle: alternating leg/arm positions matching web frame offsets
- [ ] Dance mode activated when puzzle is solved: vertical sine-wave bounce during walk frames
- [ ] 6 golden sparkle effects radiating outward during dance
- [ ] Character appears on screen when puzzle is solved, dances for celebration duration
- [ ] Default appearance: yellow hair (#FACC15), red dress (#DC2626)
- [ ] Animation powered by `react-native-reanimated` (already in project, replaces web's framer-motion)
- [ ] Typecheck passes

#### US-010: Integrate celebration sequence on puzzle solve
**Description:** As a player, I want confetti and dancing Vanna to appear together as a cohesive celebration when I solve the puzzle.

**Acceptance Criteria:**
- [ ] When `turnState === 'ROUND_OVER'` (successful solve): confetti fires AND Vanna appears dancing
- [ ] Celebration displays for 3-5 seconds before allowing "Next Round" interaction
- [ ] "PUZZLE SOLVED!" toast notification displays (existing toast system)
- [ ] Vanna positioned at bottom-center of screen during celebration
- [ ] Celebration does not block the puzzle board view (Vanna overlays, doesn't replace)
- [ ] Pressing "Next Round" dismisses celebration and advances
- [ ] Typecheck passes

---

## Functional Requirements

- FR-1: Fix iOS wheel spin formula to correctly calculate `finalRotation` accounting for cumulative rotation and wedge center alignment
- FR-2: Add spin consistency tests validating visual-to-value mapping for seeds 1-50 and consecutive spin sequences
- FR-3: Rename header text from "Standard" to "Wheel Practice" in `StandardModeApp.tsx`
- FR-4: Port `strategyAnalytics.ts` engine to `ios/src/engine/` with full type definitions
- FR-5: Create `PackBrowser` component with pack listing, puzzle listing, category/difficulty filtering, and search
- FR-6: Create `StrategyDashboard` component with 4 tabs: Letter Frequency, Optimal Strategy, Wheel Analysis, Category Insights
- FR-7: Implement state-based navigation between Home, Game, Pack Browser, and Strategy Dashboard screens
- FR-8: Add `RESET_ROUND`, `RANDOM_PUZZLE`, and `SELECT_PUZZLE` reducer actions with unit tests
- FR-9: Add in-game controls for reset, shuffle, and browse-to-select puzzle flow
- FR-10: Integrate `react-native-confetti-cannon` on successful puzzle solve (`ROUND_OVER` state)
- FR-11: Port 8-bit Vanna sprite as React Native View-based component with 4-frame walk animation and dance mode
- FR-12: Combine confetti + Vanna + toast into cohesive celebration sequence on puzzle solve

## Non-Goals

- No online multiplayer or real-time features
- No user accounts, login, or cloud sync
- No shop system or Vanna customization (hair/dress colors) on iOS (use defaults only)
- No Vanna tile-walking animation during gameplay (dance celebration only — tile reveal is a separate future feature)
- No new puzzle pack creation or editing within the app
- No push notifications or reminders
- No landscape orientation support
- No iPad-specific layout optimizations
- No sound effects beyond existing haptic feedback (audio is a separate future feature)
- No porting of the full web wheel test suite (only focused iOS-specific tests)

## Design Considerations

- **Navigation pattern:** State-based screen switching (no routing library). Use existing modal pattern for in-game overlays, full-screen state switches for main navigation.
- **Pack browser UI:** Use `FlatList` for performant scrolling of puzzle lists. Category filters as horizontal scrollable chips. Difficulty as segmented control (Easy/Medium/Hard).
- **Strategy dashboard:** Tab bar at top of screen. Bar charts rendered with `react-native-svg` (already in project). Color scheme matching web version.
- **Vanna sprite:** Build entirely with React Native `View` components (colored rectangles) — no image assets needed. Use `react-native-reanimated` for frame animation and bounce effects.
- **Confetti:** `react-native-confetti-cannon` is already installed. Render as overlay with `pointerEvents="none"` so it doesn't block interaction.
- **Consistent header:** All screens show "Wheel Practice" in the header area with back navigation where appropriate.

## Technical Considerations

- **Wheel spin fix:** The iOS formula `finalRotation = rotation.value + 360*5 + (360 - wedgeRotation) - (WEDGE_ANGLE / 2)` may not correctly account for the current rotation modulo. The web formula computes `delta` relative to `currentAngle = rotation % 360`, which handles cumulative drift. Align iOS formula with this approach.
- **Type consistency:** iOS uses `type: 'VALUE'` while web uses `type: 'CASH'` for cash wedges. Both codebases should be consistent — iOS already uses `VALUE`, keep it.
- **Reanimated worklet boundary:** Per CLAUDE.md, never pass complex objects through `runOnJS()`. Vanna animation must use shared values and JS-side state, not worklet callbacks with objects.
- **AsyncStorage:** Game state persistence already uses AsyncStorage. Navigation state (current screen) should also persist so the app returns to where the player left off.
- **Performance:** `analyzePuzzlePack()` runs synchronously. For 54 puzzles this is fast, but if pack sizes grow, consider memoization or running in a `useEffect` with loading state.
- **Confetti cannon ref:** Use `useRef` to control the confetti cannon imperatively (`.start()` method) rather than unmounting/remounting the component.

## Success Metrics

- Wheel spin visual-value mismatch rate drops to 0% (verified by automated tests across 50 seeds)
- All 4 StrategyDashboard tabs render correctly with data from the original pack
- Players can navigate from game to pack browser, select a puzzle, and start playing it in under 4 taps
- In-game reset/shuffle loads a new puzzle state without navigating away from the game screen
- Confetti + Vanna celebration triggers on every successful puzzle solve and does not trigger on failures
- All new reducer actions covered by unit tests
- Typecheck passes across entire iOS codebase

## Open Questions

- Should the pack browser show puzzle phrases in plaintext (spoilers) or masked by default with a reveal toggle?
- Should game statistics (total score, rounds played) persist across puzzle selection changes, or reset when switching puzzles from the browser?
- Should the Vanna celebration duration be configurable, or fixed at ~4 seconds?
- Do we need to handle the case where only one puzzle remains in a pack when "Random Puzzle" is pressed?
