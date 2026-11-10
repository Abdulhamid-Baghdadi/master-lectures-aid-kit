// The task-sheet models added on 10 Nov 2026 (tasks 1, 4, 8, 9–12, 13) against closed forms and the energy they keep.
// The sheet gives figures only (docs/sources/task-sheet.md); every closed form here was derived by hand from the lab's
// own M and K (hand-checked), not recalled. Their Lagrange equations are checked against sympy at a test state in
// python-run.test.js (an independent derivation from T, V and D).
import { test } from "node:test";
import assert from "node:assert/strict";
import { g, elasticPendulum, unbalance, coupledPendulum, rollingDiscs, rollerPendulum, manipulator, doppel, run, VALUES } from "../../src/core/index.js";

const close = (a, b, rel, msg) => assert.ok(Math.abs(a - b) <= rel * Math.max(1, Math.abs(b)), `${msg}: ${a} against ${b}`);
const drift = r => Math.max(...r.E.map(e => Math.abs(e - r.E[0])));

test("undamped and undriven, every new task model keeps K + V (by definition; RK4 drift below 1e-7 J)", () => {
  const cases = [
    ["task 1", elasticPendulum({ ...VALUES.task1, c: 0, cT: 0, M01: 0 }), [VALUES.task1.l0 + 0.08, 0.6, 0, 0]],
    ["task 8", coupledPendulum({ ...VALUES.task8, c: 0, cT: 0, M01: 0, M02: 0 }), [0.5, -0.2, 0, 0.3]],
    ["task 9", rollingDiscs({ ...VALUES.task9, c1: 0, c2: 0, M01: 0, F01: 0 }), [0.02, -0.01, 0, 0]],
    ["task 10", rollingDiscs({ ...VALUES.task10, c1: 0, c2: 0, M01: 0, F01: 0 }), [0.02, -0.01, 0, 0]],
    ["task 11", rollerPendulum({ ...VALUES.task11, c: 0, M01: 0, F01: 0 }), [0.05, 1.0, 0, 0]],
    ["task 12", rollerPendulum({ ...VALUES.task12, c: 0, M01: 0, F01: 0 }), [0.05, 1.0, 0, 0]],
    ["task 13", manipulator({ ...VALUES.task13, c1: 0, c2: 0, M01: 0, M02: 0 }), [1.2, -0.5, 0, 0]],
  ];
  for (const [name, m, x0] of cases) assert.ok(drift(run(m, x0, 4, 8000)) < 1e-7, `${name} drifts ${drift(run(m, x0, 4, 8000))} J`);
});

test("task 4: undamped, K + V of the two masses grows by the work of the unbalance force F(t)·ẏ₁ (hand-checked balance)", () => {
  const u = unbalance({ ...VALUES.task4, c1: 0, c2: 0 }), r = run(u, [0, 0, 0, 0], 1, 20000);
  let W = 0;
  for (let i = 1; i < r.t.length; i++) W += (r.t[i] - r.t[i - 1]) * (u.F(r.t[i]) * r.x[i][2] + u.F(r.t[i - 1]) * r.x[i - 1][2]) / 2;
  close(r.E.at(-1) - r.E[0], W, 1e-5, "ΔE against ∫F ẏ₁ dt");
  close(u.F(0), -(VALUES.task4.m3 / 2 + VALUES.task4.m4) * VALUES.task4.l3 * VALUES.task4.Om ** 2, 1e-12, "F(0) = −(m₃/2 + m₄) l₃ Ω²");
});

test("task 1: decoupled at rest, ω_r = √(k/m₁) and ω_φ = √((m₁ g r* + k_T)/(m₁ r*² + J₁)), r* = l₀ + m₁g/k (hand-checked)", () => {
  const v = { ...VALUES.task1, kT: 0.3 }, e = elasticPendulum(v), rs = v.l0 + v.m1 * g / v.k;
  close(e.rest, rs, 1e-12, "r*");
  const w = [Math.sqrt(v.k / v.m1), Math.sqrt((v.m1 * g * rs + v.kT) / (v.m1 * rs * rs + v.J1))].sort((a, b) => a - b);
  close(e.modes[0].omega, w[0], 1e-10, "lower"); close(e.modes[1].omega, w[1], 1e-10, "upper");
  assert.deepEqual(e.modes.map(m => m.v.map(Math.abs)).sort(), [[0, 1], [1, 0]], "each mode moves one coordinate only");
});

/** The two λ of [[K11, −k2], [−k2, k2]] against diag(M1, M2), from the characteristic quadratic by hand. */
const chainLambda = (M1, M2, K11, k2) => {
  const s = K11 / M1 + k2 / M2, p = (K11 * k2 - k2 * k2) / (M1 * M2), r = Math.sqrt(s * s / 4 - p);
  return [s / 2 - r, s / 2 + r];
};

test("task 4: λ of M = diag(m₁+m₃+m₄, m₂), K = [k₁+k₂ −k₂; −k₂ k₂] from the quadratic (hand-checked)", () => {
  const v = VALUES.task4, l = chainLambda(v.m1 + v.m3 + v.m4, v.m2, v.k1 + v.k2, v.k2);
  unbalance(v).modes.forEach((m, i) => close(m.lambda, l[i], 1e-10, `λ${i + 1}`));
});

test("tasks 9 and 10: solid discs rolling (M = 3/2 m), the top-rim spring stretching by 2x₁ (K₁₁ = 4k₁ + k₂) (hand-checked)", () => {
  for (const [id, kap] of [["task9", 1], ["task10", 2]]) {
    const v = VALUES[id], l = chainLambda(1.5 * v.m1, 1.5 * v.m2, kap * kap * v.k1 + v.k2, v.k2);
    rollingDiscs(v).modes.forEach((m, i) => close(m.lambda, l[i], 1e-10, `${id} λ${i + 1}`));
  }
});

test("tasks 11 and 12: λ₁ + λ₂ and λ₁λ₂ from tr and det of M⁻¹K (hand-checked)", () => {
  for (const [id, kap] of [["task11", 2], ["task12", 1]]) {
    const v = VALUES[id], K = kap * kap * v.k, m = 1.5 * v.m1, ms = rollerPendulum(v).modes;
    close(ms[0].lambda + ms[1].lambda, K / m + g * (m + v.m2) / (m * v.l), 1e-10, `${id} sum`);
    close(ms[0].lambda * ms[1].lambda, K * g / (m * v.l), 1e-10, `${id} product`);
  }
});

test("task 8: equal pendulums swing at ω₁ = √((G + k_T)/J) and ω₂ = √((G + k_T + 2k l₁²)/J) (hand-checked)", () => {
  const v = { ...VALUES.task8, m2: VALUES.task8.m1, l2: VALUES.task8.l1, m4: VALUES.task8.m3, kT: 0.2 };
  const J = 8 / 3 * v.m1 * v.l1 ** 2 + 4 * v.m3 * v.l1 ** 2, G = 2 * g * v.l1 * (v.m1 + v.m3), c = coupledPendulum(v);
  close(c.modes[0].omega, Math.sqrt((G + v.kT) / J), 1e-10, "in phase");
  close(c.modes[1].omega, Math.sqrt((G + v.kT + 2 * v.k * v.l1 ** 2) / J), 1e-10, "against each other");
  // Massless rods, point masses m at L = 2l₁, spring at a = l₁: ω₁ = √(g/L), ω₂ = √(g/L + 2k a²/(m L²)).
  const p = coupledPendulum({ ...v, m1: 0, m2: 0, kT: 0 }), L = 2 * v.l1;
  close(p.modes[0].omega, Math.sqrt(g / L), 1e-10, "point masses, in phase");
  close(p.modes[1].omega, Math.sqrt(g / L + 2 * v.k * v.l1 ** 2 / (v.m3 * L * L)), 1e-10, "point masses, against");
});

test("task 8: the exact spring length gives back the linear K near rest (by definition: a difference quotient)", () => {
  const c = coupledPendulum(VALUES.task8), h = 1e-6;
  const acc = x => c.f(0, x).slice(2);
  const a1 = acc([h, 0, 0, 0]), a2 = acc([0, h, 0, 0]);
  close(-a1[0] * c.Ml[0][0] / h, c.Kl[0][0], 1e-5, "K11"); close(-a2[0] * c.Ml[0][0] / h, c.Kl[0][1], 1e-5, "K12");
});

test("task 13: two point masses on massless links, λ = (g/l)(2 ∓ √2) (hand-checked: λ² − 4λ + 2 = 0 in g/l)", () => {
  const m = manipulator({ m1: 0, m2: 0, m3: 1, m4: 1, l1: 0.5, l2: 0.5, k1: 0, k2: 0 });
  close(m.modes[0].lambda, g / 0.5 * (2 - Math.SQRT2), 1e-10, "λ1"); close(m.modes[1].lambda, g / 0.5 * (2 + Math.SQRT2), 1e-10, "λ2");
});

test("task 13: with equal rods and no point masses it is the double pendulum of VO example 6 (one copy of the core)", () => {
  const d = doppel({ m: 1, L1: 0.8, kD: 3, cD: 0.2 }), m = manipulator({ m1: 1, m2: 1, l1: 0.8, l2: 0.8, m3: 0, m4: 0, k1: 0, c1: 0, k2: 3, c2: 0.2 });
  const x = [0.4, -0.3, 0.7, -1.1];
  m.f(0, x).forEach((v, i) => close(d.f(0, x)[i], v, 1e-12, `ẋ${i}`));
});
