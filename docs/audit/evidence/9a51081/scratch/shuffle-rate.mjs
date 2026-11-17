// Independent greedy pass rate. Formulas copied from the book of the model, not imported.
const N = 6;
const FQ_MAX = 1.5;
const RIM_MAX = 0.5;
const MIN_SWAPS = 3;
const START = "120201202011211200011010220102222110";
function startMap() { return Array.from(START, (c) => Number(c)); }
function isRim(i) {
  const x = i % N, y = Math.floor(i / N);
  return x === 0 || y === 0 || x === N - 1 || y === N - 1;
}
function fluxOf(grid, enrich) {
  const power = [];
  let sum = 0, max = 0, rimSum = 0;
  for (let i = 0; i < N * N; i++) {
    const x = i % N, y = Math.floor(i / N);
    const r = Math.hypot(x - 2.5, y - 2.5) / 3.6;
    const fresh = 1.35 - grid[i] * 0.38;
    const shape = 1.12 - 0.55 * r;
    let couple = 0;
    for (const n of [i - 1, i + 1, i - N, i + N]) {
      if (n < 0 || n >= N * N) continue;
      if (Math.abs((n % N) - x) + Math.abs(Math.floor(n / N) - y) !== 1) continue;
      couple += 0.08 * (1.2 - grid[n] * 0.3);
    }
    const p = Math.max(0.15, fresh * shape * (0.85 + enrich / 10) + couple);
    power.push(p); sum += p; if (p > max) max = p; if (isRim(i)) rimSum += p;
  }
  const avg = sum / (N * N);
  return { fq: max / avg, rim: rimSum / sum };
}
function passes(flux, swaps) {
  return flux.fq < FQ_MAX && flux.rim <= RIM_MAX && swaps >= MIN_SWAPS;
}
function pen(f) { return f.fq + Math.max(0, f.rim - RIM_MAX) * 20; }
function climb(start, enrich) {
  let grid = start.slice();
  let cur = pen(fluxOf(grid, enrich));
  let swaps = 0;
  for (;;) {
    let best = cur, pick = null;
    for (let a = 0; a < 36; a++) for (let b = a + 1; b < 36; b++) {
      if (grid[a] === grid[b]) continue;
      const t = grid.slice();
      [t[a], t[b]] = [t[b], t[a]];
      const p = pen(fluxOf(t, enrich));
      if (p < best - 1e-9) { best = p; pick = t; }
    }
    if (!pick) break;
    grid = pick; cur = best; swaps += 1;
    if (swaps > 60) break;
  }
  return { swaps, flux: fluxOf(grid, enrich) };
}
const ENRICH = 4.5;
const NSTART = 1000;
let pass = 0;
let bestFq = Infinity;
for (let seed = 1; seed <= NSTART; seed++) {
  let x = seed >>> 0;
  const rnd = () => ((x = (Math.imul(x, 1664525) + 1013904223) >>> 0) / 4294967296);
  const g = startMap();
  for (let k = 35; k > 0; k--) {
    const j = Math.floor(rnd() * (k + 1));
    [g[k], g[j]] = [g[j], g[k]];
  }
  const r = climb(g, ENRICH);
  if (r.flux.fq < bestFq) bestFq = r.flux.fq;
  if (passes(r.flux, Math.max(r.swaps, 0))) pass += 1;
}
console.log(JSON.stringify({
  starts: NSTART,
  enrich: ENRICH,
  pass,
  rate: pass / NSTART,
  bestFq,
  rule: "fq < 1.50 and rim <= 0.50 and swaps >= 3",
}));
