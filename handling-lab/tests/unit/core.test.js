// The handling core against a second route (a numerical derivative, a constant length checked over a turn, a
// round trip) or a number printed in Berger (2021) and its exercise solutions.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as T from "../../src/core/index.js";

const near = (a, b, tol, what) => assert.ok(Math.abs(a - b) <= tol, `${what}: ${a} against ${b}`);
const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);

test("mobility: ch. 3, p. 113 prints F = 2 for n = 5, g1 = 4, g2 = 2", () => {
  assert.equal(T.mobility(5, 4, 2).F, 2);
  assert.equal(T.mobility(4, 4, 0, 1).verdict, "constrained", "the four-bar by definition");
  assert.equal(T.mobility(3, 3, 0).verdict, "structure", "a triangle cannot move");
  assert.equal(T.mobility(5, 7, 0).verdict, "overconstrained");
});

test("Grashof (ch. 4, p. 26): the shortest link's place names the mechanism", () => {
  assert.equal(T.grashof([100, 30, 90, 70]).mechanism, "crank-rocker");
  assert.equal(T.grashof([30, 100, 90, 70]).mechanism, "double crank");
  assert.equal(T.grashof([100, 70, 30, 90]).mechanism, "double rocker");
  assert.equal(T.grashof([100, 40, 45, 50]).kind, "rocking", "40 + 100 > 45 + 50");
  assert.equal(T.grashof([100, 50, 100, 50]).kind, "change-point", "the parallel crank");
  assert.equal(T.sliderCrankRotates(30, 100, 50), "rotating");
  assert.equal(T.sliderCrankRotates(30, 100, 80), "rocking");
});

test("the four-bar closes with its link lengths at every crank angle, and fails to close when it should", () => {
  const dims = { a: 100, r: 30, l: 90, c: 70 };
  for (let k = 0; k < 36; k++) {
    const s = T.fourBar(dims, k * Math.PI / 18);
    near(dist(s.A, s.B), 90, 1e-9, "coupler"); near(dist(s.B, s.B0), 70, 1e-9, "rocker");
  }
  assert.equal(T.fourBar({ a: 100, r: 60, l: 30, c: 30 }, Math.PI), null);
});

test("the transmission angle by the cosine rule at the folded and stretched positions, where the course says μmin lies", () => {
  const dims = { a: 100, r: 30, l: 90, c: 70 }, m = T.minTransmission(dims);
  // Crank along the frame (φ = 0): BA0 = a − r = 70; cos γ = (l² + c² − 70²)/(2lc).
  const g0 = Math.acos((90 ** 2 + 70 ** 2 - 70 ** 2) / (2 * 90 * 70)), g180 = Math.acos((90 ** 2 + 70 ** 2 - 130 ** 2) / (2 * 90 * 70));
  const acute = g => g > Math.PI / 2 ? Math.PI - g : g;
  near(m.mu, Math.min(acute(g0), acute(g180)), 1e-4, "μmin");
});

test("dead centres: the synthesis gives a linkage whose analysis returns the swing it was built for", () => {
  const { r, l } = T.synthesise({ a: 100, c: 60, psiA: T.rad(70), psi0: T.rad(50) });
  const d = T.deadCentres({ a: 100, r, l, c: 60 }), d2 = T.deadCentres({ a: 100, r, l, c: 60 }, -1);
  const swing = Math.min(Math.abs(d.psi0 - T.rad(50)), Math.abs(d2.psi0 - T.rad(50)));
  near(swing, 0, 1e-9, "ψ0");
  near(dist(d.Ba, [0, 0]), l + r, 1e-9, "stretched"); near(dist(d.Bi, [0, 0]), l - r, 1e-9, "folded");
  near(d.ratio, d.phi0 / (2 * Math.PI - d.phi0), 1e-12, "time ratio");
});

test("two positions: the pole of the Übungsskript's Kap. 4 Aufgabe 1 is (0, −30) with a turn of 90°, worked by hand", () => {
  const p = T.pole([30, 0], [-30, 0], [60, 0], [-30, 30]);
  near(p.P[0], 0, 1e-12, "x"); near(p.P[1], -30, 1e-12, "y"); near(T.deg(p.angle), 90, 1e-12, "φ12");
});

test("Roberts–Chebyshev (ch. 4, p. 113): both cognates keep their link lengths and carry the coupler point", () => {
  const dims = { a: 100, r: 30, l: 90, c: 70, k: [0.4, 0.6] };
  let first;
  for (let i = 0; i < 24; i++) {
    const s = T.fourBar(dims, i * Math.PI / 12), c = T.cognates(s, dims.k);
    const L1 = [0, 1, 2].map(j => dist(c.first[j], c.first[j + 1])), L2 = [0, 1, 2].map(j => dist(c.second[j], c.second[j + 1]));
    const tri = [dist(c.first[1], c.C), dist(c.first[2], c.C), dist(c.second[1], c.C), dist(c.second[2], c.C)];
    if (!first) first = [...L1, ...L2, ...tri];
    [...L1, ...L2, ...tri].forEach((v, j) => near(v, first[j], 1e-9, `length ${j} at step ${i}`));
  }
});

test("the pole of crank and rocker gives ω3/ω1, against a numerical derivative of ψ(φ)", () => {
  const dims = { a: 100, r: 30, l: 90, c: 70 };
  for (const phi of [0.3, 1.5, 2.9, 4.4]) {
    const h = 1e-6, d = (T.fourBar(dims, phi + h).psi - T.fourBar(dims, phi - h).psi) / (2 * h);
    near(T.velocityRatio(T.fourBar(dims, phi)).ratio, d, 1e-6, `at φ = ${phi}`);
  }
  assert.equal(T.poleCount(4), 6);
});

test("Übung 5_1: f = 2z³ − z⁴ from f′(1) = 2, Ca = 3 at z = 0.5, CM = 3.961 at z = 0.68377", () => {
  const c = T.quintic({ f1: 1, v1: 2 });
  [0, 0, 0, 2, -1, 0].forEach((v, i) => near(c[i], v, 1e-12, `a${i}`));
  const C = T.characteristic(T.polynomial(c));
  near(C.Ca.value, 3, 1e-9, "Ca"); near(C.Ca.z, 0.5, 1e-6, "z");
  near(C.CM.value, 3.961, 5e-4, "CM"); near(C.CM.z, 0.68377, 1e-4, "z of CM");
});

test("Übung 5_2: f = 50/9 z³ − 61/9 z⁴ + 20/9 z⁵, Cv = 1.587 at z = 0.62, output 23.68° at 74.4°", () => {
  const c = T.quintic({ f1: 1, v1: 2 / 3, a1: -32 / 9 });
  near(c[3], 50 / 9, 1e-12, "a3"); near(c[4], -61 / 9, 1e-12, "a4"); near(c[5], 20 / 9, 1e-12, "a5");
  const law = T.polynomial(c), C = T.characteristic(law);
  near(C.Cv.value, 1.587, 1e-3, "Cv"); near(C.Cv.z, 0.62, 0.005, "z");
  near(0.62 * 120, 74.4, 1e-12, "drive"); near(law.f(0.62) * 45, 23.68, 0.01, "output");
});

test("Übung 5_3: Cv = 1.5, Ca = 6; at 50 rpm ω = 5.236 s⁻¹ (the solution prints 5.54), peaks 5.24 s⁻¹ and 104.7 s⁻²", () => {
  const C = T.characteristic(T.LAWS.cubic);
  near(C.Cv.value, 1.5, 1e-9, "Cv"); near(C.Ca.value, 6, 1e-9, "Ca");
  const w = 2 * Math.PI * 50 / 60, p = T.peaks(C, T.rad(40), T.rad(60), w);
  near(w, 5.236, 5e-4, "ω"); near(p.v, 5.236, 5e-3, "ψ̇max"); near(p.a, 104.7, 0.05, "ψ̈max");
});

test("the laws start and end at rest where they should, and their characteristic values match a numerical derivative", () => {
  for (const [key, law] of Object.entries(T.LAWS)) {
    near(law.f(0), 0, 1e-12, `${key} f(0)`); near(law.f(1), 1, 1e-12, `${key} f(1)`);
    for (const z of [0.2, 0.55, 0.8]) {
      const h = 1e-5;
      near((law.f(z + h) - law.f(z - h)) / (2 * h), law.v(z), 1e-6, `${key} f′`);
      near((law.v(z + h) - law.v(z - h)) / (2 * h), law.a(z), 1e-4, `${key} f″`);
    }
  }
  near(T.characteristic(T.LAWS.quintic).Cv.value, 1.875, 1e-9, "5th power Cv = 15/8 at z = 0.5, by hand");
  near(T.characteristic(T.LAWS.sine).Ca.value, 2 * Math.PI, 1e-9, "the sine's Ca = 2π, by hand");
});

test("the cam: the pitch curve keeps the lift, and the curvature is the base circle's where the follower rests", () => {
  const dims = { rG: 40, rR: 10, sH: 20, phiP: T.rad(120), phiR1: T.rad(60), phiN: T.rad(120) };
  const c = T.cam(T.LAWS.quintic, dims);
  for (const p of c.pts) near(Math.hypot(...p.pitch), 50 + p.s, 1e-9, "radius");
  const rest = c.pts.find(p => p.phi > T.rad(320));
  near(rest.rho, 50, 1e-9, "ρB at rest"); near(rest.mu, Math.PI / 2, 1e-12, "μ at rest");
  for (const [k, q] of c.profile.entries()) {
    near(dist(q, c.pts[k].pitch), 10, 1e-9, "profile a roller radius from the pitch curve");
    assert.ok(Math.hypot(...q) < Math.hypot(...c.pts[k].pitch), "and inside it");
  }
});

// The cam drawn turned by φ must put its pitch point of φ under the roller, at (0, r0 + s): the first drawing turned it
// the other way, and the roller floated above the cam.
test("the turned cam brings the pitch point of its angle to the top, under the roller", () => {
  const dims = { rG: 40, rR: 10, sH: 30, phiP: T.rad(120), phiR1: T.rad(60), phiN: T.rad(120) };
  const c = T.cam(T.LAWS.quintic, dims);
  for (const k of [30, 120, 300]) {
    const p = c.pts[k], q = T.turned(p.pitch, p.phi);
    near(q[0], 0, 1e-9, "x"); near(q[1], 50 + p.s, 1e-9, "y");
  }
});

test("indexing: ch. 6, p. 19 prints φS = 180° and nR = 4 for two stations and ga = 2", () => {
  assert.deepEqual(T.indexing(2, 2), { phiS: 180, nR: 4 });
  assert.equal(T.indexing(8, 1).phiS, 45, "8 stations give 45° (ch. 6, p. 21)");
});

test("grippers: 2000 m gives 763 mbar (ch. 3, p. 60); −0.6 to −0.9 bar raises the force 1.5 times (p. 63)", () => {
  near(T.airPressure(2000), 76300, 1e-9, "p at 2000 m");
  const F = pu => T.suctionForce({ po: 101300, pu: 101300 + pu, A: 1e-3, n3: 0.8, eta: 0.9, z: 4, S: 2 });
  near(F(-90000) / F(-60000), 1.5, 1e-12, "ratio");
  near(T.magnetForce({ A: 1e-4, B: 1, mur: Infinity }), 1e-4 / (2 * T.MU0), 1e-9, "Fh = AB²/2μ0 for μr → ∞");
});
