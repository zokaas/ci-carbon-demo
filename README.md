# ci-carbon-demo

> Bachelor's thesis demo — Haaga-Helia 2026  
> **"Vastuullinen ohjelmistokehitys: CI/CD-putken hiilijalanjäljen mittaaminen ja optimointi"**

Measuring and comparing the carbon footprint of CI/CD pipeline configurations using Eco CI and Green Metrics Tool.

![Node](https://img.shields.io/badge/Node.js-22-339933?logo=nodedotjs&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-enabled-2496ED?logo=docker&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green)

---

## Research design

This project runs two separate measurement simulations. Each simulation uses a dedicated Git branch to ensure only the intended workflows are triggered — keeping the measurement data clean and reproducible.

| Part | Question | Branch | Expected runs |
|------|----------|--------|---------------|
| **A – CI optimisation** | How much do caching, SWC and path filtering save? | `ci-sim` | 185 |
| **B – Docker comparison** | Which base image is most carbon-friendly? | `docker-sim` | 160 |

---

## Workflows

### Part A – CI optimisation

Four workflows run on every push to `ci-sim`. Each represents a different optimisation strategy:

| Workflow | Mechanism | What changes |
|----------|-----------|--------------|
| `ci-baseline` | None | Reference point – no optimisations |
| `ci-cached` | Cache npm dependencies | Install step is faster on repeated runs |
| `ci-swc` | SWC compiler instead of tsc | Build step is faster (Rust-based transpiler) |
| `ci-path-filter` | Skip run on docs-only changes | Fewer total runs – 15 out of 50 commits are skipped |

E2e-tests (`npm run test:e2e`) seed the in-memory database with 1000 products, users and orders before each test suite via `SeedService`. This gives the test step a realistic, non-trivial workload so the energy difference between caching, SWC and the unoptimised baseline is measurable rather than buried in noise.

### Part B – Docker images

Four workflows run on every push to `docker-sim`. Each builds and runs a different Docker image:

| Workflow | Base image | Strategy | Expected build energy |
|----------|-----------|----------|-----------------------|
| `docker-full` | `node:22` | Single-stage, full Debian | Highest |
| `docker-slim` | `node:22-slim` | Single-stage, trimmed Debian | Lower |
| `docker-alpine` | `node:22-alpine` | Single-stage, minimal Alpine | Low |
| `docker-multistage` | `node:22 → node:22` | Build and runtime separated, same base as `docker-full` to isolate the effect of multi-stage structure | Comparable build, smaller runtime image than `docker-full` |

Each Docker workflow measures two steps separately:
- **`docker-build`** – energy consumed building the image
- **`docker-run`** – energy consumed starting the container and running a smoke test

---

## Measurement pipeline

```
git push
    ↓
GitHub Actions workflow triggers
    ↓
Eco CI estimates energy (CPU model × utilisation × duration)
    ↓
Data sent to Green Metrics Tool API
    ↓
analyze_results.mjs fetches and analyses the data
```

CO₂ is calculated two ways:
- **Runner location** – real-time carbon intensity from ElectricityMaps (gCO₂eq/kWh at time of run)
- **Finland average** – 66 gCO₂eq/kWh (ElectricityMaps flow-traced annual average 2025)

---

## Quick start

Requires **Node.js 22+** (see `engines` field in `package.json`).

```bash
git clone https://github.com/zokaas/ci-carbon-demo.git
cd ci-carbon-demo
npm install
npm run test        # unit tests
npm run test:e2e    # end-to-end tests
npm run build       # TypeScript build
npm run start:dev   # start locally on port 3000
```

**Required GitHub secret** — add before running any simulation:

| Secret | Description |
|--------|-------------|
| `ELECTRICITYMAPS_API_TOKEN` | ElectricityMaps API key for real-time carbon intensity data |

Settings → Secrets and variables → Actions → New repository secret

---

## Environment variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

After running each simulation, open `.env` and fill in the `SIM_A_START`/`SIM_A_END` and `SIM_B_START`/`SIM_B_END` timestamps that the simulation script prints. Use ISO 8601 (`YYYY-MM-DDTHH:MM:SSZ`).

The `.env` file is consumed natively by Node.js (≥ 20.6) via the `--env-file` flag — no extra packages required. See "Running the analysis" below.

---

## Running simulations

> ⚠️ **Important:** Each simulation must run from its own branch.
> This prevents CI workflows from triggering during the Docker simulation and vice versa.
> Running from the wrong branch will mix the measurement data and make analysis unreliable.
> The simulation scripts check the current branch and exit with an error if it is wrong.

---

### Part A – CI optimisation (~38 minutes)

50 commits: 35 source changes + 15 documentation changes.
Documentation changes are used to trigger the path-filter skip mechanism.

```bash
# 1. Make sure main is up to date
git checkout main
git pull origin main

# 2. Create and switch to the simulation branch
git checkout -b ci-sim

# 3. Run the simulation
bash scripts/simulate_commits.sh

# 4. Note the start and end times printed by the script — you will need them for analysis
```

Expected results:
```
ci-baseline:    50 runs
ci-cached:      50 runs
ci-swc:         50 runs
ci-path-filter: 35 runs  (15 docs commits skipped)
Total:         185 runs
```

---

### Part B – Docker comparison (~160 minutes)

40 commits: all source changes, all four Docker workflows trigger on every commit.

```bash
# 1. Make sure main is up to date
git checkout main
git pull origin main

# 2. Create and switch to the simulation branch
git checkout -b docker-sim

# 3. Run the simulation (consider running overnight)
bash scripts/simulate_docker_commits.sh

# 4. Note the start and end times printed by the script
```

Expected results:
```
docker-full:        40 runs
docker-slim:        40 runs
docker-alpine:      40 runs
docker-multistage:  40 runs
Total:             160 runs
```

---

## Verifying data in Green Metrics Tool

After each simulation, verify that data has been recorded before running the next simulation.

```
https://metrics.green-coding.io/ci-index.html
```

Search for: `zokaas/ci-carbon-demo`

Check that:
- All expected workflows appear in the list
- Each run shows energy data (Joules) and CO₂ values
- The `docker-build` and `docker-run` labels appear separately in Docker runs

If data is missing, do not proceed to the next simulation — check the workflow logs in GitHub Actions first.

---

## Running the analysis

After both simulations are complete and you have filled the timestamps into `.env` (see "Environment variables"), run the analysis script from the `main` branch:

```bash
git checkout main
node --env-file=.env scripts/analyze_results.mjs
```

The script produces a full statistical report including:
- Mean and median energy consumption per workflow
- 95% confidence intervals (CLT approximation, requires n ≥ 30)
- Cliff's delta effect sizes for all workflow pairs
- CO₂ estimates using both runner carbon intensity and Finland average
- Docker overhead compared to ci-baseline
- Number of runs skipped by path-filter and estimated energy saved

---

## Reproducing the study

1. Fork or clone the repository
2. Add the `ELECTRICITYMAPS_API_TOKEN` secret to your GitHub repository
3. Run Part A from a fresh `ci-sim` branch
4. Verify data in GMT dashboard
5. Run Part B from a fresh `docker-sim` branch
6. Verify data in GMT dashboard
7. Run `analyze_results.mjs` with the recorded time windows

All simulation and analysis code is open source and available in `scripts/`.

---

## License

MIT

---

## Tools

| Tool | Purpose | Link |
|------|---------|------|
| **Eco CI** | Estimates energy consumption of GitHub Actions runs. Uses a CPU power model based on the runner's processor, utilisation and duration. Does not require hardware access — works on shared cloud runners. | [GitHub](https://github.com/green-coding-solutions/eco-ci-energy-estimation) |
| **Green Metrics Tool (GMT)** | Receives and stores measurement data sent by Eco CI after each workflow run. Provides a REST API for fetching run data and measurements for analysis. | [Dashboard](https://metrics.green-coding.io) · [API docs](https://api.green-coding.io/docs) |
| **ElectricityMaps** | Provides real-time and historical carbon intensity data per electricity grid zone. Used by Eco CI to calculate CO₂ estimates at the time and location of each run. | [Methodology](https://www.electricitymaps.com/methodology) |

### Statistical methods

| Method | Purpose |
|--------|---------|
| **Mean + median** | Central tendency. If they differ significantly, the distribution is skewed. |
| **95% confidence intervals** | Statistical significance — non-overlapping intervals indicate a meaningful difference between workflows. Based on CLT approximation (requires n ≥ 30). |
| **Cliff's delta** | Effect size — how large is the practical difference? Non-parametric, does not assume normal distribution. Scale: negligible < 0.147, small < 0.33, medium < 0.474, large ≥ 0.474 (Romano et al. 2006). |
<!-- doc update 1 - Sat May  9 13:45:19 EEST 2026 -->
<!-- doc update 2 - Sat May  9 13:47:21 EEST 2026 -->
<!-- doc update 3 - Sat May  9 13:49:22 EEST 2026 -->
<!-- doc update 4 - Sat May  9 13:51:23 EEST 2026 -->
<!-- doc update 5 - Sat May  9 13:53:25 EEST 2026 -->
<!-- doc update 6 - Sat May  9 13:55:26 EEST 2026 -->
<!-- doc update 7 - Sat May  9 13:57:29 EEST 2026 -->
<!-- doc update 8 - Sat May  9 13:59:31 EEST 2026 -->
<!-- doc update 9 - Sat May  9 14:01:32 EEST 2026 -->
<!-- doc update 10 - Sat May  9 14:03:34 EEST 2026 -->
<!-- doc update 11 - Sat May  9 14:05:35 EEST 2026 -->
<!-- doc update 12 - Sat May  9 14:07:37 EEST 2026 -->
<!-- doc update 13 - Sat May  9 14:09:38 EEST 2026 -->
