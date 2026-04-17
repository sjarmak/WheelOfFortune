#!/usr/bin/env bash
# check-engine-drift.sh
#
# Interim guardrail (per PRD commit 9) until the game engine is extracted to
# /shared/engine/. Compares sha256 hashes of the iOS and web-app engine sources
# (game.ts + types.ts) and warns when they have drifted.
#
# Exit 0 when all pairs match, nonzero otherwise. Uses `shasum -a 256` so it
# works on macOS (darwin) as well as Linux.

set -u

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PAIRS=(
  "ios/src/engine/game.ts:app/src/engine/game.ts"
  "ios/src/engine/types.ts:app/src/engine/types.ts"
)

status=0
for pair in "${PAIRS[@]}"; do
  ios_path="${REPO_ROOT}/${pair%%:*}"
  app_path="${REPO_ROOT}/${pair##*:}"
  if [[ ! -f "$ios_path" || ! -f "$app_path" ]]; then
    echo "WARN: missing file(s) for pair ${pair} (ios=${ios_path} app=${app_path})"
    status=1
    continue
  fi
  ios_hash="$(shasum -a 256 "$ios_path" | awk '{print $1}')"
  app_hash="$(shasum -a 256 "$app_path" | awk '{print $1}')"
  if [[ "$ios_hash" == "$app_hash" ]]; then
    echo "OK: ${pair} identical (${ios_hash})"
  else
    echo "WARN: engine drift detected for ${pair}"
    echo "  ios: ${ios_hash}  ${ios_path}"
    echo "  app: ${app_hash}  ${app_path}"
    status=1
  fi
done

if [[ $status -ne 0 ]]; then
  echo "WARN: engine files have diverged — extract to /shared/engine/ to eliminate drift."
fi

exit $status
