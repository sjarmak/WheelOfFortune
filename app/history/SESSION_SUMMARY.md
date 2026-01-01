# Wheel of Fortune Practice App - Session Summary

## Completed Work

### Core WoF Rules Implementation (4 Beads)

#### bd-76: GameState Refactor ✅
- Renamed `roundScore` → `currentRoundScore` (resets each puzzle)
- Kept `totalScore` (carries forward between rounds)
- Added `ADD_TO_ROUND_SCORE` and `CLEAR_ROUND_SCORE` actions
- **Tests**: 6 tests in `src/engine/__tests__/game-state-refactor.test.ts`
- **Foundation for future multiplayer support**

#### bd-77: Consonant-Only Enforcement ✅
- After spinning wheel, `turnState` becomes `GUESSING_CONSONANT`
- Keyboard blocks vowels when consonantsOnly flag is true
- Y treated as consonant (not in VOWELS list)
- Works correctly with FREE_PLAY, BANKRUPT, LOSE_TURN wedges
- **Tests**: 6 tests in `src/engine/__tests__/consonant-only.test.ts`

#### bd-78: Multiple Letter Rule ✅
- Guessing letter multiplies wheel value by occurrence count
- Example: $500 spin × 3 L's = $1500 points
- Reveals all letter instances
- Logic already fully implemented in GUESS_LETTER reducer
- **Tests**: 6 tests in `src/engine/__tests__/multiple-letter-rule.test.ts`

#### bd-79: BANKRUPT & LOSE_TURN ✅
- BANKRUPT: clears `currentRoundScore` but preserves `totalScore`
- LOSE_TURN: keeps `currentRoundScore`, ends turn
- Both properly end turn by setting turnState to IDLE
- Critical distinction: BANKRUPT loses current round only, not cumulative
- **Tests**: 6 tests in `src/engine/__tests__/bankrupt-and-lose-turn.test.ts`

### Additional Features & Fixes

1. **Testing Infrastructure**
   - Added vitest config and npm test script
   - Excluded test files from TypeScript build
   - 28 comprehensive tests across 5 test files (all passing)

2. **UI/UX Improvements**
   - Added "Reset Puzzle" button in Settings (keeps total score)
   - Separated "Reset Puzzle" from "Reset All Progress"
   - Keyboard only enabled after spinning (GUESSING_CONSONANT state)
   - Spin button disabled during consonant guessing phase
   - Wheel stays visible after landing on wedge

3. **Vowel Buying Flow**
   - Added `BUY_VOWEL` action to transition to BUYING_VOWEL state
   - Keyboard shows only vowels in BUYING_VOWEL state
   - Validates sufficient funds before allowing vowel purchase
   - Status text shows "PICK A VOWEL ($250)" during buying phase

4. **Wheel Spin Logic**
   - Refactored to select wedge **before** animation starts
   - Ensures visual result always matches reported value (deterministic)
   - Animation shows spinning, lands on pre-selected wedge

5. **Bug Fixes**
   - Removed incorrect $1000 minimum on puzzle solve
   - Removed jitter from wheel spin (was causing misalignment)
   - Fixed wheel angle calculation (multiple iterations)
   - Keyboard enable/disable logic properly enforced

## Known Issues / Remaining Work

### Wheel Angle Calculation ⚠️
The wheel landing calculation is still not perfectly accurate. The pointer sometimes doesn't land exactly on the selected wedge. The issue appears to be in the angle normalization logic in `src/components/Wheel.tsx` (lines 35-43). 

**Suspected root cause**: The relationship between SVG coordinate angles, CSS rotation, and pointer position still has subtle off-by-one or normalization errors.

**Recommended next steps**:
1. Add visual debug overlay showing calculated vs. actual wedge positions
2. Test with specific wedges (0, 4, 8, 12) to identify pattern
3. Consider using pointer angle instead of reverse calculation
4. May need to adjust the `360 - normalizedWedgeAngle` formula

## Test Results
- All 28 tests passing ✅
- Build succeeds with 6 TypeScript warnings (unused vars, edge case checking)
- No runtime errors in core game logic

## Git Commits This Session
1. bd-76: Refactor GameState to track round vs total scores
2. bd-77: Enforce consonant-only guessing after wheel spin
3. bd-78: Implement multiple letter rule and points calculation
4. bd-79: Handle BANKRUPT and LOSE_TURN wheel wedges properly
5. Fix: Remove incorrect $1000 minimum on puzzle solve
6. Fix: Remove jitter from wheel spin
7. Fix: Correct wheel angle calculations (multiple commits)
8. Refactor: Deterministic wedge selection before animation
9. Fix: Keep wheel visible while guessing consonant
10. Fix: Disable spin during consonant guessing
11. Fix: Correct wheel rotation target calculation
12. Add Reset Puzzle button to settings
13. Add BUYING_VOWEL state for vowel selection

## Architecture Notes

### Game State Flow
```
START_ROUND
  ↓
IDLE (can spin, solve, or buy vowel)
  ↓
SPIN_WHEEL → SPINNING → SPIN_RESULT
  ↓
GUESSING_CONSONANT (must pick consonant)
  ↓
IDLE (consonant found or missing, turn continues if found)
  ├→ BUY_VOWEL → BUYING_VOWEL (pick vowel)
  │   ↓
  │   IDLE (vowel found/missing)
  │
  └→ SOLVE_ATTEMPT → ROUND_OVER (if correct)
```

### Key Design Decisions
1. **Separate round and total scores**: Enables BANKRUPT to clear only current round
2. **Deterministic wedge selection**: Pick before animation to ensure consistency
3. **BUYING_VOWEL state**: Separates vowel buying from consonant guessing
4. **Keyboard disable/enable**: Enforces turn structure (must spin before guessing)
5. **Test-first approach**: 28 tests validate core rules before UI integration

## Next Session Priorities
1. **Fix wheel landing bug** - This is the main UX issue
2. Add turn/round separation UI tracking (whose turn, round number)
3. Implement wrong guess logic (ends turn in normal play, continue in free play)
4. Add wrong solve attempt handling (ends turn)
5. Implement puzzle solving win state animations/sounds
6. Consider multiplayer player management (prepare foundation for future)
