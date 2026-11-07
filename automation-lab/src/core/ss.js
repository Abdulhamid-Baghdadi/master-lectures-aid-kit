// State space as the exercises use it: ẋ = A x + b u, v = cᵀx + d u. From the model to G(s), controllability and
// observability, pole placement with a prefilter, the Luenberger observer, the LQ controller, Butterworth poles,
// linearisation, simulation and MATLAB's step measures. Pure and deterministic.
import { zeros, eye, matMul, matVec, matAdd, matScale, transpose, inv, det, rank, charpoly, roots, polyFromRoots,
  ackermann, simulate } from "./lti.js";

const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);
const col = M => j => M.map(r => r[j]);

/** G(s) = cᵀ(sI − A)⁻¹b + d as num/den, highest power first. The adjugate comes from the Faddeev–LeVerrier matrices:
 *  adj(sI − A) = Σ s^(n−1−k) N_k with N_0 = I, N_k = A N_(k−1) + a_k I. */
export function ss2tf(A, b, c, d = 0) {
  const n = A.length, den = charpoly(A);
  let N = eye(n);
  const num = [0];
  for (let k = 1; k <= n; k++) {
    num.push(dot(c, matVec(N, b)));
    if (k < n) N = matAdd(matMul(A, N), eye(n), den[k]);
  }
  return { num: num.map((v, k) => v + d * den[k]), den };
}

/** The course's normal forms of G = num/den (slides p. 8–9): den made monic, a_i and b_i indexed from the constant
 *  term. RNF: ones above the diagonal, −a_i in the last row, b = [0 … 0 1]ᵀ, cᵀ = [b0 … b_(n−1)]. BNF: its transpose
 *  pair, ones below the diagonal, −a_i in the last column, b = [b0 … b_(n−1)]ᵀ, cᵀ = [0 … 0 1]. The slides treat only
 *  b_n = 0; for b_n ≠ 0, d = b_n and b_i − b_n a_i take the place of b_i (worked here by long division). */
export function normalForms(num, den) {
  const lead = den.find(v => v !== 0), D = den.slice(den.findIndex(v => v !== 0)).map(v => v / lead), n = D.length - 1;
  const N = [...new Array(Math.max(0, n + 1 - num.length)).fill(0), ...num].slice(-(n + 1)).map(v => v / lead);
  const a = [...D].reverse(), bn = N[0], bs = [...N].reverse().map((v, i) => v - bn * a[i]).slice(0, n);
  const A = zeros(n);
  for (let i = 0; i < n - 1; i++) A[i][i + 1] = 1;
  for (let j = 0; j < n; j++) A[n - 1][j] = -a[j];
  const e = Array.from({ length: n }, (_, i) => i === n - 1 ? 1 : 0);
  return { a: a.slice(0, n), b: bs, d: bn,
    rnf: { A, b: e, c: bs, d: bn },
    bnf: { A: transpose(A), b: bs, c: e, d: bn } };
}

/** The controllability matrix [b, Ab, …, A^(n−1)b] and the observability matrix [cᵀ; cᵀA; …; cᵀA^(n−1)]. */
export function ctrb(A, b) {
  const cols = [b];
  for (let k = 1; k < A.length; k++) cols.push(matVec(A, cols[k - 1]));
  return transpose(cols);
}
export function obsv(A, c) {
  const rows = [c];
  for (let k = 1; k < A.length; k++) rows.push(matVec(transpose(A), rows[k - 1]));
  return rows;
}
/** Full rank, so controllable (or observable); det for the square single-input case, as worked by hand. */
export const verdict = M => ({ det: M.length === M[0].length ? det(M) : NaN, rank: rank(M), full: rank(M) === M.length });

/** Poles of A as [re, im] pairs, and stable when every real part is negative. */
export const poles = A => roots(charpoly(A));
export const stable = A => poles(A).every(([re]) => re < 0);

/** State feedback u = −rᵀx + Kf·w by Ackermann: eig(A − b rᵀ) are the chosen poles. */
export const placeGain = (A, b, p) => ackermann(A, b, p);
export const closedLoop = (A, b, r) => A.map((row, i) => row.map((a, j) => a - b[i] * r[j]));
/** The prefilter that makes the steady output follow w: Kf = 1/(cᵀ(−A + b rᵀ)⁻¹b) (d = 0), or with d:
 *  1/((cᵀ − d rᵀ)(−A + b rᵀ)⁻¹b + d). */
export function prefilter(A, b, c, r, d = 0) {
  const M = inv(matScale(closedLoop(A, b, r), -1));
  return 1 / (dot(c.map((v, i) => v - d * r[i]), matVec(M, b)) + d);
}
/** Luenberger observer gain l: eig(A − l cᵀ) the chosen poles, by Ackermann on the dual pair (Aᵀ, c). */
export const observerGain = (A, c, p) => ackermann(transpose(A), c, p);

/** Controller and observer together, states [x; x̂], input w: ẋ = Ax − b rᵀx̂ + b Kf w,
 *  dx̂/dt = l cᵀx + (A − b rᵀ − l cᵀ)x̂ + b Kf w. A model mismatch is a different A, b for the plant (the "defect"). */
export function withObserver({ A, b, c }, r, l, Kf, plant = { A, b }) {
  const n = A.length, M = zeros(2 * n), B = new Array(2 * n).fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      M[i][j] = plant.A[i][j];
      M[i][n + j] = -plant.b[i] * r[j];
      M[n + i][j] = l[i] * c[j];
      M[n + i][n + j] = A[i][j] - b[i] * r[j] - l[i] * c[j];
    }
    B[i] = plant.b[i] * Kf; B[n + i] = b[i] * Kf;
  }
  return { A: M, b: B };
}

/** Butterworth poles of order n on a circle of radius ω0: angles π/2 + (2k − 1)π/(2n), k = 1 … n, all in the left half. */
export const butterworth = (n, w0) => Array.from({ length: n }, (_, k) => {
  const a = Math.PI / 2 + (2 * k + 1) * Math.PI / (2 * n);
  return [w0 * Math.cos(a), w0 * Math.sin(a)];
});

/** P from AᵀP + PA + Q = 0 by the Kronecker form, for the small n here. */
export function lyap(A, Q) {
  const n = A.length, N = n * n, M = zeros(N), q = new Array(N);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const row = i * n + j;
    q[row] = -Q[i][j];
    for (let k = 0; k < n; k++) { M[row][k * n + j] += A[k][i]; M[row][i * n + k] += A[k][j]; }
  }
  const p = matVec(inv(M), q);
  return Array.from({ length: n }, (_, i) => p.slice(i * n, i * n + n));
}
/** The LQ (Riccati) gain rᵀ = R⁻¹bᵀP with AᵀP + PA − P b R⁻¹ bᵀ P + Q = 0, by Kleinman's Newton iteration from a
 *  stabilising start. Returns the gain, P and the closed-loop poles. */
export function lqr(A, b, Q, R) {
  const n = A.length;
  const start = poles(A).map(([re, im]) => [-Math.abs(re) - 1, im]);
  let r = ackermann(A, b, start), P = zeros(n);
  for (let it = 0; it < 60; it++) {
    const Ac = closedLoop(A, b, r);
    const Qk = matAdd(Q, r.map(ri => r.map(rj => R * ri * rj)));
    P = lyap(Ac, Qk);
    const next = matVec(transpose(P), b).map(v => v / R);
    const done = next.every((v, i) => Math.abs(v - r[i]) <= 1e-12 * (1 + Math.abs(v)));
    r = next;
    if (done) break;
  }
  return { r, P, poles: poles(closedLoop(A, b, r)) };
}

/** The tangent method: A = ∂f/∂x, b = ∂f/∂u at the working point, by central differences (exact for the polynomial
 *  and trigonometric terms here to ~1e−9). f(x, u) returns ẋ; g(x, u) returns v. */
export function linearise(f, g, x0, u0, h = 1e-6) {
  const n = x0.length, A = zeros(n), b = new Array(n), c = new Array(n);
  for (let j = 0; j < n; j++) {
    const xp = [...x0], xm = [...x0]; xp[j] += h; xm[j] -= h;
    const fp = f(xp, u0), fm = f(xm, u0);
    for (let i = 0; i < n; i++) A[i][j] = (fp[i] - fm[i]) / (2 * h);
    c[j] = (g(xp, u0) - g(xm, u0)) / (2 * h);
  }
  const fp = f(x0, u0 + h), fm = f(x0, u0 - h);
  for (let i = 0; i < n; i++) b[i] = (fp[i] - fm[i]) / (2 * h);
  return { A, b, c, d: (g(x0, u0 + h) - g(x0, u0 - h)) / (2 * h) };
}

/** The step response of (A, b, c, d) to an input of height w, from rest: { t, y, x }. */
export function stepRun(A, b, c, d, T, n = 800, w = 1) {
  const run = simulate((t, x) => matVec(A, x).map((v, i) => v + b[i] * w), new Array(A.length).fill(0), T, n);
  return { t: run.t, x: run.x, y: run.x.map(x => dot(c, x) + d * w) };
}
/** The steady output to a constant input w: −cᵀA⁻¹b·w + d·w (A must be stable for it to be reached). */
export const finalValue = (A, b, c, d, w = 1) => (d - dot(c, matVec(inv(A), b))) * w;

/** MATLAB's stepinfo on a sampled response with yinit = 0 and a known yfinal (MathWorks, stepinfo, "Algorithms"):
 *  rise time between the RiseTimeLimits, settling time where |y − yfinal| stays within ST·|yfinal|, SettlingMin/Max
 *  after the response first reaches RT(2), overshoot of the normalised response. Times are interpolated linearly. */
export function stepinfo(t, y, yfinal, { RiseTimeLimits = [0.1, 0.9], SettlingTimeThreshold = 0.02 } = {}) {
  const yn = y.map(v => v / yfinal);
  const cross = level => {
    const k = yn.findIndex(v => v >= level);
    if (k <= 0) return k === 0 ? t[0] : NaN;
    return t[k - 1] + (level - yn[k - 1]) / (yn[k] - yn[k - 1]) * (t[k] - t[k - 1]);
  };
  const tLo = cross(RiseTimeLimits[0]), tHi = cross(RiseTimeLimits[1]);
  let last = -1;
  y.forEach((v, k) => { if (Math.abs(v - yfinal) > SettlingTimeThreshold * Math.abs(yfinal)) last = k; });
  const SettlingTime = last < 0 ? t[0] : last >= y.length - 1 ? NaN : t[last + 1];
  const risen = y.filter((_, k) => t[k] >= tHi);
  const peakK = y.reduce((m, v, k) => Math.abs(v) > Math.abs(y[m]) ? k : m, 0);
  return {
    RiseTime: tHi - tLo, SettlingTime,
    SettlingMin: risen.length ? Math.min(...risen) : NaN, SettlingMax: risen.length ? Math.max(...risen) : NaN,
    Overshoot: Math.max(0, 100 * (Math.max(...yn) - 1)), Undershoot: Math.max(0, -100 * Math.min(...yn)),
    Peak: Math.abs(y[peakK]), PeakTime: t[peakK],
  };
}

export { charpoly, polyFromRoots, matVec, matMul, transpose, inv, det, eye, zeros, col };
