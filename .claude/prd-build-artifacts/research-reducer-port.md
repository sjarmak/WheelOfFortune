# Research: reducer-port

## iOS types.ts vs app/types.ts (diff)

Missing fields in app `GameState`:
- `tossUpElapsedMs: number`
- `tossUpRevealIntervalMs: number`
- `tossUpLockoutMs: number`
- `tossUpLockoutDurationMs: number`
- `bonusTimerMs: number`
- `bonusTimerDurationMs: number`
- `roundResult: 'win' | 'loss' | null`
- `mustSpin: boolean`

Missing turnStates in app `GameState.turnState`:
- `TOSSUP_REVEALING`
- `TOSSUP_BUZZED`
- `TOSSUP_LOCKED_OUT`
- `BONUS_PICKING`
- `BONUS_SOLVE_TIMER`

The iOS TurnState union in `types.ts` has exactly these 11 values:
`IDLE | SPINNING | GUESSING_CONSONANT | BUYING_VOWEL | SOLVING | ROUND_OVER | TOSSUP_REVEALING | TOSSUP_BUZZED | TOSSUP_LOCKED_OUT | BONUS_PICKING | BONUS_SOLVE_TIMER`

## iOS game.ts vs app/game.ts (action union diff)

iOS `GameAction` has actions absent from web:
- `TOSS_UP_TICK` (with `dtMs` payload — web one has no payload)
- `BUZZ_IN`
- `TOSS_UP_SOLVE_ATTEMPT`
- `CANCEL_TOSS_UP_ATTEMPT`
- `RESET_ROUND`
- `RANDOM_PUZZLE`
- `SELECT_PUZZLE`
- `BONUS_CHOOSE_LETTERS`
- `BONUS_TICK`
- `BONUS_SOLVE_ATTEMPT`

Web already has: `START_ROUND, SPIN_WHEEL, SPIN_RESULT, GUESS_LETTER, BUY_VOWEL, SOLVE_ATTEMPT, TOSS_UP_TICK (no payload), ADD_TO_ROUND_SCORE, CLEAR_ROUND_SCORE, RESET_GAME`.

Required 11 new actions (to be added): `TOSS_UP_TICK {dtMs}` (change payload shape — web's was bare), `BUZZ_IN`, `TOSS_UP_SOLVE_ATTEMPT`, `CANCEL_TOSS_UP_ATTEMPT`, `BONUS_CHOOSE_LETTERS`, `BONUS_TICK`, `BONUS_SOLVE_ATTEMPT`, `RESET_ROUND`, `RANDOM_PUZZLE`, `SELECT_PUZZLE`.

That's 10 new actions + 1 shape change to existing TOSS_UP_TICK.

## iOS reducer behavior summary

### START_ROUND (iOS)
- Sets `turnState` to `TOSSUP_REVEALING` for TOSSUP, `BONUS_PICKING` for BONUS, else `IDLE`.
- Resets `tossUpElapsedMs=0`, `tossUpLockoutMs=0`, `bonusTimerMs = bonusTimerDurationMs`, `bonusPicks=[]`, `roundResult=null`, `mustSpin=false`.

### SPIN_RESULT (iOS)
- BANKRUPT: mustSpin=true, score=0, turnState=IDLE.
- LOSE_TURN: mustSpin=true, turnState=IDLE.
- VALUE: mustSpin=false, turnState=GUESSING_CONSONANT.

### GUESS_LETTER (iOS)
- On correct: `mustSpin=false`, keep `spinResult`, turnState=IDLE.
- On wrong: `mustSpin=true`, clear `spinResult`, turnState=IDLE.

### TOSS_UP_TICK (iOS)
- Only active if `turnState === TOSSUP_REVEALING` or `TOSSUP_LOCKED_OUT`.
- In LOCKED_OUT: decrements `tossUpLockoutMs`; if expired, transitions to REVEALING with leftover time recursively applied.
- In REVEALING: accumulates `tossUpElapsedMs`, reveals letters per interval; if all revealed → ROUND_OVER loss.

### BUZZ_IN (iOS)
- Only active in TOSSUP_REVEALING → TOSSUP_BUZZED.

### TOSS_UP_SOLVE_ATTEMPT (iOS)
- Only from TOSSUP_BUZZED.
- Correct → ROUND_OVER win, reveal all.
- Wrong → TOSSUP_LOCKED_OUT, `tossUpLockoutMs = tossUpLockoutDurationMs` (3000ms).

### CANCEL_TOSS_UP_ATTEMPT (iOS)
- Only from TOSSUP_BUZZED → TOSSUP_REVEALING.

### BONUS_CHOOSE_LETTERS (iOS)
- Only from BONUS_PICKING.
- Validates 3 unique non-RSTLNE consonants + 1 non-RSTLNE vowel.
- Reveals chosen positions, transitions to BONUS_SOLVE_TIMER.

### BONUS_TICK (iOS)
- Only BONUS_SOLVE_TIMER, decrements `bonusTimerMs`; if ≤0 → ROUND_OVER loss, reveal all.

### BONUS_SOLVE_ATTEMPT (iOS)
- Only BONUS_SOLVE_TIMER. Correct → ROUND_OVER win, reveal all. Wrong → state unchanged (retry).

### RESET_ROUND (iOS)
- Clears guessedLetters, revealedPositions, spinResult, mustSpin=false, turnState=IDLE, currentRoundScore=0.

### RANDOM_PUZZLE (iOS)
- Selects random puzzle excluding current; resets per-round fields.

### SELECT_PUZZLE (iOS)
- Sets currentPuzzle to explicit puzzle and resets per-round fields.

## Characterization test implications

The existing `characterization.test.ts` asserts:
- `INITIAL_STATE` shape doesn't currently include `mustSpin`, `tossUpElapsedMs`, `tossUpRevealIntervalMs`, `tossUpLockoutMs`, `tossUpLockoutDurationMs`, `bonusTimerMs`, `bonusTimerDurationMs`, `roundResult`. These fields need to be added to the INITIAL_STATE snapshot.
- `START_ROUND on TOSSUP` currently expects `turnState === 'IDLE'`. iOS sets it to `TOSSUP_REVEALING`. THIS IS A BEHAVIOR CHANGE on existing action.
- `START_ROUND on BONUS` currently goes to `IDLE`. iOS sets to `BONUS_PICKING`. BEHAVIOR CHANGE.
- `GUESS_LETTER incorrect` expects `spinResult` preserved (web keeps it). iOS clears it (mustSpin semantics). BEHAVIOR CHANGE.
- `GUESS_LETTER correct` asserts `spinResult === 500` preserved — matches iOS.
- `TOSS_UP_TICK` test uses no payload — iOS requires `dtMs`. BEHAVIOR CHANGE.

These are the **additive** updates necessary. Need to update characterization.test.ts to reflect new INITIAL_STATE shape AND updated turnState transitions for TOSSUP/BONUS/guess-letter. Log as additive change in SNAPSHOT_LOCK.md.

The characterization test for "TOSS_UP_TICK reveals next position" will need to become "TOSS_UP_TICK with dtMs=1000 reveals next position" (just add payload).

## Port plan

1. Copy iOS test files verbatim — they import `from '../engine/game'` and `from '../engine/types'`. In app, the equivalent paths are `from '../game'` and `from '../types'` (they live in `__tests__/` subdirectory). **Adapt imports to `../game`, `../types`, `../rng`, `../packs`, `../wheelSpin`**.
2. Copy `wheelSpin.ts` from iOS to app/src/engine/ (file missing in app).
3. Rewrite `types.ts` to include all iOS fields (ADDITIVE — won't break existing code because new fields just have default values).
4. Rewrite `game.ts` with iOS reducer logic.
5. Update characterization test to reflect new reality with ADDITIVE changes; log in SNAPSHOT_LOCK.md.
