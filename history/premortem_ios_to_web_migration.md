# Premortem: iOS → Web Migration

Synthesized from 5 independent failure-lens agents. Severity × Likelihood scoring: Critical(4), High(3), Medium(2), Low(1) × High(3), Medium(2), Low(1).

## 1. Risk Registry

| # | Failure Lens | Severity | Likelihood | Score | Root Cause | Top Mitigation |
|---|--------------|----------|------------|-------|------------|----------------|
| 1 | **Operational** — localStorage schema break crashes all returning users | Critical | High | 12 | Changed persisted `GameState` shape without version key or migration | Insert commit 3.5: schema version + `migrateState()` + `ErrorBoundary` + legacy fixture test |
| 2 | **Technical** — CSS `transitionend` unreliable on Safari → wheel hangs | Critical | High | 12 | Treated Reanimated worklets and CSS transitions as syntactically interchangeable when their completion semantics differ | Use Web Animations API `element.animate(...).finished` promise OR Promise.race with timeout fallback + dispatch-once guard |
| 3 | **Team/Process** — premature bead closure + broken tests rewritten | Critical | High | 12 | Bead closed with "validated manually" was treated as ground truth by downstream sessions | Require `Validated by: tests/<file>::<test>` in bd close reason; split each vertical slice into reducer + ui + e2e sub-beads |
| 4 | **Scope** — built parity when user wanted polish | High | High | 9 | Interpreted "look as good as iOS" as feature parity instead of visual refresh | 15-min user conversation before commit 1; reorder plan so dark theme ships at commit 2 |
| 5 | **Integration** — version drift + Safari textPath + Dependabot | High | High | 9 | Two package.jsons without shared lockfile; no WebKit CI; Dependabot re-activated when app/ unarchived | Pin exact versions in both apps; disable Dependabot on `app/` during migration; add Playwright WebKit test before commit 7; compute `<text>` positions manually (no `textPath startOffset` on web) |

## 2. Cross-Cutting Themes

Where multiple lenses independently surfaced the same vulnerability — these are the highest-confidence risks.

### Theme A: "Safari wasn't tested until too late"
- **Surfaced by**: Technical (transitionend drops on backgrounded tabs), Integration (textPath startOffset renders wrong), Operational (iPad Safari is implied deploy target)
- **Why the convergence matters**: three independent lenses found three *different* Safari-specific failures. The codebase already has evidence Safari-specific bugs bite (CLAUDE.md warns about Reanimated worklets; web `tts.ts` has voice-loading retry logic). Testing on desktop Chrome only = shipping a broken product.
- **Combined impact**: Game-stopping bugs visible only after deploy to real users. Critical severity.

### Theme B: "Persisted state + characterization snapshots can lock in bugs"
- **Surfaced by**: Technical (characterization tests didn't cover animation dispatch paths), Operational (localStorage hydration crashes), Team (tests rewritten instead of investigated when failing), Scope (round_type bug snapshotted as "canonical behavior")
- **Why it matters**: the characterization-test strategy depends on a foundational assumption — that the *current* web behavior is worth preserving. Four lenses each identified a way that assumption is wrong.
- **Combined impact**: Tests pass forever while the app is broken. Silent correctness failure.

### Theme C: "Solo + AI sessions lose state between turns"
- **Surfaced by**: Team (premature bead closure, wrong stack tested, parallel PRDs created), Scope (no user re-validation in 6 months)
- **Why it matters**: the developer is solo + AI-assisted. No human reviewer catches stale context. bd beads and `history/` PRDs are supposed to carry state but aren't used rigorously.
- **Combined impact**: Hidden work duplication, regressions, scope drift.

### Theme D: "Engine duplication drifts"
- **Surfaced by**: Technical (iOS fixes BONUS_TICK; web keeps the bug for weeks), Integration (puzzle JSON typos drift), Team (Session 1's Toss-Up divergence goes unnoticed for 6 days)
- **Why it matters**: the converged plan explicitly defers shared-engine extraction. Three lenses show that deferral has concrete cost.
- **Combined impact**: Ongoing stream of small regressions that erode user trust.

## 3. Mitigation Priority List

Ranked by (# of failure modes addressed) × (severity) ÷ (implementation cost).

| Priority | Mitigation | Addresses | Cost | Notes |
|----------|-----------|-----------|------|-------|
| **P0** | Add `ErrorBoundary` + hydration try/catch + `migrateState()` with schema version + Zod + legacy localStorage fixture test | Risks #1, #2 indirectly | Low | The single highest-leverage change. Maps to a new **commit 3.5**. |
| **P0** | Delete `app/dist/` from git, add to `.gitignore` | #1 | Trivial | Stale bundle shipping on deploy is a landmine unrelated to anything else. Do in commit 1 window. |
| **P0** | 15-min user conversation before commit 1 — confirm visual vs parity, FREE_PLAY, deploy target | #4 | Trivial (user time) | Single most likely to cause the project to fail *as specified*. |
| **P1** | Playwright WebKit smoke test in CI before commit 7 | #2, #5, Theme A | Medium | Shifts "Safari testing" from manual/never to automatic. |
| **P1** | `tests/characterization/SNAPSHOT_LOCK.md` with reducer SHA; forbid test rewrite without bd issue + investigation | Theme B, #3 | Low | Protocol change, no code change. |
| **P1** | Pin exact (not `^`) versions of vitest, framer-motion, zustand, lucide-*, react-native-svg in both package.jsons | #5 | Trivial | Prevents silent dependabot / snapshot drift. |
| **P1** | Split each vertical slice bead (commits 5, 6) into 3 sub-beads: reducer / ui / e2e. E2e bead requires Playwright test on `localhost:5173` | #3, Theme C | Low | Forces testable increments. |
| **P2** | Disable Dependabot on `app/` during migration; re-enable with security-only allow-list after commit 9 | #5 | Trivial | One line in `.github/dependabot.yml`. |
| **P2** | Pull commit 9 (extract `/shared/engine/`) forward to between commits 4 and 5 | Theme D | Medium | Reverses a converged-plan decision — requires user confirmation, since Phase 2 debate deliberately deferred this. |
| **P2** | Stack banner on web dev build ("WEB — localhost:5173") to prevent cross-stack testing | #3 | Trivial | 3-line component. |
| **P2** | Accessibility contrast gate on dark theme (commit 8) for kid-mode screens | #4 | Low | iOS's color tradeoffs don't auto-transfer to web kid audience. |
| **P2** | Session-start checklist in `history/SESSION_START.md`: `bd list --closed --since 7d`, `git log main..HEAD`, read active PRD | Theme C | Low | Process artifact. |

## 4. Design Modification Recommendations

**Top 5 changes to the 9-commit plan, in order:**

### Mod 1 — Insert "Commit 0": User-intent conversation
**Change**: Before any code commits, ask the user 3 questions explicitly:
1. "Do you want web to play *exactly* like iOS, or do you want a visual refresh with kid-mode remaining the headline?"
2. "Who uses the web app? On what browser/device?"
3. "Do you want FREE_PLAY restored on iOS? This is a one-way game-design decision."

**Addresses**: Risk #4 (Scope).
**Effort**: 15 min user time. Blocks nothing if user is available.
**Dissent**: Risk-Mitigator's premortem argued the real ask might be "merge ralph branch to main so GitHub reflects current work" and that's a 5-minute task.

### Mod 2 — Insert "Commit 1.5": Safety infrastructure
**Change**: After R3 fix but before characterization tests, add:
- Delete `app/dist/` from git tracking + `.gitignore` it
- Add `ErrorBoundary` around `<App />` in `main.tsx` with "Reset game data" button
- Wrap localStorage hydration in `App.tsx` with try/catch that calls `resetState()` on parse failure
- Disable Dependabot on `app/` (1-line config change)

**Addresses**: Risks #1, #5.
**Effort**: ~30 min. No code logic changes, pure scaffolding.

### Mod 3 — Insert "Commit 3.5": Schema migration harness
**Change**: Before the reducer port (commit 4), add:
- `SCHEMA_VERSION` constant (start at `2`, treat any older/missing version as legacy)
- `migrateState(raw: unknown): GameState | null` with Zod schema for the new shape
- Fixture test: `app/tests/fixtures/legacy-wof-state.json` captured from the actual archived build, asserting migration returns `null` (fresh game) without throwing
- Hydration code in `App.tsx` consumes `migrateState()` and falls back to `INITIAL_STATE` on failure

**Addresses**: Risk #1 (highest-severity risk in the registry).
**Effort**: 1–2 hr. Blocker for commit 4.

### Mod 4 — Insert "Commit 6.5": WebKit CI gate
**Change**: Before the StandardWheel port, add Playwright config with WebKit (Safari engine) as a test target. One smoke test: `spin wheel 5 times, each spin must dispatch SPIN_COMPLETE within 4500ms`. Runs on every commit that touches `app/src/components/StandardWheel.tsx` or `app/src/engine/game.ts`.

**Addresses**: Risk #2, Risk #5, Theme A.
**Effort**: 2–4 hr (Playwright setup + one test). Can be skipped if the project is desktop-only — but then Mod 1 must confirm that.

### Mod 5 — Rewrite commit 7 (StandardWheel) with animation semantics in mind
**Change**:
- Split into **7a** (geometry, wedge fills, static SVG — no animations) and **7b** (spin animation + text labels)
- For spin completion: use `element.animate(...).finished` Promise from Web Animations API (stable in all modern browsers), not CSS `transitionend` event. Guards against event drop under compositor throttling.
- For radial text: compute per-glyph `<text x y rotate>` positions in JavaScript. Do NOT use `<textPath startOffset>` on web — Safari rendering differs from react-native-svg.
- Dispatch-once guard: key `SPIN_COMPLETE` by a `spinId` so rapid clicks can't double-dispatch.

**Addresses**: Risk #2.
**Effort**: Adds ~0.5 day to original 1-day estimate.

---

### Modifications NOT recommended (debate-tested, low ROI)

- **Pulling commit 9 (extract /shared/engine/) forward** — Technical agent recommended this, but Phase 2 debate deliberately deferred it. Drift risk is real (Theme D) but can be mitigated cheaper via a CI diff check: a script that hashes `ios/src/engine/game.ts` and `app/src/engine/game.ts` and warns if they diverge. That's ~10 lines of bash, not a refactor.
- **Framework switch** (Zustand → useReducer) — Technical agent flagged a Strict Mode interop concern. Probably overblown — one integration test in commit 4 exercising concurrent dispatches settles it. Don't rewrite the state layer.

## 5. Full Failure Narratives

### Lens 1: Technical Architecture Failure
**Severity: Critical / Likelihood: High**

The "Direct RN→DOM substitution" principle treated Reanimated worklets and CSS transitions as interchangeable animation primitives, when in fact Reanimated guarantees completion callbacks on the UI thread while CSS `transitionend` is a best-effort DOM event that iOS Safari drops under compositor pressure. By commit 7, the wheel hung ~30% of the time on real iPhones. Three fixes — setTimeout fallback (race conditions), Zustand/useReducer split (Strict Mode double-invoke), rAF polling (battery drain) — all failed. Duplicated engine drift (iOS fixed BONUS_TICK off-by-one in October; web kept the bug for 6 weeks) compounded the issue.

### Lens 2: Integration & Dependency Failure
**Severity: High / Likelihood: High**

Version drift compounded: vitest 4.0.16 vs 4.0.18 rewrote snapshots silently; Dependabot re-activated on `app/` unarchive and bumped framer-motion 10→11, breaking SolveModal exit animations; Safari 17 rendered `<textPath startOffset="50%">` at path origin instead of midpoint, stacking all wedge labels at 12 o'clock. The developer tested only in desktop Chrome. By the time real iPad Safari testing happened, the wheel was merged and the abstraction had to be unraveled.

### Lens 3: Operational Failure
**Severity: Critical / Likelihood: High**

Commit 4 changed persisted `GameState` shape without a version key. On October 14, 2026, every returning user (~2,100 based on 404-log differential) hit a blank white screen: `TypeError: Cannot read properties of undefined (reading 'round_type')`. No error tracking caught it; the developer learned via Twitter DM six days in. Compounded by: `app/dist/` tracked in git shipped stale bundles; no `ErrorBoundary`; manual testing always done in fresh incognito sessions.

### Lens 4: Scope & Requirements Failure
**Severity: High / Likelihood: High**

User said "the web app doesn't look as good as iOS" — meant visual refresh. Plan delivered feature parity instead. After 6 months of porting Toss-Up, Bonus Round, PackBrowser, and mustSpin, the user demoed: "where's the MusicRoom button? My niece used to just hit that right from the home screen." Kid-mode extras were "preserved" but buried two layers deep behind an iOS-style Standard/Kid mode toggle. The dark theme's low-contrast wedge labels were unreadable on an old iPad. FREE_PLAY was restored to iOS without user confirmation, changing iOS gameplay behavior.

### Lens 5: Team & Process Failure
**Severity: Critical / Likelihood: High**

Session 1 closed bd-US-007 (Toss-Up) with "validated manually" after testing in the wrong stack (iOS sim instead of web vite server). Session 2 built Bonus Round on top. Session 3 discovered the reveal timer was broken — Session 1 had missed that web `TICK` was the pre-R3 shape. Session 4 disabled the failing characterization tests as "stale." By late May, branch had 41 commits, no passing characterization suite, two competing PRDs (`prd_ios_to_web_migration.md` + `prd_recovery_v2.md`), and Session 7 started fresh on commit 7 (StandardWheel) without reading either PRD. The user stopped opening the project.

---

## Recommended revised commit order (post-premortem)

0. **User conversation** (15 min, Mod 1)
1. R3 fix — `getPuzzlesForMode` in App.tsx (15 min)
1.5. **Safety infrastructure** — ErrorBoundary, delete tracked dist, disable Dependabot, stack banner (30 min, Mod 2)
2. Characterization tests + SNAPSHOT_LOCK.md + pinned snapshot format (1.5 hr)
3. Restore FREE_PLAY to iOS — **conditional on Mod 1 answer** (30 min)
3.5. **Schema migration harness** — Zod + migrateState + legacy fixture (1–2 hr, Mod 3)
4. Port iOS reducer deltas to web in-place, piecemeal per action (2 hr)
5. Toss-Up vertical slice — split into 5a (reducer), 5b (UI), 5c (e2e Playwright) (2 days total)
6. Bonus Round vertical slice — same 3-bead split (2 days total)
6.5. **Playwright WebKit CI gate** (3 hr, Mod 4)
7a. StandardWheel geometry + wedge fills (0.5 day)
7b. Spin animation (Web Animations API `.finished`) + radial labels (computed `<text>` positions) + dispatch-once (1 day, Mod 5)
8. Dark theme + home mode selector + accessibility contrast gate (0.5 day + 2 hr)
9. Extract `/shared/engine/` — deferred conditionally. Cheap CI drift-check substitute: 10-line bash diff script.

**Delta vs original plan**: +5 new sub-commits, +~5 hr total work, dramatically reduced risk of the top 3 failure modes.
