# WheelOfFortune — Agent Operating Notes

> The **intention + failure-mode-prevention** layer for agents working in this repo.
> It holds only what lives nowhere else; everything general is referenced, not copied.

## What this project is

A Wheel of Fortune practice app: React Native/Expo iOS app (`ios/`) with a
parallel web build (`app/`), a Node/Zod puzzle-pack pipeline (`pipeline/`),
and a pure-functional seeded game engine shared *by duplication* between the
two apps. Three modes: Standard (wheel), Toss-Up, Bonus Round. Local storage
only.

Invariants a capable agent would otherwise get wrong:

- **The engine exists twice and must stay byte-identical.**
  `ios/src/engine/{game.ts,types.ts}` and `app/src/engine/{game.ts,types.ts}`
  are sha256-compared by `scripts/check-engine-drift.sh` (interim guardrail
  until extraction to `/shared/engine/`). Any engine edit lands in BOTH copies
  in the same commit; run the drift script before considering it done.
- **Puzzle packs are pipeline output, not hand-written.** `data/packs/*.json`
  use snake_case fields (`pack_id`, `round_type`, `normalized`, `source`
  provenance, content-hash puzzle `id`s used for dedupe) validated by
  `pipeline/src/schema.ts`. Regenerate via `cd pipeline && npm run ingest`;
  hand-edits break dedupe ids and stats.
- **`round_type` is a closed enum** — `MAIN | TOSSUP | BONUS` — and drives
  which game mode a puzzle can appear in. Don't invent new values without
  touching the Zod schema and both engines.
- **Persisted state is versioned.** `SCHEMA_VERSION = 2`; all hydration goes
  through `migrateState()` (`app/src/engine/schema.ts`) with Zod validation.
  Any change to the persisted GameState shape needs a version bump plus a
  migration path, never a silent shape change.
- **Determinism is a feature:** the engine uses seeded Mulberry32
  (`rng.ts`) for repeatable games. No `Math.random` in engine code.
- **Wheel label geometry is hand-tuned, platform-mirrored.** The web
  `StandardWheel` mirrors `ios/src/components/StandardWheel.tsx` scaled
  200→100 viewBox: −5° midAngle offset off the wedge bisector, per-label
  `startOffset` (35% $ values / 42% BANKRUPT / 50% LOSE A TURN), wedges at
  r=47 under the r=48 gold rim, no `lengthAdjust` (it stretched glyphs). If
  you touch wheel geometry on one platform, port it to the other (see commit
  `ac2cd5e`).
- README's mention of `archive/web-app/` is stale — that directory no longer
  exists. `app/` is the live web build (see `history/prd_ios_to_web_migration.md`).

## Failure-mode preventions

<!-- Append-only log of "don't do X here, it breaks Y" lessons from real
     incidents. One line each: the prevention, then the consequence it avoids.
     example:
- Don't run migrations against the read replica — it fails silently mid-batch.
-->

## Where to look (references)

- **Design principles (minimal diffs, tests per commit, naming):** `CLAUDE.md`
- **Setup, run commands, architecture overview:** `README.md`
- **Pack schema + ingest CLI:** `pipeline/src/schema.ts`, `pipeline/README.md`
- **Persisted-state schema/migration:** `app/src/engine/schema.ts`
- **Feature history:** `prd.json`, `tasks/`, `history/`
