// The state-space core, each against a result worked by hand from the exercise's data or a closed form.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as S from "../../src/core/ss.js";

const near = (a, b, tol = 1e-6) => assert.ok(Math.abs(a - b) <= tol * (1 + Math.abs(b)), `${a} ≠ ${b}`);
// System A of Beispiele 1, 5, 6, 7, 13, 19: ẋ1 = −2x1 + 3x2 + u, ẋ2 = 3x1 + 10x2 − u, v = x1.
const A = [[-2, 3], [3, 10]], b = [1, -1], c = [1, 0];

test("G(s) of System A is (s − 13)/(s² − 8s − 29) (by hand: adj(sI − A)·b = [s − 13, 1 − s])", () => {
  const G = S.ss2tf(A, b, c, 0);
  [1, -8, -29].forEach((v, k) => near(G.den[k], v));
  [0, 1, -13].forEach((v, k) => near(G.num[k], v));
});

test("G(s) with a feedthrough adds d·det(sI − A) to the numerator (by definition)", () => {
  const G = S.ss2tf(A, b, c, 2);
  [2, 1 - 16, -13 - 58].forEach((v, k) => near(G.num[k], v));
});

test("Beispiel 8: G = (3s² + 2s + 1)/(s³ + s² + 2s + 3) gives the RNF last row [−3 −2 −1], cᵀ = [1 2 3] (slides p. 8, by hand)", () => {
  const { rnf, bnf } = S.normalForms([3, 2, 1], [1, 1, 2, 3]);
  assert.deepEqual(rnf.A[2], [-3, -2, -1]); assert.deepEqual(rnf.c, [1, 2, 3]); assert.deepEqual(rnf.b, [0, 0, 1]);
  assert.deepEqual(bnf.A.map(r => r[2]), [-3, -2, -1]); assert.deepEqual(bnf.b, [1, 2, 3]); assert.deepEqual(bnf.c, [0, 0, 1]);
  for (const f of [rnf, bnf]) {
    const G = S.ss2tf(f.A, f.b, f.c, f.d);
    [0, 3, 2, 1].forEach((v, k) => near(G.num[k], v)); [1, 1, 2, 3].forEach((v, k) => near(G.den[k], v));
  }
});

test("a biproper G keeps G(s) through both normal forms (second route: back to G(s))", () => {
  const { rnf, bnf } = S.normalForms([5, 2, 3], [2, 6, 4]);
  for (const f of [rnf, bnf]) {
    const G = S.ss2tf(f.A, f.b, f.c, f.d);
    [2.5, 1, 1.5].forEach((v, k) => near(G.num[k], v)); [1, 3, 2].forEach((v, k) => near(G.den[k], v));
  }
});

test("System A is controllable (det[b, Ab] = −12) and observable (det[cᵀ; cᵀA] = 3), and unstable (by hand)", () => {
  const Q = S.ctrb(A, b), O = S.obsv(A, c);
  assert.deepEqual(Q, [[1, -5], [-1, -7]]);
  assert.deepEqual(O, [[1, 0], [-2, 3]]);
  near(S.verdict(Q).det, -12); near(S.verdict(O).det, 3);
  assert.equal(S.stable(A), false);
});

test("a gain placed at −1 ± 3j gives det(sI − A + b rᵀ) = s² + 2s + 10, and the prefilter makes v → w (by definition)", () => {
  const r = S.placeGain(A, b, [[-1, 3], [-1, -3]]);
  const p = S.charpoly(S.closedLoop(A, b, r));
  [1, 2, 10].forEach((v, k) => near(p[k], v));
  const Kf = S.prefilter(A, b, c, r);
  near(S.finalValue(S.closedLoop(A, b, r), b.map(v => v * Kf), c, 0), 1);
});

test("the observer gain places eig(A − l cᵀ), and with a perfect model the estimate tracks the state (separation)", () => {
  const l = S.observerGain(A, c, [[-6, 2], [-6, -2]]);
  const p = S.charpoly(A.map((row, i) => row.map((a, j) => a - l[i] * c[j])));
  [1, 12, 40].forEach((v, k) => near(p[k], v));
  const r = S.placeGain(A, b, [[-3, 1], [-3, -1]]), Kf = S.prefilter(A, b, c, r);
  const W = S.withObserver({ A, b, c }, r, l, Kf);
  const run = S.stepRun(W.A, W.b, [...c, 0, 0], 0, 5, 1000);
  const xe = run.x.at(-1);
  near(xe[0], xe[2], 1e-6); near(run.y.at(-1), 1, 1e-4);
});

test("Butterworth poles of order 2 lie at ω0·e^(±j3π/4) (by definition)", () => {
  const p = S.butterworth(2, 2);
  near(p[0][0], -Math.SQRT2); near(Math.abs(p[0][1]), Math.SQRT2);
  near(p[1][0], -Math.SQRT2);
});

test("LQ for ẋ = x + u, Q = R = 1: P = r = 1 + √2 (the scalar Riccati equation 2P − P² + 1 = 0)", () => {
  const { r, P } = S.lqr([[1]], [1], [[1]], 1);
  near(r[0], 1 + Math.SQRT2); near(P[0][0], 1 + Math.SQRT2);
});

test("the Lyapunov solver satisfies AᵀP + PA + Q = 0 for a 3 × 3 stable A (second route: the residual)", () => {
  const M = [[-1, 2, 0], [0, -3, 1], [1, 0, -2]], Q = [[2, 0, 0], [0, 1, 0], [0, 0, 3]];
  const P = S.lyap(M, Q);
  const R = S.matMul(S.transpose(M), P).map((row, i) => row.map((v, j) => v + S.matMul(P, M)[i][j] + Q[i][j]));
  R.flat().forEach(v => near(v, 0, 1e-9));
});

test("the tangent method on the pendulum ÿ + Dẏ + ω² sin y = 0 at y0 = 0 gives A = [0 1; −ω² −D] (Beispiel 23, by hand)", () => {
  const D = 0.3, w = 2;
  const L = S.linearise(([y, v], u) => [v, -D * v - w * w * Math.sin(y) + u], ([y]) => y, [0, 0], 0);
  near(L.A[0][0], 0); near(L.A[0][1], 1); near(L.A[1][0], -w * w); near(L.A[1][1], -D);
  near(L.b[1], 1); near(L.c[0], 1);
});

test("stepinfo of 1 − e^(−t): rise time ln 9, settling time (2 %) ln 50, no overshoot (closed form)", () => {
  const t = Array.from({ length: 20001 }, (_, k) => k * 1e-3), y = t.map(v => 1 - Math.exp(-v));
  const s = S.stepinfo(t, y, 1);
  near(s.RiseTime, Math.log(9), 1e-4); near(s.SettlingTime, Math.log(50), 1e-3); near(s.Overshoot, 0);
  near(S.stepinfo(t, y, 1, { SettlingTimeThreshold: 0.01 }).SettlingTime, Math.log(100), 1e-3);
});

test("stepinfo's overshoot of a PT2 with ζ = 0.5 is 100·e^(−πζ/√(1−ζ²)) = 16.3 % (closed form)", () => {
  const z = 0.5, A2 = [[0, 1], [-1, -2 * z]];
  const run = S.stepRun(A2, [0, 1], [1, 0], 0, 30, 30000);
  near(S.stepinfo(run.t, run.y, 1).Overshoot, 100 * Math.exp(-Math.PI * z / Math.sqrt(1 - z * z)), 1e-3);
});
