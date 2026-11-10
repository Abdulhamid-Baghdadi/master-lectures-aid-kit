// The models of the ModSim exercises: each its equation of motion as ẋ = f(t, x), its linear state space where the
// source gives one, its closed forms (ω0, ωD, eigenfrequencies, steady states) and its energy. The symbols are the
// source's (Puhwein, VO-Aufgaben-mit-Lösungen; page numbers in data/labs.json and docs/sources/). Where the source's
// printed equation differs from a re-derivation, both are here: the lab's is the default, the sheet's is named so.
// Pure: no page, no clock, no randomness; integration is the kit's fixed-step Runge–Kutta.
import { simulate, cAdd, cMul, cDiv, cAbs, C } from "../../../kit/core/index.js";

/** Standard gravity, 9.80665 m/s², by definition of standard gravity; the student's scripts use the same value. */
export const g = 9.80665;

/** The two roots of a·s² + b·s + c as complex pairs [re, im], the one with the smaller real part (or imaginary part
 *  below zero) first. */
export function quadRoots(a, b, c) {
  const d = b * b - 4 * a * c;
  if (d >= 0) { const r = Math.sqrt(d); return [[(-b - r) / (2 * a), 0], [(-b + r) / (2 * a), 0]]; }
  const r = Math.sqrt(-d) / (2 * a);
  return [[-b / (2 * a), -r], [-b / (2 * a), r]];
}
/** Eigenvalues of a 2 × 2 matrix from its trace and determinant: s² − tr·s + det = 0. */
export const eig2 = A => quadRoots(1, -(A[0][0] + A[1][1]), A[0][0] * A[1][1] - A[0][1] * A[1][0]);
export const det2 = A => A[0][0] * A[1][1] - A[0][1] * A[1][0];
/** x with M x = r, for a 2 × 2 M (Cramer's rule). */
export function solve2(M, r) {
  const d = det2(M);
  return [(r[0] * M[1][1] - M[0][1] * r[1]) / d, (M[0][0] * r[1] - r[0] * M[1][0]) / d];
}
/** The generalised eigenproblem K v = λ M v of two degrees of freedom: λ (= ω²) from det(K − λM) = 0, ascending,
 *  each with its mode shape v scaled so that v[0] = 1 (or v[1] = 1 when the first coordinate stands still). */
export function modes2(K, M) {
  const a = det2(M), b = -(K[0][0] * M[1][1] + K[1][1] * M[0][0] - K[0][1] * M[1][0] - K[1][0] * M[0][1]), c = det2(K);
  const lambdas = quadRoots(a, b, c).map(z => z[0]).sort((x, y) => x - y);
  return lambdas.map(l => {
    const p = K[0][1] - l * M[0][1], q = K[0][0] - l * M[0][0];
    // Uncoupled (p = 0): the mode moves the coordinate whose own equation λ satisfies.
    const v = Math.abs(p) > 1e-12 ? [1, -q / p] : Math.abs(q) <= 1e-9 * Math.max(1, Math.abs(K[0][0])) ? [1, 0] : [0, 1];
    return { lambda: l, omega: Math.sqrt(l), f: Math.sqrt(l) / (2 * Math.PI), v };
  });
}
/** The trace route the TM3 note and the Jacobi matrix use: λ1,2 = tr/2 ∓ √((tr/2)² − det) of M⁻¹K. */
export function traceRoute(K, M) {
  const Mi = [[M[1][1], -M[0][1]], [-M[1][0], M[0][0]]].map(r => r.map(v => v / det2(M)));
  const A = [[Mi[0][0] * K[0][0] + Mi[0][1] * K[1][0], Mi[0][0] * K[0][1] + Mi[0][1] * K[1][1]],
             [Mi[1][0] * K[0][0] + Mi[1][1] * K[1][0], Mi[1][0] * K[0][1] + Mi[1][1] * K[1][1]]];
  const tr = A[0][0] + A[1][1], d = det2(A), r = Math.sqrt(tr * tr / 4 - d);
  return { MinvK: A, tr, det: d, lambda: [tr / 2 - r, tr / 2 + r] };
}
/** Type of an equilibrium of a two-state system from tr and det of its Jacobian (Wagg and Neild's chart, VO p. 16). */
export function classify(tr, det) {
  if (det < 0) return "saddle (unstable)";
  if (Math.abs(tr) < 1e-12) return "centre";
  const spiral = tr * tr < 4 * det;
  return `${tr < 0 ? "stable" : "unstable"} ${spiral ? "spiral" : "node"}`;
}
/** A run of ẋ = f(t, x) from x0 over [0, T] in n fixed steps, with the energy along it when the model has one. */
export function run(model, x0, T, n) {
  const r = simulate(model.f, x0, T, n);
  return model.energy ? { ...r, E: r.x.map((x, k) => model.energy(x, r.t[k])) } : r;
}

// ---------------------------------------------------------------- 1 Ein-Massen-Schwinger (VO pp. 7–9)
/** m ẍ + c ẋ + k x = F1(t) with F1 = F0·sin(Ω t), as the Simulink model's Fcn 10*sin(2*pi*u) (p. 9). State [x, ẋ]. */
export function smd({ m, k, c, F0 = 0, Om = 2 * Math.PI }) {
  const F = t => F0 * Math.sin(Om * t), w0 = Math.sqrt(k / m), delta = c / (2 * m);
  return {
    F, f: (t, [x, v]) => [v, (F(t) - c * v - k * x) / m],
    A: [[0, 1], [-k / m, -c / m]], B: [0, 1 / m],
    w0, f0: w0 / (2 * Math.PI), T0: 2 * Math.PI / w0, delta, D: delta / w0,
    wD: Math.sqrt(Math.max(0, w0 * w0 - delta * delta)),
    energy: ([x, v]) => 0.5 * m * v * v + 0.5 * k * x * x,
  };
}

// ---------------------------------------------------------------- 2 Pendel (VO pp. 10–18)
/** m L1² φ̈ + k_D φ + c_D φ̇ = −M1(t) − m g L1 sin φ (p. 10, φ0 = 0), M1 = M̂1·cos(Ω1 t). linear: sin φ → φ (p. 11). */
export function pendel({ m, L1, kD = 0, cD = 0, M0 = 0, Om = 2 * Math.PI, linear = false }) {
  const J = m * L1 * L1, M1 = t => M0 * Math.cos(Om * t);
  const s = linear ? p => p : Math.sin;
  return {
    J, M1, f: (t, [p, w]) => [w, (-M1(t) - m * g * L1 * s(p) - kD * p - cD * w) / J],
    A: [[0, 1], [-kD / J - g / L1, -cD / J]], B: [0, -1 / J],
    w0: Math.sqrt(g / L1), w0D: Math.sqrt(g / L1 + kD / J), T0: 2 * Math.PI * Math.sqrt(L1 / g),
    /** The Jacobian at a rest angle φ* (p. 17 with the spring and damper kept). */
    jac: p => [[0, 1], [-(g / L1) * Math.cos(p) - kD / J, -cD / J]],
    energy: ([p, w]) => 0.5 * J * w * w + m * g * L1 * (1 - Math.cos(p)) + 0.5 * kD * p * p,
  };
}
/** The rest angles in [−2π, 2π]: m g L1 sin φ + k_D φ = 0, by bisection on a fine grid (k_D = 0 gives nπ, p. 13). */
export function pendelRest({ m, L1, kD = 0 }) {
  const h = p => m * g * L1 * Math.sin(p) + kD * p, out = [];
  const N = 4000, a = -2 * Math.PI - 1e-9, b = 2 * Math.PI + 1e-9;
  for (let i = 0; i < N; i++) {
    let x0 = a + (b - a) * i / N, x1 = a + (b - a) * (i + 1) / N;
    if (Math.abs(h(x0)) < 1e-12) { out.push(x0); continue; }
    if (h(x0) * h(x1) < 0) {
      for (let k = 0; k < 60; k++) { const xm = (x0 + x1) / 2; if (h(x0) * h(xm) <= 0) x1 = xm; else x0 = xm; }
      out.push((x0 + x1) / 2);
    }
  }
  return out.map(p => Math.abs(p) < 1e-9 ? 0 : p).filter((p, i, all) => i === 0 || Math.abs(p - all[i - 1]) > 1e-6);
}

// ---------------------------------------------------------------- 3 Pendel mit Rolle (VO pp. 19–24)
/** The spring length S(φ1) and its derivative, anchor L1 to the right of O and L2 above it, φ1 from the x-axis
 *  towards y (down) (p. 20). */
export function springS(p, L1, L2) {
  const S = Math.hypot(L1 * (1 - Math.cos(p)), L2 + L1 * Math.sin(p));
  return { S, dS: (L1 * L1 * (1 - Math.cos(p)) * Math.sin(p) + (L2 + L1 * Math.sin(p)) * L1 * Math.cos(p)) / S };
}
/** J φ̈1 = (m1/2 + m2) g L1 cos φ1 − k(S − l0)·dS/dφ1. The lab's J = m1L1²/3 + (3/2)m2L1² (rolling disc, φ̇2 = L1φ̇1/r,
 *  from K on p. 22). variant "sheet" is p. 21's printed form: J = m1L1²/3 + (3/2)m2·r and the spring moment
 *  k(S − l0)(2 sin φ1 + cos φ1)/(4S), which holds only for L1 = 0.5, L2 = 0.25 and lacks the lever L1. */
export function rolle({ m1, m2, r, L1 = 0.5, L2 = 0.25, k, l0, variant = "lab" }) {
  const sheet = variant === "sheet";
  const J = sheet ? m1 * L1 * L1 / 3 + 1.5 * m2 * r : m1 * L1 * L1 / 3 + 1.5 * m2 * L1 * L1;
  const moment = p => {
    const { S, dS } = springS(p, L1, L2);
    const spring = sheet ? k * (S - l0) * (2 * Math.sin(p) + Math.cos(p)) / (4 * S) : k * (S - l0) * dS;
    return (m1 / 2 + m2) * g * L1 * Math.cos(p) - spring;
  };
  return {
    J, moment, f: (t, [p, w]) => [w, moment(p) / J],
    energy: ([p, w]) => 0.5 * J * w * w - (m1 / 2 + m2) * g * L1 * Math.sin(p) + 0.5 * k * (springS(p, L1, L2).S - l0) ** 2,
  };
}
/** The rest angle in (−π/2, π/2) where the moment vanishes, by bisection; null if there is none. */
export function rolleRest(model) {
  let a = -Math.PI / 2 + 1e-6, b = Math.PI / 2 - 1e-6;
  if (model.moment(a) * model.moment(b) > 0) return null;
  for (let k = 0; k < 80; k++) { const c = (a + b) / 2; if (model.moment(a) * model.moment(c) <= 0) b = c; else a = c; }
  return (a + b) / 2;
}

// ---------------------------------------------------------------- 4 RLC (VO pp. 25–26)
/** L q̈ + R q̇ + q/C = u(t) (p. 25), state [q, i], output y = u_R = R·i; u a step of U at t = 0. */
export function rlc({ R, L, C: Cap, U = 1 }) {
  const w0 = 1 / Math.sqrt(L * Cap), delta = R / (2 * L);
  return {
    f: (t, [q, i]) => [i, (U - q / Cap - R * i) / L],
    A: [[0, 1], [-1 / (L * Cap), -R / L]], B: [0, 1 / L], Cy: [0, R],
    w0, delta, wD: Math.sqrt(Math.max(0, w0 * w0 - delta * delta)),
    stored: ([q, i]) => ({ magnetic: 0.5 * L * i * i, electric: q * q / (2 * Cap) }),
    powers: ([q, i]) => ({ source: U * i, resistor: R * i * i }),
  };
}

// ---------------------------------------------------------------- 5 Zwei-Massen-Schwinger (VO pp. 27–31)
/** M ẍ + C ẋ + K x = F (p. 28), state [x1, x2, ẋ1, ẋ2] as on p. 30; F1 = F1hat·sin(Ω t), F2 = F2hat·sin(Ω t) as the
 *  Simulink model's Fcn blocks (p. 31). */
export function twoMass({ m1, m2, k1, k2, c1, c2, F1 = 0, F2 = 0, Om = 2 * Math.PI }) {
  const M = [[m1, 0], [0, m2]], K = [[k1 + k2, -k2], [-k2, k2]], Cd = [[c1 + c2, -c2], [-c2, c2]];
  const A = [[0, 0, 1, 0], [0, 0, 0, 1],
    [-(k1 + k2) / m1, k2 / m1, -(c1 + c2) / m1, c2 / m1], [k2 / m2, -k2 / m2, c2 / m2, -c2 / m2]];
  return {
    M, K, Cd, A, B: [[0, 0], [0, 0], [1 / m1, 0], [0, 1 / m2]],
    f: (t, [x1, x2, v1, v2]) => [v1, v2,
      (F1 * Math.sin(Om * t) - c1 * v1 - k1 * x1 + c2 * (v2 - v1) + k2 * (x2 - x1)) / m1,
      (F2 * Math.sin(Om * t) - c2 * (v2 - v1) - k2 * (x2 - x1)) / m2],
    modes: modes2(K, M), trace: traceRoute(K, M),
    energy: ([x1, x2, v1, v2]) => 0.5 * m1 * v1 * v1 + 0.5 * m2 * v2 * v2 + 0.5 * k1 * x1 * x1 + 0.5 * k2 * (x2 - x1) ** 2,
  };
}
/** |X_i/F̂1| at angular frequency ω: (K − ω²M + jωC)·X = [1, 0]ᵀ, solved in complex numbers (Cramer). */
export function receptance({ M, K, Cd }, w, input = [1, 0]) {
  const Z = (i, j) => C(K[i][j] - w * w * M[i][j], w * Cd[i][j]);
  const d = cAdd(cMul(Z(0, 0), Z(1, 1)), cMul(C(-1), cMul(Z(0, 1), Z(1, 0))));
  const b = input.map(v => (Array.isArray(v) ? v : C(v)));
  const x1 = cDiv(cAdd(cMul(b[0], Z(1, 1)), cMul(C(-1), cMul(Z(0, 1), b[1]))), d);
  const x2 = cDiv(cAdd(cMul(Z(0, 0), b[1]), cMul(C(-1), cMul(b[0], Z(1, 0)))), d);
  return [cAbs(x1), cAbs(x2)];
}

// ---------------------------------------------------------------- 6 Doppelpendel (VO pp. 32–40)
/** Two equal uniform rods (m, L1), φ from the vertical. Lagrange (pp. 36–38) divided by mL1²/2:
 *  (8/3)φ̈1 + φ̈2 cos Δ − φ̇2² sin Δ + 3(g/L1) sin φ1 − κ Δ − γ Δ̇ = 0,
 *  (2/3)φ̈2 + φ̈1 cos Δ + φ̇1² sin Δ + (g/L1) sin φ2 + κ Δ + γ Δ̇ = 0, Δ = φ2 − φ1, κ = 2k_D/(mL1²), γ = 2c_D/(mL1²).
 *  The sheet (p. 38) writes k_D and c_D unscaled; with k_D = c_D = 0 both are p. 33's equations. State [φ1, φ2, φ̇1, φ̇2]. */
export function doppel({ m, L1, kD = 0, cD = 0 }) {
  // The motion is the manipulator's (task 13) with two equal rods, no point masses and the spring at A only: one copy.
  const kap = 2 * kD / (m * L1 * L1), w2 = g / L1;
  const { f, energy } = manipulator({ m1: m, m2: m, l1: L1, l2: L1, m3: 0, m4: 0, k1: 0, c1: 0, k2: kD, c2: cD });
  const Ml = [[8 / 3, 1], [1, 2 / 3]], Kl = [[3 * w2 + kap, -kap], [-kap, w2 + kap]];
  return { f, Ml, Kl, modes: modes2(Kl, Ml), energy };
}

/** Task 13, Robotermanipulator: link 1 (uniform rod m1, l1) from the base, joint mass m3 at its end, link 2 (uniform rod
 *  m2, l2) with end mass m4; absolute angles φ1, φ2 from the downward vertical. Torsion springs and dampers k1, c1 at
 *  the base and k2, c2 at the elbow (on φ2 − φ1); motor torques M1 = M01·cos(Ω1 t) at the base and M2 = M02·cos(Ω2 t)
 *  at the elbow, the elbow's reaction on link 1, so Q = (M1 − M2, M2). Worked here (Lagrange 2nd kind):
 *  a11 = m1l1²/3 + (m2+m3+m4)l1², a22 = m2l2²/3 + m4l2², b = (m2/2+m4)l1l2, G1 = (m1/2+m2+m3+m4)g l1, G2 = (m2/2+m4)g l2. */
export function manipulator({ m1, l1, m2, l2, m3 = 0, m4 = 0, k1 = 0, c1 = 0, k2 = 0, c2 = 0, M01 = 0, M02 = 0, Om1 = 1, Om2 = 1 }) {
  const a11 = m1 * l1 * l1 / 3 + (m2 + m3 + m4) * l1 * l1, a22 = m2 * l2 * l2 / 3 + m4 * l2 * l2, b = (m2 / 2 + m4) * l1 * l2;
  const G1 = (m1 / 2 + m2 + m3 + m4) * g * l1, G2 = (m2 / 2 + m4) * g * l2;
  const M1 = t => M01 * Math.cos(Om1 * t), M2 = t => M02 * Math.cos(Om2 * t);
  const f = (t, [p1, p2, w1, w2]) => {
    const d = p2 - p1, cs = Math.cos(d), sn = Math.sin(d);
    const r1 = M1(t) - M2(t) + b * w2 * w2 * sn - G1 * Math.sin(p1) - k1 * p1 + k2 * d - c1 * w1 + c2 * (w2 - w1);
    const r2 = M2(t) - b * w1 * w1 * sn - G2 * Math.sin(p2) - k2 * d - c2 * (w2 - w1);
    const [x1, x2] = solve2([[a11, b * cs], [b * cs, a22]], [r1, r2]);
    return [w1, w2, x1, x2];
  };
  const Ml = [[a11, b], [b, a22]], Kl = [[G1 + k1 + k2, -k2], [-k2, G2 + k2]];
  return {
    f, a11, a22, b, G1, G2, Ml, Kl, modes: modes2(Kl, Ml),
    energy: ([p1, p2, w1, w2]) => 0.5 * a11 * w1 * w1 + 0.5 * a22 * w2 * w2 + b * w1 * w2 * Math.cos(p2 - p1)
      - G1 * Math.cos(p1) - G2 * Math.cos(p2) + 0.5 * k1 * p1 * p1 + 0.5 * k2 * (p2 - p1) ** 2,
  };
}

// ---------------------------------------------------------------- 7 E-Motor (VO pp. 41–42)
/** u_A = R_A i_A + L_A di_A/dt + k_M ω, J φ̈ + c_L φ̇ = k_T i_A (pp. 41–42), state [i_A, φ, ω] as p. 42. M_L, a load
 *  torque against the motor, is the Simulink model's Constant 10 (p. 42); the sheet's ODE has none. */
export function motor({ RA, LA, kM, kT, J, cL, uA, ML = 0 }) {
  const wInf = (kT * uA - RA * ML) / (RA * cL + kM * kT);
  return {
    f: (t, [i, p, w]) => [(uA - RA * i - kM * w) / LA, w, (kT * i - cL * w - ML) / J],
    A: [[-RA / LA, 0, -kM / LA], [0, 0, 1], [kT / J, 0, -cL / J]], B: [1 / LA, 0, 0],
    poles: [[0, 0], ...quadRoots(1, RA / LA + cL / J, (RA * cL + kM * kT) / (LA * J))],
    wInf, iInf: (cL * wInf + ML) / kT,
    powers: ([i, , w]) => ({ source: uA * i, resistor: RA * i * i, shaft: kT * i * w, friction: cL * w * w, load: ML * w }),
  };
}

// ---------------------------------------------------------------- 8 Shaker (VO pp. 43–45)
/** U_S = R_S i_S + L_S di_S/dt, m_S ẍ + d_S ẋ + k_S x = h_S i_S (p. 43), state [i_S, x, v]. backEmf adds −h_S·v to the
 *  circuit, the coupling the sheet leaves out and its coupled Simscape model shows (p. 44). U_S a step at t = 0. */
export function shaker({ RS, LS, hS, mS, kS, dS, US, backEmf = false }) {
  const e = backEmf ? hS : 0;
  return {
    f: (t, [i, x, v]) => [(US - RS * i - e * v) / LS, v, (hS * i - kS * x - dS * v) / mS],
    A: [[-RS / LS, 0, -e / LS], [0, 0, 1], [hS / mS, -kS / mS, -dS / mS]], B: [1 / LS, 0, 0],
    iInf: US / RS, xInf: hS * US / (RS * kS), w0: Math.sqrt(kS / mS),
    powers: ([i, , v]) => ({ source: US * i, resistor: RS * i * i, force: hS * i * v, damper: dS * v * v }),
  };
}

// ---------------------------------------------------------------- Task sheet 2 and 3: a pendulum on a sprung block
/** Task 2 (vertical guide, y down) and task 3 (horizontal, x right): block m2, rod m1 of length l1 pinned at the
 *  block, point mass m3 at the rod's end, spring k and damper c on the block, torsion spring k_T and damper c_T at the
 *  pin, F1 = F01·cos(Ω t) on the block, M1 = M01·cos(Ω t) at the pin. Lagrange 2nd kind, worked here:
 *  m_ges = m1 + m2 + m3, m_s = m1/2 + m3, I = l1²(m1/3 + m3). State [s, θ, ṡ, θ̇], s = y or x. */
export function cartPendulum({ dir = "vertical", m1, m2, m3, l1, k, c, kT, cT, F01 = 0, M01 = 0, Om = 10 }) {
  const mg = m1 + m2 + m3, ms = m1 / 2 + m3, I = l1 * l1 * (m1 / 3 + m3), v = dir === "vertical";
  const F = t => F01 * Math.cos(Om * t), Mo = t => M01 * Math.cos(Om * t);
  const f = (t, [s, th, sd, w]) => {
    const sn = Math.sin(th), cs = Math.cos(th);
    const M = v ? [[mg, -ms * l1 * sn], [-ms * l1 * sn, I]] : [[mg, ms * l1 * cs], [ms * l1 * cs, I]];
    const r1 = v ? F(t) + mg * g - k * s - c * sd + ms * l1 * w * w * cs : F(t) - k * s - c * sd + ms * l1 * w * w * sn;
    const r2 = Mo(t) - ms * g * l1 * sn - kT * th - cT * w;
    const [a1, a2] = solve2(M, [r1, r2]);
    return [sd, w, a1, a2];
  };
  const rest = v ? mg * g / k : 0;
  const Ml = v ? [[mg, 0], [0, I]] : [[mg, ms * l1], [ms * l1, I]], Kl = [[k, 0], [0, ms * g * l1 + kT]];
  return {
    f, mg, ms, I, rest, Ml, Kl, modes: modes2(Kl, Ml),
    energy: ([s, th, sd, w]) => {
      const T = v ? 0.5 * mg * sd * sd - ms * l1 * sd * w * Math.sin(th) + 0.5 * I * w * w
        : 0.5 * mg * sd * sd + ms * l1 * sd * w * Math.cos(th) + 0.5 * I * w * w;
      return T - (v ? mg * g * s : 0) - ms * g * l1 * Math.cos(th) + 0.5 * k * s * s + 0.5 * kT * th * th;
    },
  };
}

// ---------------------------------------------------------------- Task sheet 5, 6, 7: two masses (or discs) in a chain
/** m1 ẍ1 + c1(ẋ1 − ẇ) + k1(x1 − w) − c2(ẋ2 − ẋ1) − k2(x2 − x1) = F1, m2 ẍ2 + c2(ẋ2 − ẋ1) + k2(x2 − x1) = F2, with the
 *  path excitation w = ŵ0·cos(Ω t) at the free end of spring 1 (task 5 the road, task 7 the suspension point, task 6 the
 *  shaft's end) and F1, F2 = F0i·cos(Ω t) (task 6's moments). Coordinates from the static rest, so g drops out of
 *  tasks 5 and 7. Worked here: the sheet gives figures only. State [x1, x2, ẋ1, ẋ2]. */
export function chain2({ m1, m2, k1, k2, c1, c2, w0 = 0, F01 = 0, F02 = 0, Om = 10, Om1 = Om, Om2 = Om }) {
  const w = t => w0 * Math.cos(Om * t), wd = t => -w0 * Om * Math.sin(Om * t);
  const M = [[m1, 0], [0, m2]], K = [[k1 + k2, -k2], [-k2, k2]], Cd = [[c1 + c2, -c2], [-c2, c2]];
  return {
    w, M, K, Cd, modes: modes2(K, M),
    f: (t, [x1, x2, v1, v2]) => [v1, v2,
      (F01 * Math.cos(Om1 * t) - c1 * (v1 - wd(t)) - k1 * (x1 - w(t)) + c2 * (v2 - v1) + k2 * (x2 - x1)) / m1,
      (F02 * Math.cos(Om2 * t) - c2 * (v2 - v1) - k2 * (x2 - x1)) / m2],
    /** |X2/ŵ0| at ω: the base drives spring 1 and damper 1, (K − ω²M + jωC)X = [k1 + jωc1, 0]ᵀ. */
    transmit: om => receptance({ M, K, Cd }, om, [C(k1, om * c1), C(0)])[1],
    energy: ([x1, x2, v1, v2]) => 0.5 * m1 * v1 * v1 + 0.5 * m2 * v2 * v2 + 0.5 * k1 * x1 * x1 + 0.5 * k2 * (x2 - x1) ** 2,
  };
}

/** Task 6, 2DoF-Torsionsschwinger, as drawn (PDF p. 3): the shaft's end turned by w(t) = ŵ₀ cos Ω t, and besides it
 *  M₁ = M₀₁ cos Ω₁t on J₁ and M₂ = M₀₂ cos Ω₂t on J₂, each at its own frequency. m1, m2 stand for J₁, J₂. */
export function torsion2({ M01 = 0, M02 = 0, Om1 = 1, Om2 = 1, ...rest }) {
  return chain2({ ...rest, F01: M01, F02: M02, Om1, Om2 });
}

// ---------------------------------------------------------------- Task sheet 1, 4, 8, 9–12 (13 is manipulator above)
// The sheet gives figures only; the readings (degrees of freedom, where things attach) are this lab's and are stated on
// each lab and in the README. Worked here with Lagrange's method of the lecture.

/** Task 1, Elastisches Pendel: block m1 (inertia J1 about its centre) fixed to the end of an axial spring k ∥ damper c,
 *  turning with it; r the distance pivot–block centre (l0 unstretched), φ from the downward vertical; torsion spring
 *  k_T, damper c_T and M1 = M01·cos(Ω t) at the pivot. State [r, φ, ṙ, φ̇]. */
export function elasticPendulum({ m1, J1, l0, k, c = 0, kT = 0, cT = 0, M01 = 0, Om = 1 }) {
  const rest = l0 + m1 * g / k;
  const f = (t, [r, p, rd, w]) => [rd, w,
    (m1 * r * w * w + m1 * g * Math.cos(p) - k * (r - l0) - c * rd) / m1,
    (M01 * Math.cos(Om * t) - 2 * m1 * r * rd * w - m1 * g * r * Math.sin(p) - kT * p - cT * w) / (m1 * r * r + J1)];
  const Ml = [[m1, 0], [0, m1 * rest * rest + J1]], Kl = [[k, 0], [0, m1 * g * rest + kT]];
  return {
    f, rest, Ml, Kl, modes: modes2(Kl, Ml),
    energy: ([r, p, rd, w]) => 0.5 * m1 * (rd * rd + r * r * w * w) + 0.5 * J1 * w * w - m1 * g * r * Math.cos(p)
      + 0.5 * k * (r - l0) ** 2 + 0.5 * kT * p * p,
  };
}

/** Task 4, Unwucht erregter Schwinger: m1 on k1 ∥ c1 from the ground, m2 on k2 ∥ c2 above it, a rod m3, l3 pinned at m1
 *  with m4 at its end turned at the prescribed speed Ω (β = Ω t from the downward vertical). y1, y2 up from the static
 *  rest. Lagrange gives chain2 with m1 + m3 + m4 below and F(t) = −(m3/2 + m4) l3 Ω² cos Ω t on it. */
export function unbalance({ m1, m2, m3, m4, l3, k1, k2, c1 = 0, c2 = 0, Om = 1 }) {
  const mg = m1 + m3 + m4, ms = m3 / 2 + m4, F0 = -ms * l3 * Om * Om;
  return { ...chain2({ m1: mg, m2, k1, k2, c1, c2, F01: F0, Om }), mg, ms, F0, F: t => F0 * Math.cos(Om * t) };
}

/** Task 8, Koppelpendel, read as each rod made of two uniform segments (m_i, l_i) above and below the coupling point
 *  (the sheet's double label), end masses m3, m4 at 2l_i; pivots b apart, the spring k ∥ damper c from l1 down rod 1
 *  to l2 down rod 2, unstretched at length b; torsion k_T, c_T and M_i = M0i·cos(Ω_i t) at each pivot. The spring's
 *  length is exact, not linearised. State [φ1, φ2, φ̇1, φ̇2]. */
export function coupledPendulum({ m1, l1, m2, l2, m3, m4, b, k, c = 0, kT = 0, cT = 0, M01 = 0, M02 = 0, Om1 = 1, Om2 = 1 }) {
  const J1 = 8 / 3 * m1 * l1 * l1 + 4 * m3 * l1 * l1, J2 = 8 / 3 * m2 * l2 * l2 + 4 * m4 * l2 * l2;
  const G1 = 2 * g * l1 * (m1 + m3), G2 = 2 * g * l2 * (m2 + m4);
  const spring = (p1, p2) => {
    const dx = b + l2 * Math.sin(p2) - l1 * Math.sin(p1), dy = l1 * Math.cos(p1) - l2 * Math.cos(p2), S = Math.hypot(dx, dy);
    return { S, d1: -l1 * (dx * Math.cos(p1) + dy * Math.sin(p1)) / S, d2: l2 * (dx * Math.cos(p2) + dy * Math.sin(p2)) / S };
  };
  const f = (t, [p1, p2, w1, w2]) => {
    const { S, d1, d2 } = spring(p1, p2), Fs = -k * (S - b) - c * (d1 * w1 + d2 * w2);
    return [w1, w2, (M01 * Math.cos(Om1 * t) - G1 * Math.sin(p1) - kT * p1 - cT * w1 + Fs * d1) / J1,
      (M02 * Math.cos(Om2 * t) - G2 * Math.sin(p2) - kT * p2 - cT * w2 + Fs * d2) / J2];
  };
  const Ml = [[J1, 0], [0, J2]], Kl = [[G1 + kT + k * l1 * l1, -k * l1 * l2], [-k * l1 * l2, G2 + kT + k * l2 * l2]];
  return {
    f, J1, J2, G1, G2, spring, Ml, Kl, modes: modes2(Kl, Ml),
    energy: ([p1, p2, w1, w2]) => 0.5 * J1 * w1 * w1 + 0.5 * J2 * w2 * w2 - G1 * Math.cos(p1) - G2 * Math.cos(p2)
      + 0.5 * k * (spring(p1, p2).S - b) ** 2 + 0.5 * kT * (p1 * p1 + p2 * p2),
  };
}

/** Tasks 9 and 10, 2-Massen-Schwinger mit Rollen: two solid discs (J = ½ m r²) rolling without slip, axles at x1, x2.
 *  The wall spring k1 ∥ c1 at the axle (task 9) or at the top of the rim (task 10, top: it moves 2x1, to first order);
 *  disc to disc k2 ∥ c2 at axle height. M1 = M01·cos Ω t turns disc 1 (Q = M1/r1), F1 = F01·cos Ω t pulls axle 2.
 *  Linear, so chain2 with 3/2 m and κ² k1, κ = 1 or 2. */
export function rollingDiscs({ m1, m2, r1, k1, k2, c1 = 0, c2 = 0, M01 = 0, F01 = 0, Om = 1, top = false }) {
  const kap2 = top ? 4 : 1;
  return chain2({ m1: 1.5 * m1, m2: 1.5 * m2, k1: kap2 * k1, k2, c1: kap2 * c1, c2, F01: M01 / r1, F02: F01, Om });
}

/** Tasks 11 and 12, Rollen-Pendel: a solid disc m1, radius r, rolling without slip (axle x), a massless rod l from the
 *  axle with point mass m2 (φ from the downward vertical); the wall spring k ∥ c at the top of the rim (task 11: 2x) or
 *  at axle height (task 12: x); M1 = M01·cos Ω t turns the disc, F1 = F01·cos Ω t pulls the axle. Task 3's model with
 *  block 3/2 m1, no rod mass, end mass m2 and force F1 + M1/r. */
export function rollerPendulum({ m1, m2, r, l, k, c = 0, M01 = 0, F01 = 0, Om = 1, top = false }) {
  const kap2 = top ? 4 : 1;
  return cartPendulum({ dir: "horizontal", m1: 0, m2: 1.5 * m1, m3: m2, l1: l, k: kap2 * k, c: kap2 * c, kT: 0, cT: 0, F01: F01 + M01 / r, M01: 0, Om });
}
