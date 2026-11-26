/**
 * One-group axial diffusion along one channel, for the BWR bundle bench and the pebble-bed pass desk.
 *
 *   -M² φ'' + φ = (k∞ / k) φ,   φ just outside each end = albedo × φ at the end node
 *
 * Finite differences on equal nodes, inverse power iteration with a tridiagonal solve. Power is taken as k∞·φ
 * (the fission source), normalised to an average of 1. Teaching model, not a license: no spectrum, no xenon, no
 * radial coupling. Good enough to show which way an axial shape leans and why.
 */
export interface AxialResult {
  k: number;
  /** Node power, average 1. */
  power: number[];
}

export function solveAxial(kInf: readonly number[], m2: readonly number[], h: number, albedo = 0.4, warm?: readonly number[]): AxialResult {
  const n = kInf.length;
  let phi = warm && warm.length === n ? warm.slice() : new Array(n).fill(1);
  let k = 1;
  const a = new Array(n).fill(0);
  const b = new Array(n).fill(0);
  const c = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    const coup = m2[i] / (h * h);
    b[i] = 1 + 2 * coup;
    if (i === 0 || i === n - 1) b[i] -= coup * albedo;
    a[i] = i > 0 ? -coup : 0;
    c[i] = i < n - 1 ? -coup : 0;
  }
  const src = (f: number[]) => f.map((v, i) => Math.max(0, kInf[i]) * v);
  for (let it = 0; it < 200; it++) {
    const s = src(phi);
    const rhs = s.map((v) => v / k);
    const next = thomas(a, b, c, rhs);
    const s2 = src(next);
    const sum1 = s.reduce((x, y) => x + y, 0);
    const sum2 = s2.reduce((x, y) => x + y, 0);
    const kNew = (k * sum2) / Math.max(1e-12, sum1);
    const scale = n / Math.max(1e-12, next.reduce((x, y) => x + y, 0));
    const normed = next.map((v) => v * scale);
    const diff = normed.reduce((m, v, i) => Math.max(m, Math.abs(v - phi[i])), 0);
    phi = normed;
    const done = Math.abs(kNew - k) < 1e-7 && diff < 1e-6;
    k = kNew;
    if (done) break;
  }
  const p = src(phi);
  const avg = p.reduce((x, y) => x + y, 0) / n;
  return { k, power: p.map((v) => v / Math.max(1e-12, avg)) };
}

function thomas(a: number[], b: number[], c: number[], d: number[]): number[] {
  const n = d.length;
  const cp = new Array(n).fill(0);
  const dp = new Array(n).fill(0);
  cp[0] = c[0] / b[0];
  dp[0] = d[0] / b[0];
  for (let i = 1; i < n; i++) {
    const m = b[i] - a[i] * cp[i - 1];
    cp[i] = c[i] / m;
    dp[i] = (d[i] - a[i] * dp[i - 1]) / m;
  }
  const x = new Array(n).fill(0);
  x[n - 1] = dp[n - 1];
  for (let i = n - 2; i >= 0; i--) x[i] = dp[i] - cp[i] * x[i + 1];
  return x;
}
