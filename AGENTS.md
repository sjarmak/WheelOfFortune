# Wheel of Fortune Agent Guidance

This file contains project-specific guidance for AI agents working on this codebase.

## Design Principles (Mandatory for all code changes)

These principles apply to ALL code changes. Agents MUST follow these when implementing features or fixes.

### 1. Minimal, Focused Changes

- **Each commit = one feature or fix.** Don't bundle multiple features in a single commit.
- **Code changes should be as small as possible.** Implement only what's needed to satisfy the requirement.
- **No speculative features.** Don't add code "just in case" it might be useful later.
- **Rationale:** Smaller changes are easier to review, test, and debug. They reduce risk of unexpected side effects.

### 2. Adversarial Review (Mandatory for Complex/Large Changes)

Before closing a bead with complex or large code changes:

- **Ask yourself:** "What could break with this change?"
- **Test the failure cases:** What happens if inputs are wrong? What edge cases aren't covered?
- **Look for side effects:** Does this change affect other modules? Unintended consequences?
- **Code review the change yourself:** Would you approve this if another agent wrote it?
- If you can't confidently answer all of these, **keep the bead open** and leave notes for the next agent.

### 3. Automated Tests Per Commit

- **Every commit must have associated automated tests** that validate the functionality works as designed.
- **Tests must be specific to the change:** Generic test suites don't count.
- **Tests must use real code, not mocks** (unless requirement explicitly requires mocking).
- **If you can't write a test for your change, your design is wrong.** Refactor until testable.

### 4. Clear, Descriptive Naming

Names are for the next agent or developer reading your code months later.

- **Functions:** Use full words, describe what it does: `validate_task_completion()` not `check()`
- **Classes:** Use clear types: `TaskValidator` not `Helper`
- **Files:** Name after the primary responsibility: `task_validator.py` not `utils.py`
- **Variables:** Use meaningful names: `max_retries` not `mr`
- **Comments:** Explain WHY, not WHAT. Code shows what, comments explain why decisions were made.

**Bad example:** `src/utils.py` with a `process()` function
**Good example:** `src/task_validators/timeout_validator.py` with `validate_task_timeout()` function

### 5. Modular, Independently Testable Design

- **Single responsibility:** Each class/module should have one job.
- **Dependencies explicit:** Pass dependencies in, don't create them inside the function.
- **Independently testable:** You should be able to test one module without starting up the whole system.
- **Loose coupling:** Changes to one module shouldn't ripple through the codebase.

**Bad example:** `Runner` class that creates its own agents, loads configs, runs tests, and aggregates results all in one class
**Good example:** `Runner` accepts injected `AgentFactory`, `ConfigLoader`, `TestRunner`, `ResultAggregator` as dependencies

### 6. Root Directory is Sacred

**CRITICAL RULE:** Do NOT create random markdown files in the root directory.

- ✅ **DO:** `docs/`, `history/`, `.beads/`, `src/`, `tests/`
- ❌ **DON'T:** `PLAN.md`, `STATUS.md`, `NOTES.md`, `IMPLEMENTATION.md`, `TODO.md` in root
- ❌ **DON'T:** `MIGRATION_STATUS.md`, `PROGRESS.md`, `SESSION_SUMMARY.md` in root

**Where things go:**

- **Permanent documentation:** `docs/` (ARCHITECTURE.md, DEVELOPMENT.md, API.md)
- **Temporary planning:** `history/` (PLAN.md, SESSION_NOTES.md)
- **Issue tracking:** `.beads/issues.jsonl` (NOT markdown files)
- **Agent guidance:** AGENTS.md only

If you feel the urge to create a markdown file in root, STOP. Either:

1. Add it to AGENTS.md if it's agent guidance
2. Put it in `docs/` if it's permanent documentation
3. Put it in `history/` if it's temporary planning

## Bead Closure: Only When Work is Actually Complete

**⚠️ DO NOT close beads prematurely.** Only close a bead when the work is FULLY DONE and tested with **deterministic, specific tests** for the exact requirements. Closing beads early means:

- ❌ Work appears complete to other agents but is actually incomplete
- ❌ The next agent wastes time discovering the work isn't done
- ❌ Learning systems learn from incomplete work (bad signal)

**What "complete" means (ALL required):**

- ✅ **Specific test**: A deterministic test that validates the EXACT behavior required (not generic tests)
- ✅ **Unit tests**: Any new code changes have accompanying unit tests to prevent regressions
- ✅ **Tests NOT mocked**: Use real implementations unless requirement explicitly specifies mocking
- ✅ **All tests pass**: Run your test suite and verify EVERY test passes
- ✅ **Code committed**: All code changes committed to git
- ✅ **No known bugs**: No open issues or TODOs from this work
- ✅ **Documentation**: Updated if functionality/API changed
- ✅ **Ready to hand off**: Next agent can pick this up and immediately use it

**Testing requirement details:**

- Each bead MUST have a test that proves its specific requirement is met
- Do NOT rely on generic test suites to validate bead-specific work
- Do NOT use mocks unless the requirement explicitly says to mock something
- Write unit tests alongside any code changes (test-first is preferred)

**If work is NOT complete:** Keep the bead in `in_progress` status. Do NOT close it.

**When work on a bead is COMPLETELY FINISHED:**

```bash
# 1. Create a specific test (if one doesn't exist)
# This test MUST prove the exact requirement of the bead is met
# Example: If bead is "Add feature X", test should call feature X and verify it works
# DO NOT use mocks unless the requirement says to

# 2. Create unit tests for any new code
# These prevent regressions when other agents modify the code later

# 3. Run the specific test to verify it passes
pytest tests/test_<feature_name>.py -v

# 4. Run all tests to ensure no regressions
pytest tests/ -q

# 5. Verify test results prove the requirement is met
# If the test doesn't directly validate the requirement, work isn't done

# 6. Commit all code and tests
git add .
git commit -m "<bead-id>: [description]. Tests: [what tests validate the requirement]"

# 7. ONLY then close the bead (and only if step 5 passed)
bd close <bead-id> --reason "Completed: [detailed description]. Validated by: tests/<test_file>.py::<test_name>"
```

### Important Notes on Bead Closure

- **Each bead needs a specific test.** Don't rely on generic suites to validate bead requirements.
- **Always use real implementations, not mocks**, unless the requirement explicitly requires mocking.
- **Unit tests are mandatory** for any code changes (prevents regressions).
- **ONLY close when tests prove the requirement is met.** Passing generic tests ≠ bead complete.
- **Closing a bead is a promise** that the next agent can pick it up and it will work.
- **When in doubt, leave it in `in_progress`.** It's better to be conservative.
- **Learning systems learn from complete, tested code.** Untested or incomplete code creates bad learning signals.

## Workflow for AI Agents

**Standard workflow:**

1. **Check ready work**: `bd ready` shows unblocked issues
2. **Claim your task**: `bd update <id> --status in_progress`
3. **Understand the requirement**: Read the requirement carefully - what EXACT behavior must be demonstrated?
4. **Test-first approach** (strongly recommended):
   - Write a test that proves the requirement works
   - Test should use REAL implementations, not mocks (unless requirement says to mock)
   - This test should fail initially (red state)
5. **Implement**: Write code to make the test pass
6. **Unit tests**: Add unit tests for any new code to prevent regressions
7. **Verify tests pass**:
   ```bash
   pytest tests/test_<feature>.py -v     # Specific test
   pytest tests/ -q                       # All tests (no regressions)
   ```
   - If tests don't directly validate the requirement, work isn't done
8. **Document**: Update docs/code comments if API or functionality changed
9. **Discover new work?** Create linked issue:
   - `bd create "Found bug" -p 1 --deps discovered-from:<parent-id>`
10. **Commit your changes**:
    ```bash
    git add .
    git commit -m "<bead-id>: [description]. Tests: tests/test_<name>.py::<test_func>"
    ```
11. **Only if work is 100% complete and tests prove it**: Close the bead
    ```bash
    bd close <id> --reason "Completed: [detailed summary]. Validated by: tests/test_<name>.py::<test_func>"
    ```

**Key principles:**

- ✅ Create a **specific test for the requirement** (not generic tests)
- ✅ Use real implementations unless requirement explicitly says to mock
- ✅ Write unit tests for new code to prevent regressions
- ✅ Only close when tests PROVE the requirement is met
- ✅ Keep beads in `in_progress` if more work remains
- ❌ Don't assume generic test passing = bead complete
- ❌ Don't close a bead to "finish" it if work is incomplete

## Landing the Plane

**When the user says "let's land the plane"**, follow this clean session-ending protocol:

1. **Review each bead you worked on** - Only close beads where work is COMPLETELY finished

   ```bash
   bd list --json | jq '.[] | select(.status == "in_progress") | {id, title}'
   ```

   For each bead, verify:

   - **Specific test exists**: Is there a test that directly validates the requirement?
   - **Test uses real code**: Does the test call actual implementations (not mocks)?
   - **Tests pass**: Does `pytest tests/<bead_test>.py -v` pass?
   - **No regressions**: Does `pytest tests/ -q` pass (all tests)?
   - **Code committed**: Are all changes committed to git?
   - **No remaining issues**: Are there open TODOs or known bugs?

   If ALL YES: Close it. If ANY NO: Leave it open.

   ```bash
   bd close <bead-id> --reason "Completed: [detailed summary]. Verified by: tests/test_<name>.py::<test_func>"
   ```

2. **File beads issues for remaining work** that needs follow-up

   ```bash
   bd create "Remaining task" -t task -p 2
   ```

3. **Ensure all quality gates pass** (if code changes were made) - run tests/builds (file P0 issues if broken)

4. **Commit everything**:

   ```bash
   git add .
   git commit -m "Session: Closed <beads>, filed follow-up work"
   ```

5. **Sync the issue tracker carefully** - Work methodically to ensure local and remote issues merge safely. This may require pulling, handling conflicts (sometimes accepting remote changes and re-importing), syncing the database, and verifying consistency.

   ```bash
   git pull --rebase
   bd sync
   ```

6. **Clean up git state** - Clear old stashes and prune dead remote branches:

   ```bash
   git stash clear
   git remote prune origin
   ```

7. **Verify clean state**:

   ```bash
   git status
   bd ready  # See what's ready to work on
   ```

8. **Choose a follow-up issue for next session**
   - Provide a prompt for the user to give to you in the next session
   - Format: "Continue work on bd-X: [issue title]. [Brief context about what's been done and what's next]"

**Key insight:** Closing beads too early creates false confidence. The next agent thinks work is done when it's not. A test that doesn't validate the requirement is useless. Be conservative. When in doubt, leave it open.

## Issue Tracking with bd (beads)

**IMPORTANT**: This project uses **bd (beads)** for ALL issue tracking. Do NOT use markdown TODOs, task lists, or other tracking methods.

### Why bd?

- Dependency-aware: Track blockers and relationships between issues
- Git-friendly: Auto-syncs to JSONL for version control
- Agent-optimized: JSON output, ready work detection, discovered-from links
- Prevents duplicate tracking systems and confusion

### Quick Start

**Check for ready work:**

```bash
bd ready --json
```

**Create new issues:**

```bash
bd create "Issue title" -t bug|feature|task -p 0-4 --json
bd create "Issue title" -p 1 --deps discovered-from:bd-123 --json
```

**Claim and update:**

```bash
bd update bd-42 --status in_progress --json
bd update bd-42 --priority 1 --json
```

**Complete work:**

```bash
bd close bd-42 --reason "Completed" --json
```

### Issue Types

- `bug` - Something broken
- `feature` - New functionality
- `task` - Work item (tests, docs, refactoring)
- `epic` - Large feature with subtasks
- `chore` - Maintenance (dependencies, tooling)

### Priorities

- `0` - Critical (security, data loss, broken builds)
- `1` - High (major features, important bugs)
- `2` - Medium (default, nice-to-have)
- `3` - Low (polish, optimization)
- `4` - Backlog (future ideas)

### Best Practices

- **One agent per module at a time.** Cross-module changes split into separate beads.
- Use `bd ready` to find unblocked work.
- Always update status to `in_progress` when starting work.
- Always use `--json` flag for programmatic use.
- Link discovered work with `discovered-from` dependencies.
- Check `bd ready` before asking "what should I work on?"

### Managing AI-Generated Planning Documents

AI assistants often create planning and design documents during development:

- PLAN.md, IMPLEMENTATION.md, ARCHITECTURE.md
- DESIGN.md, CODEBASE_SUMMARY.md, INTEGRATION_PLAN.md
- TESTING_GUIDE.md, TECHNICAL_DESIGN.md, and similar files

**Best Practice: Use a dedicated directory for these ephemeral files**

- Create a `history/` directory in the project root
- Store ALL AI-generated planning/design docs in `history/`
- Keep the repository root clean and focused on permanent project files
- Only access `history/` when explicitly asked to review past planning

**Benefits:**

- ✅ Clean repository root
- ✅ Clear separation between ephemeral and permanent documentation
- ✅ Easy to exclude from version control if desired
- ✅ Preserves planning history for archeological research
- ✅ Reduces noise when browsing the project

### Important Rules

- ✅ Use bd for ALL task tracking
- ✅ Always use `--json` flag for programmatic use
- ✅ Link discovered work with `discovered-from` dependencies
- ✅ Check `bd ready` before asking "what should I work on?"
- ✅ Store AI planning docs in `history/` directory
- ❌ Do NOT create markdown TODO lists
- ❌ Do NOT use external issue trackers
- ❌ Do NOT duplicate tracking systems
- ❌ Do NOT clutter repo root with planning documents

## Project Context: Standard Mode iOS Port

### Overview

This project is a **Wheel of Fortune practice app** with two game modes:

- **Kid Mode**: Simplified, kid-friendly version
- **Standard Mode**: Full adult experience with 24-wedge wheel, BANKRUPT/LOSE_TURN, vowel purchases, and puzzle solving

**Current focus: Port Standard Mode from web to iOS using React Native/Expo**

### Directory Structure

- `app/` - Web version (React, Tailwind CSS) - **reference implementation**
- `ios/` - React Native/Expo version - **in active development**
  - `src/engine/` - Shared game logic (reducer, types, RNG, puzzle packs)
  - `src/components/` - React Native UI components (wheel, keyboard, board, modals)
  - `src/styles/` - Theme configuration (colors, spacing, typography)
- `data/` - Puzzle packs and game data

### Known Issues & Blockers

#### Critical: Worklets Version Mismatch (Runtime Not Ready)

When running `npx expo start` in the `ios/` directory with Expo Go:

**Error:** `Mismatch between JavaScript part and native part of Worklets (0.7.1 vs 0.5.1)`

**Root cause:** Expo Go SDK 54 bundles react-native-reanimated 3.x with worklets 0.5.1. Any package trying to use a newer version causes this error.

**Attempted fixes:**
- ❌ Removed nativewind and tailwindcss (unused in Expo)
- ❌ Removed moti (animation library, not needed for standard wheel)
- ❌ Downgraded react-native-reanimated from ~4.1.1 to ~3.16.0
- ❌ Cleared caches: `npx expo start --clear`

**Current status:** 
- Package versions are aligned with Expo SDK 54 requirements
- `npm ls react-native-worklets` shows no direct dependencies
- **Next step:** Use `expo-dev-client` to create a custom development build instead of relying on Expo Go

**When to attempt again:**
- After trying `npx expo install --fix` to align all native module versions
- Or build a custom dev client: `npx expo run:ios --dev-client`
- Or wait for Expo SDK 55+ which may have updated worklets

#### Design: Standard Wheel Component

[StandardWheel.tsx](file:///Users/sjarmak/WheelOfFortune/ios/src/components/StandardWheel.tsx)

- Uses `react-native-svg` for 24-wedge wheel rendering (no animations, just rotation)
- Uses `react-native-reanimated` for smooth spin animation (Animated.View)
- Gesture handling with `react-native-gesture-handler` (swipe to spin)
- Haptic feedback for spin results and tick sounds during spin

**Important:** The wheel SVG is deterministic (not animated individually). Only the entire wheel container rotates.

### Next Agent Instructions

When working on the iOS Standard Mode port:

1. **Check running status first:**
   ```bash
   cd ios && npx expo start --clear
   ```
   If you see "runtime not ready" error → See "Known Issues & Blockers" above

2. **If you can't run the app:** Try custom dev client:
   ```bash
   npx expo run:ios --dev-client
   ```

3. **Reference the web version** (`app/src/App.tsx`) for:
   - Game logic patterns (already ported to `ios/src/engine/game.ts`)
   - UI/UX flow (you may need to adapt for mobile)
   - Test examples (web app doesn't have tests yet, but logic is proven)

4. **Focus areas for next work:**
   - ✅ Game reducer logic (fully ported from web)
   - ✅ Wheel component (working in isolation)
   - ❓ Integration testing (can't verify without running app)
   - ❓ iOS-specific optimizations (once app runs)
   - ❓ Kid Mode port (lower priority, web version exists)

5. **Testing:** Currently cannot run tests due to runtime issues. Once the app runs:
   ```bash
   npm test  # (when test suite is configured)
   ```

## Agent Best Practices

### General Rules

- NEVER start development servers for applications you're working on.
- Always verify your work with tests before closing beads.
- Keep commits focused and small.
- Write clear commit messages with test validation details.
- When in doubt about whether to close a bead, leave it open.
