// The exercises' own models and the steps the solution sheets take: the change of coordinates into RNF and BNF (so a
// gain worked in normal-form coordinates can be carried back), the circuits, the motor and the crane trolley, a closed
// loop with observer, saturation and a nonlinear plant, the PI outer loop of lab task 2 and lab task 1's factor dr.
// Pure and deterministic.
import { zeros, eye, matMul, matVec, transpose, inv, charpoly, polyFromRoots, simulate } from "./lti.js";
import { ctrb, obsv, normalForms, ss2tf, closedLoop } from "./ss.js";

const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0);

/** The RNF of (A, b, cᵀ, d) and the matrix S with x_RNF = S·x (slides p. 5: S constant and regular). Since
 *  Q_S,RNF = S·Q_S, S = Q_S,RNF·Q_S⁻¹; it exists only when the system is controllable. */
export function toRnf(A, b, c, d = 0) {
  const G = ss2tf(A, b, c, d), nf = normalForms(G.num, G.den).rnf;
  const S = matMul(ctrb(nf.A, nf.b), inv(ctrb(A, b)));
  return { ...nf, S, T: inv(S), G };
}
/** The BNF and its S with x_BNF = S·x: Q_B,BNF = Q_B·S⁻¹, so S = Q_B,BNF⁻¹·Q_B; it exists only when observable. */
export function toBnf(A, b, c, d = 0) {
  const G = ss2tf(A, b, c, d), nf = normalForms(G.num, G.den).bnf;
  const S = matMul(inv(obsv(nf.A, nf.c)), obsv(A, c));
  return { ...nf, S, T: inv(S), G };
}

/** The course's pole placement by coefficient comparison (slides p. 13): the plant's a_i from det(sE − A), the wanted
 *  p_i from the poles, r_RNFᵀ = [p0 − a0 … p_(n−1) − a_(n−1)], then rᵀ = r_RNFᵀ·S in the plant's own coordinates. */
export function placeByRnf(A, b, c, poles) {
  const a = [...charpoly(A)].reverse().slice(0, A.length), p = [...polyFromRoots(poles)].reverse().slice(0, A.length);
  const rRnf = p.map((v, i) => v - a[i]), { S } = toRnf(A, b, c);
  return { a, p, rRnf, r: matVec(transpose(S), rRnf) };
}
/** The observer the same way (slides p. 27): ℓ_BNF = [p0 − a0 …]ᵀ, then ℓ = S⁻¹·ℓ_BNF, since ℓ_BNF = S·ℓ. */
export function observeByBnf(A, b, c, poles) {
  const a = [...charpoly(A)].reverse().slice(0, A.length), p = [...polyFromRoots(poles)].reverse().slice(0, A.length);
  const lBnf = p.map((v, i) => v - a[i]), { T } = toBnf(A, b, c);
  return { a, p, lBnf, l: matVec(T, lBnf) };
}

/** A closed loop in time, as the lab tasks simulate it: u = −rᵀx̂ + Kf·w (x̂ = x without an observer), u clipped to
 *  ±umax when given, the plant linear (A, b) or nonlinear (f(x, u) returns ẋ), the observer on the design model.
 *  Returns t, the plant states x, the estimates x̂, u and v = cᵀx. */
export function runLoop({ A, b, c }, { r, Kf = 1, l = null, w = 1, T, n = 800, x0 = null, xhat0 = null, umax = Infinity, plant = null, f = null }) {
  const N = A.length, P = plant ?? { A, b };
  const deriv = f ?? ((x, u) => matVec(P.A, x).map((v, i) => v + P.b[i] * u));
  const clip = u => Math.max(-umax, Math.min(umax, u));
  const law = z => clip(-dot(r, l ? z.slice(N) : z.slice(0, N)) + Kf * w);
  const rhs = (t, z) => {
    const x = z.slice(0, N), u = law(z), dx = deriv(x, u);
    if (!l) return dx;
    const xh = z.slice(N), e = dot(c, x) - dot(c, xh);
    return [...dx, ...matVec(A, xh).map((v, i) => v + b[i] * u + l[i] * e)];
  };
  const start = [...(x0 ?? new Array(N).fill(0)), ...(l ? xhat0 ?? new Array(N).fill(0) : [])];
  const run = simulate(rhs, start, T, n);
  return { t: run.t, x: run.x.map(z => z.slice(0, N)), xhat: run.x.map(z => (l ? z.slice(N) : z.slice(0, N))),
    u: run.x.map(law), v: run.x.map(z => dot(c, z.slice(0, N))) };
}

/** Lab task 1's measure of speed: dr = (0.85·tr + 0.25·ts)·(1 + 2.2·Xmax/Xmin), from stepinfo with rise time 5–95 %
 *  and settling threshold 1 % (Kubinger and Lang 2021, p. 2). */
export const drFactor = ({ RiseTime, SettlingTime, SettlingMin, SettlingMax }) =>
  (0.85 * RiseTime + 0.25 * SettlingTime) * (1 + 2.2 * SettlingMax / SettlingMin);

/** Beispiel 20 and lab task 1: R1, L1 in series, then R2 and C2 in series across the output; x = [iL; uC], u = Us,
 *  v = Uh = R2·iL + uC (output open). scale turns volts into the reading (lab task 1: 500 rpm per volt). */
export const circuit20 = ({ R1, L1, R2, C2 }, scale = 1) => ({
  A: [[-(R1 + R2) / L1, -1 / L1], [1 / C2, 0]], b: [1 / L1, 0], c: [scale * R2, scale], d: 0 });

/** Beispiel 21: x = [iA; n], u = UA, v = n, disturbance ML through bz. From UA = RA·iA + LA·diA/dt + c·2π·n and
 *  J·2π·dn/dt = c·iA − ML (S2 pp. 11–12). */
export const motor21 = ({ RA, LA, c, J }) => ({
  A: [[-RA / LA, -c * 2 * Math.PI / LA], [c / (J * 2 * Math.PI), 0]], b: [1 / LA, 0], bz: [0, -1 / (J * 2 * Math.PI)], c: [0, 1], d: 0 });

/** The crane trolley of Beispiel 22 and lab task 2, x = [φ; ω; x; v], u = Fa. f is the nonlinear model by Lagrange
 *  (worked here; φ from the vertical, the load at x + l·sin φ); lin its tangent at φ = ω = 0 (M p. 54). */
export function crane({ mK, mL, l, g = 9.8065 }) {
  const f = ([phi, om, , v], F) => {
    const s = Math.sin(phi), co = Math.cos(phi);
    const acc = (F + mL * g * s * co + mL * l * om * om * s) / (mK + mL * s * s);
    return [om, -(g / l) * s - acc / l * co, v, acc];
  };
  const lin = { A: [[0, 1, 0, 0], [-g * (mK + mL) / (mK * l), 0, 0, 0], [0, 0, 0, 1], [mL * g / mK, 0, 0, 0]],
    b: [0, -1 / (mK * l), 0, 1 / mK], c: [0, 0, 1, 0], d: 0 };
  return { f, ...lin };
}

/** Beispiel 27, worked here (no solution sheet): one loop through C1, R1, C2, L1 and R2; x = [uC1; uC2; i], u = ua,
 *  v = [ub; uc] with ub across C2 and uc = ua − uC1 − R1·i − uC2 across R2 and L1. */
export const circuit27 = ({ C1, R1, C2, R2, L1 }) => ({
  A: [[0, 0, 1 / C1], [0, 0, 1 / C2], [-1 / L1, -1 / L1, -(R1 + R2) / L1]], b: [0, 0, 1 / L1],
  C: [[0, 1, 0], [-1, -1, -R1]], D: [0, 1] });
/** Beispiel 28, worked here: one loop through C1, R1, C2, L1 and R2; x = [uC1; uC2; i], u = u1, v = [u2; u3] with u2
 *  across L1 (= L1·di/dt) and u3 = R2·i. */
export const circuit28 = ({ C1, R1, C2, R2, L1 }) => ({
  A: [[0, 0, 1 / C1], [0, 0, 1 / C2], [-1 / L1, -1 / L1, -(R1 + R2) / L1]], b: [0, 0, 1 / L1],
  C: [[-1, -1, -(R1 + R2)], [0, 0, R2]], D: [1, 0] });

/** Lab task 2's outer loop (task sheet, Abbildung 2): the PI controller kp·(1 + 1/(s·Tn)) on e = w − v replaces the
 *  prefilter. States [x; z] with ż = e: ẋ = (A − b rᵀ − kp·b cᵀ)x + (kp/Tn)·b·z + kp·b·w. */
export function piLoop(A, b, c, r, kp, Tn) {
  const n = A.length, Ar = closedLoop(A, b, r), M = zeros(n + 1);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) M[i][j] = Ar[i][j] - kp * b[i] * c[j];
    M[i][n] = kp / Tn * b[i];
  }
  for (let j = 0; j < n; j++) M[n][j] = -c[j];
  return { A: M, b: [...b.map(v => kp * v), 1], c: [...c, 0], d: 0 };
}

/** The determinant's area: b and Ab as the sides of a parallelogram in the state plane (n = 2). */
export const spanArea = (A, b) => { const Ab = matVec(A, b); return b[0] * Ab[1] - b[1] * Ab[0]; };


