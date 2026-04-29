#!/usr/bin/env node
// =============================================================================
// analyze_results.mjs – GMT API data fetch and statistical analysis
//
// Usage:
//   node --env-file=.env scripts/analyze_results.mjs
//
// Or inline:
//   REPO=zokaas/ci-carbon-demo \
//   SIM_A_START=2026-04-26T18:00:00Z SIM_A_END=2026-04-26T22:00:00Z \
//   SIM_B_START=2026-04-27T08:00:00Z SIM_B_END=2026-04-27T14:00:00Z \
//   node scripts/analyze_results.mjs
// =============================================================================

import { writeFileSync, mkdirSync } from 'node:fs';

const REPO = process.env.REPO || 'zokaas/ci-carbon-demo';
const GMT_API = 'https://api.green-coding.io';
const GH_API = 'https://api.github.com';
const FINLAND_CI = 66;

const SIM_A_START = process.env.SIM_A_START;
const SIM_A_END = process.env.SIM_A_END;
const SIM_B_START = process.env.SIM_B_START;
const SIM_B_END = process.env.SIM_B_END;

const CI_BRANCH = process.env.CI_BRANCH || 'ci-sim';
const DOCKER_BRANCH = process.env.DOCKER_BRANCH || 'docker-sim';

const CI_WORKFLOWS = ['ci-baseline', 'ci-cached', 'ci-swc', 'ci-path-filter'];
const DOCKER_WORKFLOWS = ['docker-full', 'docker-slim', 'docker-alpine', 'docker-multistage'];
const CI_LABELS = ['install', 'lint-typecheck', 'test-suite', 'build'];
const DOCKER_LABELS = ['docker-build', 'docker-run'];

const RAW_HEADERS = [
  'run_id',
  'timestamp',
  'workflow',
  'label',
  'energy_j',
  'duration_s',
  'carbon_intensity',
  'intensity_source',
  'co2_runner_g',
  'co2_finland_g',
  'cpu_pct',
];

// =============================================================================
// API functions
// =============================================================================

async function fetchWorkflowIds(repo) {
  const res = await fetch(`${GH_API}/repos/${repo}/actions/workflows`, {
    headers: { Accept: 'application/vnd.github+json' },
  });
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  const data = await res.json();
  return Object.fromEntries(data.workflows.map((wf) => [wf.name, wf.id]));
}

async function fetchGmtData(repo, branch, workflowId, startDate, endDate) {
  const params = new URLSearchParams({
    repo,
    branch,
    workflow: String(workflowId),
    start_date: startDate.split('T')[0],
    end_date: endDate.split('T')[0],
  });
  const res = await fetch(`${GMT_API}/v1/ci/measurements?${params}`);
  if (!res.ok) throw new Error(`GMT API error: ${res.status}`);
  const data = await res.json();
  if (!data.success) throw new Error(`GMT: ${JSON.stringify(data)}`);
  return data.data || [];
}

// =============================================================================
// Data processing
// =============================================================================

function groupByRun(rows) {
  const runs = {};
  for (const [
    energy_uj,
    run_id,
    timestamp,
    label,
    ,
    ,
    duration_us,
    ,
    cpu_pct,
    ,
    ,
    ,
    ,
    carbon_intensity,
    co2_ug,
  ] of rows) {
    if (!runs[run_id]) runs[run_id] = { timestamp, measurements: {} };
    runs[run_id].measurements[label] = {
      joules: energy_uj / 1_000_000,
      seconds: duration_us / 1_000_000,
      co2_g: (co2_ug || 0) / 1_000_000,
      intensity: carbon_intensity,
      cpu: cpu_pct,
    };
  }
  return runs;
}

function collectLabel(runs, label) {
  const joules = [],
    seconds = [],
    intensities = [];
  for (const { measurements } of Object.values(runs)) {
    const m = measurements[label];
    if (!m) continue;
    joules.push(m.joules);
    seconds.push(m.seconds);
    if (m.intensity) intensities.push(m.intensity);
  }
  return { joules, seconds, intensity: intensities.length > 0 ? median(intensities) : null };
}

function collectTotal(runs, labels) {
  const joules = [],
    seconds = [],
    intensities = [];
  let dropped = 0;
  for (const { measurements } of Object.values(runs)) {
    const vals = labels.map((l) => measurements[l]).filter(Boolean);
    if (vals.length !== labels.length) {
      dropped++;
      continue;
    }
    joules.push(vals.reduce((s, m) => s + m.joules, 0));
    seconds.push(vals.reduce((s, m) => s + m.seconds, 0));
    vals.forEach((m) => m.intensity && intensities.push(m.intensity));
  }
  return {
    joules,
    seconds,
    dropped,
    intensity: intensities.length > 0 ? median(intensities) : null,
  };
}

// =============================================================================
// Statistical functions
// =============================================================================

const mean = (arr) => (arr.length === 0 ? 0 : arr.reduce((a, b) => a + b, 0) / arr.length);

function median(arr) {
  if (arr.length === 0) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? (s[m - 1] + s[m]) / 2 : s[m];
}

function stddev(arr) {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  return Math.sqrt(arr.reduce((a, b) => a + (b - m) ** 2, 0) / (arr.length - 1));
}

function ci95(arr) {
  if (arr.length < 2) return { lower: 0, upper: 0 };
  const margin = (1.96 * stddev(arr)) / Math.sqrt(arr.length);
  const m = mean(arr);
  return { lower: m - margin, upper: m + margin };
}

// Cliff's delta – non-parametric effect size (Romano et al. 2006)
function comparePair(x, y) {
  if (x > y) return 1;
  if (x < y) return -1;
  return 0;
}

function cliffsDelta(a, b) {
  if (a.length === 0 || b.length === 0) return null;
  const total = a.flatMap((x) => b.map((y) => comparePair(x, y))).reduce((s, v) => s + v, 0);
  return total / (a.length * b.length);
}

function cliffLabel(d) {
  const abs = Math.abs(d);
  if (abs < 0.147) return 'negligible';
  if (abs < 0.33) return 'small';
  if (abs < 0.474) return 'medium';
  return 'large';
}

// CO₂: Joules → kWh → grams
const joulesTo_gCO2 = (j, i) => (j / 3_600_000) * i;

// =============================================================================
// Output
// =============================================================================

const fmt = (n, d = 3) => n.toFixed(d);

function printHeader(title) {
  console.log('\n' + '━'.repeat(60));
  console.log(`  ${title}`);
  console.log('━'.repeat(60));
}

function printStats(label, arr, intensity = null) {
  if (arr.length === 0) {
    console.log(`  ${label}: no data`);
    return;
  }
  const m = mean(arr);
  const ci = ci95(arr);
  console.log(`  ${label} (n=${arr.length})`);
  console.log(`    mean ${fmt(m)}  median ${fmt(median(arr))}  sd ${fmt(stddev(arr))}`);
  console.log(`    95% CI [${fmt(ci.lower)}, ${fmt(ci.upper)}]`);
  console.log(`    min ${fmt(Math.min(...arr))}  max ${fmt(Math.max(...arr))}`);
  if (intensity !== null) {
    const co2r = joulesTo_gCO2(m, intensity);
    const co2f = joulesTo_gCO2(m, FINLAND_CI);
    const diff = ((co2r - co2f) / co2f) * 100;
    console.log(`    CO₂ runner (${fmt(intensity, 0)} gCO₂/kWh): ${co2r.toFixed(7)} g`);
    console.log(`    CO₂ Finland (${FINLAND_CI} gCO₂/kWh): ${co2f.toFixed(7)} g`);
    console.log(`    Runner vs Finland: ${diff > 0 ? '+' : ''}${fmt(diff, 1)}%`);
  }
}

function printCliffs(nameA, a, nameB, b) {
  const d = cliffsDelta(a, b);
  if (d === null) return;
  console.log(`  Cliff's delta  ${nameA} vs ${nameB}: ${fmt(d)} [${cliffLabel(d)}]`);
}

// =============================================================================
// CSV export
// =============================================================================

function saveCSV(filename, headers, rows) {
  mkdirSync('results', { recursive: true });
  const escape = (v) => (typeof v === 'string' && v.includes(',') ? `"${v}"` : v);
  const lines = [headers.join(','), ...rows.map((r) => r.map(escape).join(','))];
  writeFileSync(`results/${filename}`, lines.join('\n'));
  console.log(`  → Saved: results/${filename}`);
}

function csvRowCI(wf, d) {
  const m = mean(d.joules);
  const c = ci95(d.joules);
  return [
    wf,
    d.joules.length,
    fmt(m),
    fmt(median(d.joules)),
    fmt(stddev(d.joules)),
    fmt(c.lower),
    fmt(c.upper),
    fmt(Math.min(...d.joules)),
    fmt(Math.max(...d.joules)),
    d.intensity || 'CONSTANT',
    d.intensity ? joulesTo_gCO2(m, d.intensity).toFixed(7) : '',
    joulesTo_gCO2(m, FINLAND_CI).toFixed(7),
  ];
}

function toIntensitySource(intensity) {
  if (intensity === 472) return 'CONSTANT';
  if (intensity) return 'realtime';
  return 'unknown';
}

function measurementToRow(run_id, timestamp, wf, label, m) {
  const co2Runner = m.intensity ? joulesTo_gCO2(m.joules, m.intensity).toFixed(9) : '';
  const co2Finland = joulesTo_gCO2(m.joules, FINLAND_CI).toFixed(9);
  return [
    run_id,
    timestamp,
    wf,
    label,
    m.joules.toFixed(6),
    m.seconds.toFixed(6),
    m.intensity || '',
    toIntensitySource(m.intensity),
    co2Runner,
    co2Finland,
    m.cpu || '',
  ];
}

function runsToRows(runs) {
  return Object.entries(runs).flatMap(([wf, wfRuns]) =>
    Object.entries(wfRuns).flatMap(([run_id, run]) =>
      Object.entries(run.measurements).map(([label, m]) =>
        measurementToRow(run_id, run.timestamp, wf, label, m),
      ),
    ),
  );
}

function exportAllRawCSV(ciRuns, dockerRuns) {
  saveCSV('raw-data-osa-a.csv', RAW_HEADERS, runsToRows(ciRuns));
  saveCSV('raw-data-osa-b.csv', RAW_HEADERS, runsToRows(dockerRuns));
}

// =============================================================================
// Part A: CI optimisation
// =============================================================================

async function fetchCIData(workflowIds) {
  printHeader('Part A – Fetching CI measurement data from GMT');
  const ciRuns = {};
  for (const wf of CI_WORKFLOWS) {
    const id = workflowIds[wf];
    if (!id) {
      console.log(`  WARNING: ${wf} not found`);
      continue;
    }
    console.log(`  Fetching ${wf} (ID: ${id})...`);
    const rows = await fetchGmtData(REPO, CI_BRANCH, id, SIM_A_START, SIM_A_END);
    ciRuns[wf] = groupByRun(rows);
    console.log(`    → ${Object.keys(ciRuns[wf]).length} runs`);
  }
  return ciRuns;
}

function buildCIData(ciRuns) {
  const ciData = {};
  for (const wf of CI_WORKFLOWS) {
    if (!ciRuns[wf]) continue;
    ciData[wf] = {
      total: collectTotal(ciRuns[wf], CI_LABELS),
      install: collectLabel(ciRuns[wf], 'install'),
      'lint-typecheck': collectLabel(ciRuns[wf], 'lint-typecheck'),
      'test-suite': collectLabel(ciRuns[wf], 'test-suite'),
      build: collectLabel(ciRuns[wf], 'build'),
    };
  }
  return ciData;
}

function reportPartA(ciRuns, ciData) {
  printHeader('Part A – Total energy per workflow (Joules)');
  for (const wf of CI_WORKFLOWS) {
    if (!ciData[wf]) continue;
    console.log(`\n▸ ${wf} (${Object.keys(ciRuns[wf]).length} runs)`);
    printStats('Energy (J)', ciData[wf].total.joules, ciData[wf].total.intensity);
    printStats('Duration (s)', ciData[wf].total.seconds);
  }

  printHeader('Part A – Install step (effect of caching)');
  for (const wf of ['ci-baseline', 'ci-cached', 'ci-swc']) {
    if (!ciData[wf]) continue;
    console.log(`\n▸ ${wf}`);
    printStats('install (J)', ciData[wf].install.joules);
  }
  console.log();
  printCliffs(
    'baseline',
    ciData['ci-baseline']?.install.joules || [],
    'cached',
    ciData['ci-cached']?.install.joules || [],
  );
  printCliffs(
    'baseline',
    ciData['ci-baseline']?.install.joules || [],
    'swc',
    ciData['ci-swc']?.install.joules || [],
  );

  printHeader('Part A – Build step (tsc vs SWC)');
  console.log('\n  ci-baseline / ci-cached / ci-path-filter: tsc  |  ci-swc: SWC\n');
  for (const wf of CI_WORKFLOWS) {
    if (!ciData[wf]) continue;
    console.log(`▸ ${wf}`);
    printStats('build (J)', ciData[wf].build.joules);
  }
  console.log();
  printCliffs(
    'baseline (tsc)',
    ciData['ci-baseline']?.build.joules || [],
    'swc',
    ciData['ci-swc']?.build.joules || [],
  );
  printCliffs(
    'cached (tsc)',
    ciData['ci-cached']?.build.joules || [],
    'swc',
    ciData['ci-swc']?.build.joules || [],
  );

  printHeader("Part A – Effect sizes (Cliff's delta)");
  const bl = ciData['ci-baseline']?.total.joules || [];
  printCliffs('baseline', bl, 'cached', ciData['ci-cached']?.total.joules || []);
  printCliffs('baseline', bl, 'swc', ciData['ci-swc']?.total.joules || []);
  printCliffs('baseline', bl, 'path-filter', ciData['ci-path-filter']?.total.joules || []);
  printCliffs(
    'cached',
    ciData['ci-cached']?.total.joules || [],
    'swc',
    ciData['ci-swc']?.total.joules || [],
  );

  return reportPathFilter(ciData);
}

function reportPathFilter(ciData) {
  printHeader('Part A – Path-filter: skipped runs');
  const blJoules = ciData['ci-baseline']?.total.joules || [];
  const pfJoules = ciData['ci-path-filter']?.total.joules || [];
  const skip = blJoules.length - pfJoules.length;
  const blMean = mean(blJoules);
  const saved = skip * blMean;
  console.log(`  Baseline runs:    ${blJoules.length}`);
  console.log(`  Path-filter runs: ${pfJoules.length}`);
  console.log(`  Skipped runs:     ${skip}`);
  console.log(`  Saved energy:     ${fmt(saved)} J`);
  const intensity = ciData['ci-baseline']?.total.intensity;
  if (intensity) {
    console.log(`  Saved CO₂:        ${joulesTo_gCO2(saved, intensity).toFixed(7)} g (runner)`);
    console.log(`  Saved CO₂:        ${joulesTo_gCO2(saved, FINLAND_CI).toFixed(7)} g (Finland)`);
  }
  return blMean;
}

function exportPartACSV(ciData) {
  const summary = CI_WORKFLOWS.filter((wf) => ciData[wf]?.total.joules.length > 0).map((wf) =>
    csvRowCI(wf, ciData[wf].total),
  );
  saveCSV(
    'osa-a-summary.csv',
    [
      'workflow',
      'n',
      'mean_j',
      'median_j',
      'sd_j',
      'ci_lower',
      'ci_upper',
      'min_j',
      'max_j',
      'carbon_intensity',
      'co2_runner_g',
      'co2_finland_g',
    ],
    summary,
  );

  const labels = CI_WORKFLOWS.flatMap((wf) =>
    CI_LABELS.filter((l) => ciData[wf]?.[l]?.joules.length > 0).map((l) => {
      const d = ciData[wf][l];
      return [
        wf,
        l,
        d.joules.length,
        fmt(mean(d.joules)),
        fmt(median(d.joules)),
        fmt(stddev(d.joules)),
      ];
    }),
  );
  saveCSV('osa-a-labels.csv', ['workflow', 'label', 'n', 'mean_j', 'median_j', 'sd_j'], labels);
}

// =============================================================================
// Part B: Docker comparison
// =============================================================================

async function fetchDockerData(workflowIds) {
  printHeader('Part B – Fetching Docker measurement data from GMT');
  const dockerRuns = {};
  for (const wf of DOCKER_WORKFLOWS) {
    const id = workflowIds[wf];
    if (!id) {
      console.log(`  WARNING: ${wf} not found`);
      continue;
    }
    console.log(`  Fetching ${wf} (ID: ${id})...`);
    const rows = await fetchGmtData(REPO, DOCKER_BRANCH, id, SIM_B_START, SIM_B_END);
    dockerRuns[wf] = groupByRun(rows);
    console.log(`    → ${Object.keys(dockerRuns[wf]).length} runs`);
  }
  return dockerRuns;
}

function buildDockerData(dockerRuns) {
  const dockerData = {};
  for (const wf of DOCKER_WORKFLOWS) {
    if (!dockerRuns[wf]) continue;
    dockerData[wf] = {
      total: collectTotal(dockerRuns[wf], DOCKER_LABELS),
      'docker-build': collectLabel(dockerRuns[wf], 'docker-build'),
      'docker-run': collectLabel(dockerRuns[wf], 'docker-run'),
    };
  }
  return dockerData;
}

function reportPartB(dockerData, blMean) {
  printHeader('Part B – Build energy per configuration (Joules)');
  for (const wf of DOCKER_WORKFLOWS) {
    if (!dockerData[wf]) continue;
    console.log(`\n▸ ${wf}`);
    printStats('docker-build (J)', dockerData[wf]['docker-build'].joules);
  }

  printHeader('Part B – Run energy per configuration (Joules)');
  for (const wf of DOCKER_WORKFLOWS) {
    if (!dockerData[wf]) continue;
    console.log(`\n▸ ${wf}`);
    printStats('docker-run (J)', dockerData[wf]['docker-run'].joules);
  }

  printHeader('Part B – Total energy per configuration (Joules)');
  for (const wf of DOCKER_WORKFLOWS) {
    if (!dockerData[wf]) continue;
    const d = dockerData[wf].total;
    console.log(`\n▸ ${wf}`);
    printStats('Total energy (J)', d.joules, d.intensity);
  }

  printHeader("Part B – Effect sizes (Cliff's delta)");
  const full = dockerData['docker-full']?.total.joules || [];
  printCliffs('full', full, 'slim', dockerData['docker-slim']?.total.joules || []);
  printCliffs('full', full, 'alpine', dockerData['docker-alpine']?.total.joules || []);
  printCliffs('full', full, 'multistage', dockerData['docker-multistage']?.total.joules || []);
  printCliffs(
    'alpine',
    dockerData['docker-alpine']?.total.joules || [],
    'multistage',
    dockerData['docker-multistage']?.total.joules || [],
  );

  printHeader('Part B – Docker overhead vs ci-baseline');
  console.log(`  ci-baseline mean: ${fmt(blMean)} J\n`);
  for (const wf of DOCKER_WORKFLOWS) {
    const dMean = mean(dockerData[wf]?.total.joules || []);
    if (blMean <= 0 || dMean <= 0) continue;
    const pct = ((dMean - blMean) / blMean) * 100;
    console.log(`  ${wf}: ${fmt(dMean)} J  (${pct > 0 ? '+' : ''}${fmt(pct, 1)}% vs baseline)`);
  }
}

function exportPartBCSV(dockerData) {
  const rows = DOCKER_WORKFLOWS.filter((wf) => dockerData[wf]?.total.joules.length > 0).map(
    (wf) => {
      const d = dockerData[wf].total;
      const m = mean(d.joules);
      const c = ci95(d.joules);
      const db = dockerData[wf]['docker-build'];
      const dr = dockerData[wf]['docker-run'];
      return [
        wf,
        d.joules.length,
        fmt(mean(db.joules)),
        fmt(mean(dr.joules)),
        fmt(m),
        fmt(median(d.joules)),
        fmt(stddev(d.joules)),
        fmt(c.lower),
        fmt(c.upper),
        fmt(Math.min(...d.joules)),
        fmt(Math.max(...d.joules)),
        d.intensity || 'CONSTANT',
        d.intensity ? joulesTo_gCO2(m, d.intensity).toFixed(7) : '',
        joulesTo_gCO2(m, FINLAND_CI).toFixed(7),
      ];
    },
  );
  saveCSV(
    'osa-b-summary.csv',
    [
      'workflow',
      'n',
      'mean_build_j',
      'mean_run_j',
      'mean_total_j',
      'median_total_j',
      'sd_total_j',
      'ci_lower',
      'ci_upper',
      'min_j',
      'max_j',
      'carbon_intensity',
      'co2_runner_g',
      'co2_finland_g',
    ],
    rows,
  );
}

// =============================================================================
// Main
// =============================================================================

function validate() {
  if (!SIM_A_START || !SIM_A_END || !SIM_B_START || !SIM_B_END) {
    console.error(
      '\nERROR: Set environment variables SIM_A_START, SIM_A_END, SIM_B_START, SIM_B_END',
    );
    process.exit(1);
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('  CI Carbon Demo – Statistical analysis');
  console.log(`  Repo:   ${REPO}  |  Finland: ${FINLAND_CI} gCO₂eq/kWh`);
  console.log(`  Part A: ${SIM_A_START} → ${SIM_A_END}`);
  console.log(`  Part B: ${SIM_B_START} → ${SIM_B_END}`);
  console.log('='.repeat(60));
  validate();

  console.log('\nFetching workflow IDs from GitHub API...');
  const workflowIds = await fetchWorkflowIds(REPO);
  Object.entries(workflowIds).forEach(([n, id]) => console.log(`  ${n}: ${id}`));

  const ciRuns = await fetchCIData(workflowIds);
  const ciData = buildCIData(ciRuns);
  const blMean = reportPartA(ciRuns, ciData);

  const dockerRuns = await fetchDockerData(workflowIds);
  const dockerData = buildDockerData(dockerRuns);
  reportPartB(dockerData, blMean);

  printHeader('Saving CSV files');
  exportAllRawCSV(ciRuns, dockerRuns);
  exportPartACSV(ciData);
  exportPartBCSV(dockerData);

  console.log('\n' + '='.repeat(60));
  console.log('  Analysis complete');
  console.log('='.repeat(60));
}

try {
  await main();
} catch (err) {
  console.error('\nError:', err.message);
  process.exit(1);
}
