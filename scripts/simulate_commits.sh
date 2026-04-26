#!/usr/bin/env bash
# =============================================================================
# Part A: CI optimisation simulation
# 50 commits: 35 source changes + 15 documentation changes
# Triggers: baseline, cached, swc (50 runs), path-filter (35 runs)
# Total: ~185 workflow runs
#
# Usage: bash scripts/simulate_commits.sh
# Do not interrupt – data is sent to GMT after each run
# =============================================================================
set -euo pipefail

WAIT=45  # seconds between commits

# Branch check – must run from ci-sim branch
EXPECTED_BRANCH="ci-sim"
CURRENT_BRANCH=$(git branch --show-current)
if [[ "$CURRENT_BRANCH" != "$EXPECTED_BRANCH" ]]; then
  echo "ERROR: This script must be run from the '$EXPECTED_BRANCH' branch"
  echo "Current branch: $CURRENT_BRANCH"
  echo ""
  echo "Run first:"
  echo "  git checkout main && git pull origin main"
  echo "  git checkout -b $EXPECTED_BRANCH"
  exit 1
fi

# Ensure docs folder exists
mkdir -p docs
touch README.md

# Start time
START_TIME=$(date '+%Y-%m-%d %H:%M:%S')
START_EPOCH=$(date +%s)

echo "============================================="
echo "  Part A simulation starting"
echo "  Start time: ${START_TIME}"
echo "  Wait:       ${WAIT}s per commit"
echo "  Est. duration: ~$(( 50 * WAIT / 60 )) minutes"
echo "============================================="
echo ""

# -----------------------------------------------------------------------------
# Phase 1/2: 35 source changes
# Triggers: ci-baseline, ci-cached, ci-swc, ci-path-filter
# -----------------------------------------------------------------------------
echo "=== Phase 1/2: 35 source changes (all 4 workflows) ==="

for i in $(seq 1 35); do
  if (( i % 3 == 0 )); then
    echo "// sim commit $i - $(date)" >> src/orders/orders.service.ts
  elif (( i % 3 == 1 )); then
    echo "// sim commit $i - $(date)" >> src/products/products.service.ts
  else
    echo "// sim commit $i - $(date)" >> src/users/users.service.ts
  fi

  git add .
  git commit -m "feat: source update [$i/35]"
  git push origin ci-sim
  echo "  Commit $i/35 done – waiting ${WAIT}s"
  sleep $WAIT
done

echo ""
echo "=== Phase 1/2 complete: 35 source changes done ==="
echo ""

# -----------------------------------------------------------------------------
# Phase 2/2: 15 documentation changes
# Triggers: ci-baseline, ci-cached, ci-swc
# Does NOT trigger: ci-path-filter (skip mechanism B)
# -----------------------------------------------------------------------------
echo "=== Phase 2/2: 15 documentation changes (path-filter skips these) ==="

for i in $(seq 1 15); do
  echo "<!-- doc update $i - $(date) -->" >> README.md
  git add .
  git commit -m "docs: update readme [$i/15]"
  git push origin ci-sim
  echo "  Docs commit $i/15 done – waiting ${WAIT}s"
  sleep $WAIT
done

# End time
END_TIME=$(date '+%Y-%m-%d %H:%M:%S')
END_EPOCH=$(date +%s)
DURATION=$(( END_EPOCH - START_EPOCH ))
DURATION_MIN=$(( DURATION / 60 ))
DURATION_SEC=$(( DURATION % 60 ))

echo ""
echo "============================================="
echo "  Part A simulation complete"
echo "  Start:    ${START_TIME}"
echo "  End:      ${END_TIME}"
echo "  Duration: ${DURATION_MIN}m ${DURATION_SEC}s"
echo "============================================="
echo ""
echo "Expected run counts:"
echo "  ci-baseline:    50 runs"
echo "  ci-cached:      50 runs"
echo "  ci-swc:         50 runs"
echo "  ci-path-filter: 35 runs  (15 docs commits skipped)"
echo "  Total:         185 runs"
echo ""
echo "Use these times for analysis:"
echo "  SIM_A_START=${START_TIME}"
echo "  SIM_A_END=${END_TIME}"
echo ""
echo "Check data at:"
echo "  https://metrics.green-coding.io/ci-index.html"
