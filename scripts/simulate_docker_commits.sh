#!/usr/bin/env bash
# =============================================================================
# Part B: Docker image comparison simulation
# 40 commits: all source changes
# Triggers: docker-full, docker-slim, docker-alpine, docker-multistage (40 runs each)
# Total: ~160 workflow runs
#
# Usage: bash scripts/simulate_docker_commits.sh
# Do not interrupt – data is sent to GMT after each run
# Note: Docker builds take longer – wait time is higher than Part A
# =============================================================================
set -euo pipefail

WAIT=240  # seconds between commits (Docker builds take ~4-6 min)

# Branch check – must run from docker-sim branch
EXPECTED_BRANCH="docker-sim"
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

# Start time
START_TIME=$(date '+%Y-%m-%d %H:%M:%S')
START_EPOCH=$(date +%s)

echo "============================================="
echo "  Part B Docker simulation starting"
echo "  Start time:    ${START_TIME}"
echo "  Wait:          ${WAIT}s per commit"
echo "  Est. duration: ~$(( 40 * WAIT / 60 )) minutes"
echo "============================================="
echo ""

# -----------------------------------------------------------------------------
# 40 source changes
# Triggers: docker-full, docker-slim, docker-alpine, docker-multistage
# Changes distributed across three modules
# -----------------------------------------------------------------------------
echo "=== 40 source changes (all 4 Docker workflows) ==="

for i in $(seq 1 40); do
  if (( i % 3 == 0 )); then
    echo "// docker-sim commit $i - $(date)" >> src/orders/orders.service.ts
  elif (( i % 3 == 1 )); then
    echo "// docker-sim commit $i - $(date)" >> src/products/products.service.ts
  else
    echo "// docker-sim commit $i - $(date)" >> src/users/users.service.ts
  fi

  git add .
  git commit -m "feat: docker simulation commit [$i/40]"
  git push origin docker-sim
  echo "  Commit $i/40 done – waiting ${WAIT}s"
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
echo "  Part B simulation complete"
echo "  Start:    ${START_TIME}"
echo "  End:      ${END_TIME}"
echo "  Duration: ${DURATION_MIN}m ${DURATION_SEC}s"
echo "============================================="
echo ""
echo "Expected run counts:"
echo "  docker-full:        40 runs"
echo "  docker-slim:        40 runs"
echo "  docker-alpine:      40 runs"
echo "  docker-multistage:  40 runs"
echo "  Total:             160 runs"
echo ""
echo "Use these times for analysis:"
echo "  SIM_B_START=${START_TIME}"
echo "  SIM_B_END=${END_TIME}"
echo ""
echo "Check data at:"
echo "  https://metrics.green-coding.io/ci-index.html"
