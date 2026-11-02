// The finite element core against a number printed in the slides (Krach 2018, 2020a, 2021; Puhwein 2020) or a second,
// closed-form route worked by hand: the analytic bar and beam, a closed-form eigenvalue, the exact cosine.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as T from "../../src/core/index.js";

const near = (a, b, tol, what) => assert.ok(Math.abs(a - b) <= tol, `${what}: ${a} against ${b}`);
const rel = (a, b, tol, what) => assert.ok(Math.abs(a / b - 1) <= tol, `${what}: ${a} against ${b}`);

test("the dense solver: [A]{x} = {b} returns x, and a model free to move is an error that says what to do", () => {
  const A = [[4, -2, 1], [-2, 4, -2], [1, -2, 4]], x = [1, -2, 3];
  T.solveLinear(A, T.mulVec(A, x)).forEach((v, i) => near(v, x[i], 1e-12, `x${i}`));
  assert.throws(() => T.solveLinear([[1, -1], [-1, 1]], [1, 0]), /singular.*Add a support/);
});

test("Jacobi eigenvalues: A·v = λ·v for each pair, ascending", () => {
  const A = [[2, -1, 0], [-1, 2, -1], [0, -1, 2]], { values, vectors } = T.eigSym(A);
  // The tridiagonal [2, −1] matrix of order 3 has λ = 2 − 2cos(kπ/4), worked by hand.
  [1, 2, 3].forEach((k, i) => near(values[i], 2 - 2 * Math.cos(k * Math.PI / 4), 1e-12, `λ${k}`));
  vectors.forEach((v, i) => T.mulVec(A, v).forEach((y, j) => near(y, values[i] * v[j], 1e-10, `A·v = λ·v, mode ${i}`)));
});

test("02 FEM-Einführung, p. 30: the two-spring matrix is [k1 + k12, −k12; −k12, k2 + k12], and the forces balance", () => {
  const p = { k1: 300, k2: 700, k12: 500, f1: 40, f2: -90 }, r = T.twoSprings(p);
  assert.deepEqual(r.K, [[800, -500], [-500, 1200]]);
  const [u1, u2] = r.u;
  near(p.k1 * u1 + p.k12 * (u1 - u2), p.f1, 1e-12, "node 1, the slide's first line");
  near(p.k2 * u2 + p.k12 * (u2 - u1), p.f2, 1e-12, "node 2, the slide's second line");
  near(r.reactions[0] + r.reactions[1] + p.f1 + p.f2, 0, 1e-12, "the walls carry the load");
  // Assembled element by element, the same three springs held at both ends give the same matrix.
  assert.deepEqual(T.springChain([300, 500, 700], { bothEnds: true }).K, [[800, -500], [-500, 1200]]);
});

test("02 FEM-Einführung, p. 49: the polygon's perimeter rises to π·d, the hexagon giving 3d (by hand)", () => {
  near(T.polygon(6, 100).perimeter, 300, 1e-9, "hexagon");
  near(T.polygon(4, 1).area, 0.5, 1e-12, "the square in a circle of d = 1 has area ½");
  let last = 0;
  for (const n of [3, 6, 12, 24, 48, 96]) { const p = T.polygon(n, 1).perimeter; assert.ok(p > last && p < Math.PI); last = p; }
  // Doubling n quarters the error: the error goes as 1/n².
  rel(T.polygon(200, 1).perimeterError / T.polygon(400, 1).perimeterError, 4, 1e-3, "error ratio");
});

test("the bar: an end force is exact with one element, F·L/(EA) (03 p. 30 with E = σ/ε of 05 p. 9)", () => {
  const p = { L: 1000, A: 100, E: 210000, F: 1000 };
  for (const n of [1, 3, 10]) near(T.bar({ ...p, n }).u.at(-1), 1000 * 1000 / (210000 * 100), 1e-12, `n = ${n}`);
  for (const s of T.bar({ ...p, n: 5 }).sigma) near(s, 10, 1e-9, "σ = F/A = 10 MPa in every element");
});

test("the bar under a line load: nodes exact at any mesh; the support stress converges as h, against the analytic line", () => {
  const p = { L: 1000, A: 100, E: 210000, q: 2 }, ex = T.barExact(p);
  const errs = [2, 4, 8, 16, 32].map(n => {
    const fe = T.bar({ ...p, n });
    fe.x.forEach((x, i) => near(fe.u[i], ex.u(x), 1e-12, `node ${i} of ${n}`));
    // Each element's stress is the exact one at its middle, the field being linear.
    fe.sigma.forEach((s, e) => near(s, ex.sigma((e + 0.5) * fe.h), 1e-9, `element ${e} of ${n}`));
    return ex.sigma(0) - fe.sigma[0];
  });
  errs.slice(1).forEach((e, k) => rel(errs[k] / e, 2, 1e-9, "halving h halves the support error"));
});

test("02 FEM-Einführung, p. 40: the beam 10 × 10 × 100 mm under 100 N gives σ = M/W = 60 MPa, by hand and by elements", () => {
  near(T.bendingStress(100 * 100, 10, 10), 60, 1e-12, "σ = M/W");
  const p = { L: 100, b: 10, t: 10, E: 70000, F: 100 };
  for (const n of [1, 2, 7]) {
    const fe = T.cantilever({ ...p, n });
    near(fe.at(0).M / fe.W, 60, 1e-9, `σ at the clamp, ${n} elements`);
  }
});

test("03 Nichtlinear, p. 20: beam elements give the tip deflection F·l³/(3EIy) exactly, and the whole cubic curve", () => {
  const p = { L: 100, b: 10, t: 10, E: 70000, F: 100 }, ex = T.cantileverExact(p);
  near(ex.tip, 100 * 100 ** 3 / (3 * 70000 * (10 * 10 ** 3 / 12)), 1e-12, "the slide's formula");
  for (const n of [1, 4]) {
    const fe = T.cantilever({ ...p, n });
    near(fe.w.at(-1), ex.tip, 1e-12, `tip with ${n} elements`);
    for (const x of [13, 50, 87]) near(fe.at(x).w, ex.w(x), 1e-12, `w(${x})`);
  }
});

test("the cantilever under a line load: nodes exact (qL⁴/8EI, by hand), the clamp moment converging as h²", () => {
  const p = { L: 100, b: 10, t: 10, E: 70000, q: 1 }, ex = T.cantileverExact(p);
  const errs = [1, 2, 4, 8, 16].map(n => {
    const fe = T.cantilever({ ...p, n });
    fe.x.forEach((x, i) => near(fe.w[i], ex.w(x), 1e-12, `node ${i} of ${n}`));
    return ex.M(0) - fe.at(0).M;
  });
  // By hand: the element's end moment misses q·h²/12 of the parabola, so halving h quarters the error.
  errs.forEach((e, k) => near(e, (100 / 2 ** k) ** 2 / 12, 1e-6, `error with ${2 ** k} elements`));
  near(T.cantilever({ ...p, n: 2 }).at(0).M, 4791.667, 1e-3, "the practice question's 4791.7 N·mm");
});

test("04 Integration–Extrapolation, p. 55: each shape function is 1 at its node, 0 at the others, and they sum to 1", () => {
  for (const [kind, S] of Object.entries(T.SHAPES)) {
    S.nodes.forEach((z, j) => S.N(z).forEach((v, i) => near(v, i === j ? 1 : 0, 1e-15, `${kind} N${i}(${z})`)));
    for (const z of [0.1, 0.37, 0.8]) near(S.N(z).reduce((s, v) => s + v, 0), 1, 1e-15, `${kind} sum at ${z}`);
  }
  // A quadratic element reproduces a parabola exactly; the linear one is off by h²/4·max|y″|/2 at mid-element.
  for (const x of [0.13, 0.5, 0.91]) near(T.interpolate(z => z * z, "quadratic", 1)(x), x * x, 1e-15, `x² at ${x}`);
  near(T.interpolate(z => z * z, "linear", 4)(0.125) - 0.125 ** 2, 0.25 ** 2 / 4, 1e-15, "linear error at mid-element");
});

test("04 Integration–Extrapolation, p. 62: 100 and 150 at the Gauss points extrapolate to about 80 and 170 (81.7 and 168.3)", () => {
  const [a, b] = T.extrapolate(100, 150);
  near(a, 81.70, 0.005, "node beyond 100"); near(b, 168.30, 0.005, "node beyond 150");
  near(a, 80, 2, "the sketch's 80"); near(b, 170, 2, "the sketch's 170");
  // A linear field is recovered exactly at every node, extrapolated and averaged alike.
  const r = T.stressRecovery(x => 100 + 2 * x, 50, 5);
  r.x.forEach((x, i) => near(r.averaged[i], 100 + 2 * x, 1e-9, `node at ${x}`));
  // p. 67: a field capped at yield is overshot at the node beyond the cap.
  const c = T.stressRecovery(x => Math.min(200, 60 + 3 * x), 100, 4);
  assert.ok(c.averaged.at(-1) === 200 || c.elements.some(e => Math.max(...e.nodal) > 200), "extrapolation passes the yield point");
});

test("Newton's iteration converges quadratically to F(u) = P, against bisection", () => {
  const p = { k: 100, c: 10, P: 500 }, run = T.newton(p), F = T.springForce(p.k, p.c).F;
  let lo = 0, hi = 10;
  for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2; if (F(m) < p.P) lo = m; else hi = m; }
  near(run.u, lo, 1e-9, "same root");
  const res = run.history[0].iters.map(it => Math.abs(it.residual)).filter(r => r > 1e-6);
  const last = res.slice(-3);
  assert.ok(last[2] < last[1] ** 2 / 50, `residual squares near the root: ${last.join(", ")}`);
  assert.equal(T.newton({ k: 100, c: 0, P: 500 }).history[0].iters.length, 2, "a linear spring takes one solve");
  // A softening spring peaks at u = √(k/3|c|): ask for more force than its peak and no step converges.
  const up = Math.sqrt(100 / 6), peak = 100 * up - 2 * up ** 3;
  assert.equal(T.newton({ k: 100, c: -2, P: peak * 1.2, steps: 5 }).converged, false, "above the peak");
  const below = T.newton({ k: 100, c: -2, P: peak * 0.8, steps: 5 });
  assert.ok(below.converged && below.u > 0 && below.u < up, "below the peak it converges on the rising branch");
});

test("Puhwein 2020, pp. 7–8: ω0 = √(k/m), f0 = ω0/2π, T0 = 1/f0", () => {
  const r = T.sdof(400, 1);
  near(r.omega, 20, 1e-12, "ω0"); near(r.f, 20 / (2 * Math.PI), 1e-12, "f0"); near(r.T, 1 / r.f, 1e-12, "T0");
});

test("Puhwein 2020, p. 28: the two-mass det(K − λM) = 0 by the quadratic equals the eigenvalues of the chain", () => {
  const p = { m1: 2, m2: 0.5, k1: 300, k2: 120 }, two = T.twoMass(p), chain = T.chainModes([2, 0.5], [300, 120]);
  two.lambda.forEach((l, i) => near(chain.lambda[i], l, 1e-9, `λ${i + 1}`));
  // det(K − λM) = 0 at both roots.
  for (const l of two.lambda) near((420 - l * 2) * (120 - l * 0.5) - 120 * 120, 0, 1e-7, "det");
  // Mode shapes agree after scaling (Jacobi gives them to a largest amplitude of 1).
  two.modes.forEach((m, i) => near(chain.modes[i][0] / chain.modes[i][1], m[0] / m[1], 1e-9, `mode ${i + 1}`));
});

test("a chain of n equal masses fixed at one end matches the closed form ω = 2√(k/m)·sin((2j − 1)π/(2(2n + 1))), by hand", () => {
  const n = 5, k = 250, m = 0.4, r = T.chainModes(Array(n).fill(m), Array(n).fill(k));
  r.omega.forEach((w, j) => near(w, 2 * Math.sqrt(k / m) * Math.sin((2 * j + 1) * Math.PI / (2 * (2 * n + 1))), 1e-9, `ω${j + 1}`));
});

test("time steps: below 2/ω both rules follow cos ωt; above it the explicit one blows up and the implicit one stays bounded", () => {
  const omega = 10, T0 = 2 * Math.PI / omega;
  const dt = T0 / 200, steps = 400, ex = T.integrate({ omega, dt, steps, method: "explicit" }), im = T.integrate({ omega, dt, steps, method: "implicit" });
  ex.forEach((u, k) => near(u, Math.cos(omega * k * dt), 2e-3, `explicit at step ${k}`));
  im.forEach((u, k) => near(u, Math.cos(omega * k * dt), 2e-3, `implicit at step ${k}`));
  near(T.criticalStep(omega), 0.2, 1e-15, "Δt crit = 2/ω");
  const big = T.integrate({ omega, dt: 0.21, steps: 100, method: "explicit" });
  assert.ok(Math.max(...big.map(Math.abs)) > 1e3, "1.05 Δt crit grows");
  const edge = T.integrate({ omega, dt: 0.19, steps: 1000, method: "explicit" });
  assert.ok(Math.max(...edge.map(Math.abs)) < 10, "0.95 Δt crit stays bounded");
  const imBig = T.integrate({ omega, dt: 1, steps: 1000, method: "implicit" });
  assert.ok(Math.max(...imBig.map(Math.abs)) <= 1 + 1e-12, "the implicit rule never exceeds the start at 5 Δt crit");
});
