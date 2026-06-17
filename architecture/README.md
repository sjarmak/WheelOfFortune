# Architecture diagram (LikeC4)

Architecture-as-code model of the **Wheel Practice App**, rendered with
[LikeC4](https://likec4.dev). The model is the source of truth across
[`spec.c4`](spec.c4) (element kinds, tags, deployment node kinds),
[`model.c4`](model.c4) (the system), and [`views.c4`](views.c4) (structure,
walkthrough, and risk views), with the deployment model in
[`deployment.c4`](deployment.c4). The narrative companions are the repo-root
[`README.md`](../README.md) and the agent operating notes in
[`AGENTS.md`](../AGENTS.md).

Every element `link`s to its source (`pipeline/…`, `app/…`, `ios/…`) so any box
in the explorer is one click from the code behind it.

## What this models

A seeded, fully-offline Wheel of Fortune trainer with three parts:

- a **Node / Zod puzzle pipeline** (`pipeline/`) that turns raw sources (Kaggle
  CSVs, the Buy-A-Vowel compendium, text/JSON) into validated, content-hashed
  pack JSON;
- a **React + Vite web app** (`app/`) — the active migration target; and
- a **React Native / Expo iOS app** (`ios/`) — the improvement source being
  ported to web.

A pure-functional, seeded **game engine** is shared **by duplication** between
the two apps and kept byte-identical by an interim drift guard
([`scripts/check-engine-drift.sh`](../scripts/check-engine-drift.sh)) until it is
extracted to `/shared/engine/`.

## Delivery state is tagged, not guessed

Every element carries a tag so **in-flight and planned work renders distinctly
from what already ships** (legend in `spec.c4`):

| Tag | Meaning | Render |
|---|---|---|
| `#built` | code path exists, is exercised, has tests | solid |
| `#evolving` | built, but the contract is still moving (migration in flight) | solid |
| `#planned` | designed (PRD requirement); no code yet | **dashed, dimmed** |
| `#research` | speculative track | **dashed, indigo** |

Planned items in the model: the `/shared/engine/` extraction that retires the
duplicate-and-drift-guard scheme (migration PRD R1).

## Views

**Structure** — the static map:

| View | Scope |
|---|---|
| `index` | system landscape — the app in context of raw puzzle sources and per-device platform APIs |
| `wofSystem` | the system decomposed into containers (pipeline, engine, web app, iOS app, planned shared engine) |
| `pipelineContainer` | pipeline internals — acquire / adapters / normalize / dedupe / difficulty / pack assembly |
| `engineContainer` | the duplicated game engine — reducer, kid reducer, seeded RNG, packs, persistence, learning, tts |
| `webContainer` | web app (`app/`) — shell + screens, Standard-mode UI, Kid-mode UI, tests |
| `iosContainer` | iOS app (`ios/`) — StandardModeApp shell, native components, AsyncStorage, tests |
| `planned` | the shared-engine extraction in context, with built dependencies dimmed |
| `deployment` | where each piece runs — build-time pipeline → packs bundled into two on-device clients |

**Walkthrough flows** (dynamic / numbered-step views) — the narrative spine for
a design-review walkthrough:

| View | Flow |
|---|---|
| `buildPack` | building a puzzle pack from raw sources (acquire → adapt → normalize → dedupe → score → validate → write) |
| `standardRound` | a Standard-mode round on the web (pick pack → spin → guess/buy → solve → persist) |
| `kidSession` | a penalty-free Kid-mode session with phonics/suggestion helpers and TTS |

**Risk lens:**

| View | Scope |
|---|---|
| `risks` | the `#risk`-flagged elements with each open question stated in-box (engine duplication/drift, the not-yet-created `/shared/engine/`) |

### Running the walkthrough

For a design review, present in this order: `index` → `wofSystem` (orient on
structure) → the three walkthrough flows in sequence (what actually happens) →
`deployment` (where it runs) → `risks` (what to probe) → `planned` (what's next).
In `npx likec4 start`, the dynamic views animate step-by-step and each view's
notes panel carries the gotchas (the determinism guarantee, the
duplicate-engine drift guard, local-only persistence).

## Viewing & regenerating

```bash
# Interactive, hot-reloading explorer (recommended)
npx likec4 start architecture

# Validate the model (strict — the source of truth for correctness)
npx likec4 validate architecture
```

### Viewing the interactive explorer over SSH (headless remote)

`likec4 start` serves a Vite dev server on `localhost:5173`. From a headless
remote, forward that port to your laptop and open it locally — three options,
easiest first:

1. **VS Code / Cursor Remote-SSH** — run `npx likec4 start architecture` in the
   integrated terminal; the editor auto-forwards 5173 and offers "Open in
   Browser". Nothing else to configure.
2. **SSH local port-forward** — on your laptop:
   ```bash
   ssh -N -L 5173:localhost:5173 user@remote   # leave running
   ```
   then on the remote `npx likec4 start architecture` and open
   <http://localhost:5173> locally. (Already in an SSH session? Add the tunnel
   without reconnecting: press `~C` then type `-L 5173:localhost:5173`.)
3. **Bind + reach directly** — `npx likec4 start architecture --listen 0.0.0.0`
   and browse to `http://<remote-ip>:5173` (only if that port is reachable /
   firewall-open; the tunnel in option 2 is safer).
