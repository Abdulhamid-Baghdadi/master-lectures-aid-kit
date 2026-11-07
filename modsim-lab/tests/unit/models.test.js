// The core's models against closed forms and second routes. Each test names its right result's source.
import { test } from "node:test";
import assert from "node:assert/strict";
import { g, smd, pendel, pendelRest, rolle, rolleRest, springS, rlc, twoMass, receptance, doppel, motor, shaker,
  cartPendulum, chain2, modes2, traceRoute, classify, run, VALUES } from "../../src/core/index.js";

const close = (a, b, rel, msg) => assert.ok(Math.abs(a - b) <= rel * Math.max(1, Math.abs(b)), `${msg}: ${a} against ${b}`);
/** Times where a sampled signal crosses zero upwards, interpolated. */
const upCrossings = (t, y) => t.flatMap((_, k) => k > 0 && y[k - 1] < 0 && y[k] >= 0 ? [t[k - 1] + (t[k] - t[k - 1]) * (-y[k - 1]) / (y[k] - y[k - 1])] : []);

test("one mass: ω0 = √(k/m), f0 = ω0/2π, T0 = 1/f0, ωD = √(ω0² − (c/2m)²) (VO pp. 7–8, by definition)", () => {
  const s = smd({ m: 2, k: 800, c: 8 });
  close(s.w0, 20, 1e-12, "ω0"); close(s.f0, 20 / (2 * Math.PI), 1e-12, "f0"); close(s.T0, 2 * Math.PI / 20, 1e-12, "T0");
  close(s.wD, Math.sqrt(400 - 4), 1e-12, "ωD");
});

test("one mass: the simulated free decay rings at ωD (closed form ωD, hand-checked crossings)", () => {
  const s = smd({ m: 1, k: 400, c: 4 });
  const r = run(s, [0.1, 0], 5, 5000), z = upCrossings(r.t, r.x.map(x => x[0]));
  const period = (z.at(-1) - z[0]) / (z.length - 1);
  close(2 * Math.PI / period, s.wD, 1e-4, "ωD from the run");
});

test("one mass: without damping and force the energy stays (by definition, RK4 drift below 1e-8)", () => {
  const s = smd({ m: 1, k: 400, c: 0 }), r = run(s, [0.1, 0], 2, 4000);
  close(r.E.at(-1), r.E[0], 1e-8, "energy");
});

test("pendulum: small swings last T0 = 2π√(L1/g) (VO p. 11, ω0 = √(g/L1))", () => {
  const p = pendel({ m: 1, L1: 1 }), r = run(p, [0.01, 0], 10, 10000);
  const z = upCrossings(r.t, r.x.map(x => x[0])), period = (z.at(-1) - z[0]) / (z.length - 1);
  close(period, 2 * Math.PI * Math.sqrt(1 / g), 1e-5, "period");
});

test("pendulum: at 90° the nonlinear period is 1.18034 times the small-angle one (hand-checked: 2K(1/√2)/π, K(1/√2) = Γ(1/4)²/(4√π) = 1.854075)", () => {
  const p = pendel({ m: 1, L1: 1 }), r = run(p, [Math.PI / 2, 0], 20, 20000);
  const z = upCrossings(r.t, r.x.map(x => x[0])), period = (z.at(-1) - z[0]) / (z.length - 1);
  close(period / p.T0, 1.18034, 1e-4, "ratio");
});

test("pendulum: rest angles nπ without the spring (VO p. 13); stable spiral at 0, saddle at π (VO pp. 17–18)", () => {
  const rest = pendelRest({ m: 1, L1: 1 });
  assert.deepEqual(rest.map(p => Math.round(p / Math.PI)), [-2, -1, 0, 1, 2]);
  const p = pendel({ m: 1, L1: 1, cD: 0.5 }), j0 = p.jac(0), jpi = p.jac(Math.PI);
  assert.equal(classify(j0[0][0] + j0[1][1], j0[0][0] * j0[1][1] - j0[0][1] * j0[1][0]), "stable spiral");
  assert.equal(classify(jpi[0][0] + jpi[1][1], jpi[0][0] * jpi[1][1] - jpi[0][1] * jpi[1][0]), "saddle (unstable)");
});

test("pendulum: with the torsion spring π is no longer a rest angle (hand-checked: mgL sin φ + k_D φ = 0)", () => {
  const rest = pendelRest({ m: 1, L1: 1, kD: 20 });
  assert.deepEqual(rest, [0]);
});

test("pendulum with roller: dS/dφ1 by formula equals the difference quotient (by definition)", () => {
  for (const p of [-0.7, 0, 0.4, 1.2]) {
    const h = 1e-6, num = (springS(p + h, 0.5, 0.25).S - springS(p - h, 0.5, 0.25).S) / (2 * h);
    close(springS(p, 0.5, 0.25).dS, num, 1e-8, `φ = ${p}`);
  }
});

test("pendulum with roller: at L1 = 0.5, L2 = 0.25 the sheet's (2 sin φ + cos φ)/(4S) is twice dS/dφ (hand-checked, VO p. 21)", () => {
  for (const p of [0.1, 0.8]) {
    const { S, dS } = springS(p, 0.5, 0.25);
    close((2 * Math.sin(p) + Math.cos(p)) / (4 * S), 2 * dS, 1e-12, `φ = ${p}`);
  }
});

test("pendulum with roller: the lab's equation keeps its energy (Lagrange from K of VO p. 22, by definition)", () => {
  const m = rolle(VALUES.rolle), r = run(m, [0, 0], 3, 6000);
  close(r.E.at(-1), r.E[0], 1e-7, "energy");
  const rest = rolleRest(m);
  assert.ok(rest !== null && Math.abs(m.moment(rest)) < 1e-9);
});

test("RLC: ω0 = 1/√(LC) (VO p. 26); the capacitor charges to C·U (by definition)", () => {
  const c = rlc({ R: 10, L: 0.1, C: 1e-3, U: 2 });
  close(c.w0, 100, 1e-12, "ω0");
  const r = run(c, [0, 0], 1, 4000);
  close(r.x.at(-1)[0], 2e-3, 1e-6, "q(∞)");
});

test("two masses: the TM3 note's eig(K,M) gives λ = 500 and 3000, f0 = 3.5588 and 8.7173 Hz (Zusatz Material, p. 2)", () => {
  const t = twoMass(VALUES.zweimasse);
  close(t.modes[0].lambda, 500, 1e-12, "λ1"); close(t.modes[1].lambda, 3000, 1e-12, "λ2");
  close(t.modes[0].f, 3.5588, 1e-4, "f1"); close(t.modes[1].f, 8.7173, 1e-4, "f2");
});

test("two masses: the trace route gives the same λ as det(K − λM) = 0 (second route)", () => {
  const t = twoMass(VALUES.zweimasse), tr = traceRoute(t.K, t.M);
  close(tr.lambda[0], 500, 1e-12, "λ1"); close(tr.lambda[1], 3000, 1e-12, "λ2");
  close(tr.tr, 3500, 1e-12, "trace");
});

test("two masses: the eigenvector of 500 is (1, 3), of 3000 (1, −1/3) (hand-checked: (K − λM)v = 0)", () => {
  const [a, b] = twoMass(VALUES.zweimasse).modes;
  close(a.v[1], 3, 1e-12, "mode 1"); close(b.v[1], -1 / 3, 1e-12, "mode 2");
});

test("two masses: the receptance peaks near f0 (TM3 note p. 2 reads 3.566 and 8.728 Hz off its plot)", () => {
  const t = twoMass(VALUES.zweimasse);
  const peak = (lo, hi) => { let best = [0, 0]; for (let f = lo; f <= hi; f += 1e-4) { const a = receptance(t, 2 * Math.PI * f)[0]; if (a > best[1]) best = [f, a]; } return best[0]; };
  close(peak(3, 4.5), 3.5588, 2e-3, "first peak"); close(peak(8, 9.5), 8.7173, 2e-3, "second peak");
});

test("double pendulum: undamped, the energy stays over 10 s of chaos (by definition; RK4 at 1 ms, drift < 1e-6)", () => {
  const d = doppel({ m: 1, L1: 1 }), r = run(d, [2, 2, 0, 0], 10, 10000);
  close(r.E.at(-1), r.E[0], 1e-6, "energy");
});

test("double pendulum: linear ω² from det(K − λM) with M = [8/3 1; 1 2/3], K = (g/L)[3 0; 0 1] (hand-checked: 7λ²/9 − 14λ/3 + 3 = 0 for g/L = 1)", () => {
  const ms = modes2([[3, 0], [0, 1]], [[8 / 3, 1], [1, 2 / 3]]);
  close(ms[0].lambda, (14 - Math.sqrt(112)) * 3 / 14, 1e-12, "λ1"); close(ms[1].lambda, (14 + Math.sqrt(112)) * 3 / 14, 1e-12, "λ2");
});

test("double pendulum: at one degree the run swings at the linear ω1 (second route)", () => {
  const d = doppel({ m: 1, L1: 1 }), v = d.modes[0].v, a = 0.01;
  const r = run(d, [a * v[0], a * v[1], 0, 0], 20, 20000);
  const z = upCrossings(r.t, r.x.map(x => x[0])), period = (z.at(-1) - z[0]) / (z.length - 1);
  close(2 * Math.PI / period, d.modes[0].omega, 1e-3, "ω1");
});

test("motor: ω∞ = k_T u_A/(R_A c_L + k_M k_T) without load (hand-checked from p. 42 at rest), and the run reaches it", () => {
  const m = motor(VALUES.motor);
  close(m.wInf, 0.05 * 12 / (1e-3 + 0.0025), 1e-12, "ω∞");
  const r = run(m, [0, 0, 0], 60, 60000);
  close(r.x.at(-1)[2], m.wInf, 1e-4, "ω(60 s)");
});

test("shaker: x∞ = h_S U_S/(R_S k_S), the same with and without the back-EMF (hand-checked at rest)", () => {
  for (const backEmf of [false, true]) {
    const s = shaker({ ...VALUES.shaker, backEmf }), r = run(s, [0, 0, 0], 10, 20000);
    close(r.x.at(-1)[1], 5 * 4 / (4 * 2000), 1e-4, `x∞, back-EMF ${backEmf}`);
  }
});

test("task 2: the hanging block rests at y = m_ges g/k (the group's eq. 44, report p. 8) and keeps its energy undamped", () => {
  const v = { ...VALUES.task2, c: 0, cT: 0, F01: 0, M01: 0 }, m = cartPendulum(v);
  close(m.rest, 0.3 * g / 10, 1e-12, "y*");
  const r = run(m, [0, 0.3, 0, 0], 2, 20000);
  close(r.E.at(-1), r.E[0], 1e-6, "energy");
});

test("task 2: the linear frequencies are √(k/m_ges) and √((m_s g l1 + k_T)/I) (hand-checked, decoupled at θ = 0)", () => {
  const m = cartPendulum(VALUES.task2);
  close(m.modes[0].omega, Math.sqrt(10 / 0.3), 1e-12, "block");
  close(m.modes[1].omega, Math.sqrt((0.15 * g * 0.2 + 40) / (0.04 * (0.1 / 3 + 0.1))), 1e-12, "pendulum");
});

test("task 3: the horizontal version keeps its energy undamped (by definition)", () => {
  const m = cartPendulum({ ...VALUES.task3, dir: "horizontal", c: 0, cT: 0, F01: 0 });
  const r = run(m, [0.02, 0.5, 0, 0], 3, 30000);
  close(r.E.at(-1), r.E[0], 1e-6, "energy");
});

test("tasks 5–7: the chain's eigenfrequencies are VO p. 28's |K − λM| = 0 (second route: the trace formula)", () => {
  const c = chain2(VALUES.task5), tr = traceRoute(c.K, c.M);
  close(c.modes[0].lambda, tr.lambda[0], 1e-9, "λ1"); close(c.modes[1].lambda, tr.lambda[1], 1e-9, "λ2");
});

test("tasks 5–7: a slow road passes through: |X2/ŵ0| → 1 as ω → 0 (by definition, static)", () => {
  close(chain2(VALUES.task5).transmit(1e-4), 1, 1e-6, "static transmissibility");
});
