// The exercises' models and the solution sheets' steps (src/core/models.js), each against a sheet's value, a hand
// calculation or a second route.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as C from "../../src/core/index.js";

const near = (a, b, tol = 1e-6) => assert.ok(Math.abs(a - b) <= tol * (1 + Math.abs(b)), `${a} ≠ ${b}`);
const A = [[-2, 3], [3, 10]], b = [1, -1], c = [1, 0];
const eigs = M => C.poles(M).map(([re, im]) => [re, Math.abs(im)]).sort((x, y) => x[0] - y[0]);

test("toRnf: S·A·S⁻¹ is the RNF of System A, [0 1; 29 8] (S1, p. 6), and S·b = [0; 1]", () => {
  const r = C.toRnf(A, b, c);
  const SAT = C.matMul(C.matMul(r.S, A), r.T);
  [[0, 1], [29, 8]].flat().forEach((v, k) => near(SAT.flat()[k], v));
  C.matVec(r.S, b).forEach((v, k) => near(v, [0, 1][k]));
  C.matVec(C.transpose(r.T), c).forEach((v, k) => near(v, [-13, 1][k]));
});

test("Beispiel 13: rᵀ_RNF = (39 10) (S1, p. 16); carried back, rᵀ places −1 ± j3 and equals Ackermann's", () => {
  const p = [[-1, 3], [-1, -3]], r = C.placeByRnf(A, b, c, p);
  assert.deepEqual(r.rRnf, [39, 10]);
  eigs(C.closedLoop(A, b, r.r)).forEach(([re, im]) => { near(re, -1); near(im, 3); });
  C.ackermann(A, b, p).forEach((v, k) => near(r.r[k], v));
  near(C.prefilter(A, b, c, r.r), -10 / 13);
});

test("Beispiel 19: ℓ_BNF = (69; 20) (S1, p. 25); carried back, eig(A − ℓcᵀ) = −6 ± j2 and ℓ equals the dual Ackermann", () => {
  const p = [[-6, 2], [-6, -2]], o = C.observeByBnf(A, b, c, p);
  assert.deepEqual(o.lBnf, [69, 20]);
  eigs(A.map((row, i) => row.map((v, j) => v - o.l[i] * c[j]))).forEach(([re, im]) => { near(re, -6); near(im, 2); });
  C.observerGain(A, c, p).forEach((v, k) => near(o.l[k], v));
});

test("Beispiel 20: det Q_S ≈ 205.9 k and det Q_B ≈ −3.1 k (S1, p. 27)", () => {
  const m = C.circuit20({ R1: 4.53, L1: 0.123, R2: 0.8, C2: 321e-6 });
  near(C.det(C.ctrb(m.A, m.b)), 205.9e3, 1e-3);
  assert.ok(Math.abs(C.det(C.obsv(m.A, m.c)) + 3.1e3) < 50);
});

test("the crane's linear model is the tangent of its nonlinear one at rest (M, p. 54; second route: central differences)", () => {
  const cr = C.crane({ mK: 24, mL: 160, l: 7.8 });
  const L = C.linearise(cr.f, x => x[2], [0, 0, 0, 0], 0);
  cr.A.flat().forEach((v, k) => near(L.A.flat()[k], v, 1e-5));
  cr.b.forEach((v, k) => near(L.b[k], v, 1e-5));
});

test("the crane's nonlinear swing without force keeps its energy (by definition: no friction)", () => {
  const P = { mK: 24, mL: 160, l: 7.8, g: 9.8065 }, cr = C.crane(P);
  const E = ([phi, om, , v]) => 0.5 * P.mK * v * v + 0.5 * P.mL * ((v + P.l * om * Math.cos(phi)) ** 2 + (P.l * om * Math.sin(phi)) ** 2) - P.mL * P.g * P.l * Math.cos(phi);
  const run = C.simulate((t, x) => cr.f(x, 0), [0.5, 0, 0, 0], 10, 4000);
  near(E(run.x.at(-1)), E(run.x[0]), 1e-6);
});

test("runLoop without observer or limit is the step response of (A − b rᵀ, b Kf) (second route: stepRun)", () => {
  const r = C.placeByRnf(A, b, c, [[-1, 3], [-1, -3]]).r, Kf = C.prefilter(A, b, c, r);
  const one = C.runLoop({ A, b, c }, { r, Kf, T: 3, n: 300 }), two = C.stepRun(C.closedLoop(A, b, r), b.map(v => v * Kf), c, 0, 3, 300);
  one.v.forEach((v, k) => near(v, two.y[k], 1e-9));
});

test("runLoop keeps u within ±umax (by definition) and an observer from rest matches the plain loop (separation)", () => {
  const m = C.circuit20({ R1: 2.75, L1: 0.125, R2: 1.99, C2: 234e-6 }, 500), p = [[-200, 100], [-200, -100]];
  const r = C.ackermann(m.A, m.b, p), Kf = C.prefilter(m.A, m.b, m.c, r);
  const sat = C.runLoop(m, { r, Kf, w: 2500, T: 0.05, n: 1000, umax: 10 });
  assert.ok(Math.max(...sat.u.map(Math.abs)) <= 10 + 1e-12);
  const l = C.observerGain(m.A, m.c, p.map(([a, w]) => [3 * a, 3 * w]));
  const plain = C.runLoop(m, { r, Kf, w: 1, T: 0.05, n: 1000 }), obs = C.runLoop(m, { r, Kf, l, w: 1, T: 0.05, n: 1000 });
  obs.v.forEach((v, k) => near(v, plain.v[k], 1e-7));
});

test("drFactor: (0.85·1 + 0.25·2)·(1 + 2.2·1.1/0.9) = 4.98 (by definition, task 1, p. 2)", () => {
  near(C.drFactor({ RiseTime: 1, SettlingTime: 2, SettlingMin: 0.9, SettlingMax: 1.1 }), 1.35 * (1 + 2.2 * 1.1 / 0.9));
});

test("the PI outer loop settles exactly at w (by definition: the integral of e stops only at e = 0)", () => {
  const cr = C.crane({ mK: 24, mL: 160, l: 7.8 }), r = C.ackermann(cr.A, cr.b, C.butterworth(4, 0.7));
  const M = C.piLoop(cr.A, cr.b, cr.c, r, 0.2, 20);
  assert.ok(C.stable(M.A));
  near(C.finalValue(M.A, M.b, M.c, 0, 2.5), 2.5, 1e-9);
});

test("Beispiel 28: u3 = R2·i and u2 = L1·di/dt (worked here; second route: L1·(A·x + b·u)₃ for a test state)", () => {
  const P = { C1: 1e-4, R1: 10, C2: 2.2e-4, R2: 4.7, L1: 0.05 }, m = C.circuit28(P), x = [1, 2, 0.3], u = 5;
  const di = C.matVec(m.A, x)[2] + m.b[2] * u;
  near(m.C[0].reduce((s, v, i) => s + v * x[i], 0) + m.D[0] * u, P.L1 * di);
  near(m.C[1].reduce((s, v, i) => s + v * x[i], 0), P.R2 * 0.3);
});

test("Beispiel 25's tangent: A, b, cᵀ, d as on M, p. 60", () => {
  const L = C.tangent("bsp25");
  [[-2, -3, -4], [2, 2, 1], [-6, 0, -8]].flat().forEach((v, k) => near(L.A.flat()[k], v, 1e-6));
  [-3, 1, -9].forEach((v, k) => near(L.b[k], v, 1e-6));
  near(L.d, -5, 1e-6);
});
