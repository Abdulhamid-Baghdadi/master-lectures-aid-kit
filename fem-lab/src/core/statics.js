// The static finite element models of the labs, in N, mm and MPa (N/mm²) as the course writes them: springs as the
// simplest elements, the bar, the cantilever beam, the polygon that discretises a circle, the 1-D shape functions,
// Gauss-point extrapolation and the Newton iteration of a nonlinear spring. Pure: no page, no clock, no randomness.
import { zeros, solve } from "./linalg.js";

/** The two-spring system of Krach (2020a), p. 29–30: k1 holds node 1, k2 node 2, k12 joins them. */
export function twoSprings({ k1, k2, k12, f1, f2 }) {
  const K = [[k1 + k12, -k12], [-k12, k2 + k12]];
  const [u1, u2] = solve(K, [f1, f2]);
  // Each wall carries what its spring pulls; the joining spring's force is its stretch times its stiffness.
  return { K, u: [u1, u2], spring: { k1: k1 * u1, k12: k12 * (u2 - u1), k2: -k2 * u2 }, reactions: [-k1 * u1, -k2 * u2] };
}

/** Adds an element matrix ke into K at the global degrees of freedom dofs: the assembly every FE program does. */
export function assemble(K, ke, dofs) {
  dofs.forEach((I, i) => dofs.forEach((J, j) => { K[I][J] += ke[i][j]; }));
  return K;
}

/** A chain of springs between nodes 0 … n, node 0 (and node n when both ends are held) fixed: the stiffness matrix
 *  of the free nodes, assembled element by element. */
export function springChain(ks, { bothEnds = false } = {}) {
  const n = ks.length, all = zeros(n + 1);
  ks.forEach((k, e) => assemble(all, [[k, -k], [-k, k]], [e, e + 1]));
  const free = Array.from({ length: n + 1 }, (_, i) => i).filter(i => i > 0 && !(bothEnds && i === n));
  return { K: free.map(i => free.map(j => all[i][j])), free };
}

/** A bar of length L (mm), section A (mm²) and modulus E (MPa), held at x = 0, under an end force F (N) and a line
 *  load q (N/mm), in n equal linear elements with consistent nodal loads. Each element has one stress, constant. */
export function bar({ L, A, E, F = 0, q = 0, n }) {
  const h = L / n, k = E * A / h, all = zeros(n + 1), f = new Array(n + 1).fill(0);
  for (let e = 0; e < n; e++) {
    assemble(all, [[k, -k], [-k, k]], [e, e + 1]);
    f[e] += q * h / 2; f[e + 1] += q * h / 2;
  }
  f[n] += F;
  const u = [0, ...solve(all.slice(1).map(r => r.slice(1)), f.slice(1))];
  const x = u.map((_, i) => i * h);
  const sigma = Array.from({ length: n }, (_, e) => E * (u[e + 1] - u[e]) / h);
  return { x, u, sigma, h, dofs: n };
}

/** The bar's exact solution, worked by hand from N′ = −q, N = EA u′: u(x) and σ(x). */
export const barExact = ({ L, A, E, F = 0, q = 0 }) => ({
  u: x => (F * x + q * (L * x - x * x / 2)) / (E * A),
  sigma: x => (F + q * (L - x)) / A,
});

/** The Euler–Bernoulli beam element's stiffness (Hermite cubics), degrees of freedom w1, θ1, w2, θ2. */
export const beamElement = (EI, h) => {
  const c = EI / h ** 3;
  return [[12, 6 * h, -12, 6 * h], [6 * h, 4 * h * h, -6 * h, 2 * h * h], [-12, -6 * h, 12, -6 * h], [6 * h, 2 * h * h, -6 * h, 4 * h * h]]
    .map(r => r.map(v => v * c));
};

/** A cantilever of length L (mm), clamped at x = 0, of a b × t rectangle (mm) and modulus E (MPa), under a tip
 *  force F (N) and a line load q (N/mm), in n beam elements with consistent loads. Deflection w points along the
 *  loads. The bending moment is worked in each element from the element's own cubic. */
export function cantilever({ L, b, t, E, F = 0, q = 0, n }) {
  const I = b * t ** 3 / 12, EI = E * I, h = L / n, N = 2 * (n + 1), all = zeros(N), f = new Array(N).fill(0);
  for (let e = 0; e < n; e++) {
    const d = [2 * e, 2 * e + 1, 2 * e + 2, 2 * e + 3];
    assemble(all, beamElement(EI, h), d);
    [q * h / 2, q * h * h / 12, q * h / 2, -q * h * h / 12].forEach((v, i) => { f[d[i]] += v; });
  }
  f[2 * n] += F;
  const d = [0, 0, ...solve(all.slice(2).map(r => r.slice(2)), f.slice(2))];
  const w = d.filter((_, i) => i % 2 === 0), theta = d.filter((_, i) => i % 2 === 1);
  /** w and the moment EI·w″ at x: positive where the beam bends as a loaded cantilever does, w measured along the loads. */
  const at = x => {
    const e = Math.min(n - 1, Math.floor(x / h)), s = x - e * h, z = s / h;
    const [w1, t1, w2, t2] = [w[e], theta[e], w[e + 1], theta[e + 1]];
    const N = [1 - 3 * z * z + 2 * z ** 3, h * (z - 2 * z * z + z ** 3), 3 * z * z - 2 * z ** 3, h * (z ** 3 - z * z)];
    const B = [(-6 + 12 * z) / h ** 2, (-4 + 6 * z) / h, (6 - 12 * z) / h ** 2, (6 * z - 2) / h];
    const v = [w1, t1, w2, t2];
    return { w: N.reduce((s2, Ni, i) => s2 + Ni * v[i], 0), M: EI * B.reduce((s2, Bi, i) => s2 + Bi * v[i], 0) };
  };
  return { x: w.map((_, i) => i * h), w, theta, at, I, W: b * t * t / 6, h, dofs: 2 * n };
}

/** The cantilever's exact solution: the tip deflection F·L³/(3EI) (Krach 2018, p. 20), the line load's qL⁴/(8EI)
 *  and the curves w(x), M(x) worked by hand. */
export function cantileverExact({ L, b, t, E, F = 0, q = 0 }) {
  const I = b * t ** 3 / 12, EI = E * I;
  return {
    tip: F * L ** 3 / (3 * EI) + q * L ** 4 / (8 * EI),
    w: x => F * x * x * (3 * L - x) / (6 * EI) + q * x * x * (6 * L * L - 4 * L * x + x * x) / (24 * EI),
    M: x => F * (L - x) + q * (L - x) ** 2 / 2,
    rootStress: (F * L + q * L * L / 2) / (b * t * t / 6),
  };
}

/** The bending stress σ = M/W of a b × t rectangle, W = b·t²/6 (Krach 2020a, p. 40). */
export const bendingStress = (M, b, t) => M / (b * t * t / 6);

/** A circle of diameter d discretised by n chords (Krach 2020a, pp. 48–49): perimeter Σ Lij and area of the polygon,
 *  each chord d·sin(π/n), worked by hand. */
export function polygon(n, d) {
  const r = d / 2, perimeter = n * d * Math.sin(Math.PI / n), area = n / 2 * r * r * Math.sin(2 * Math.PI / n);
  return { perimeter, area, chord: d * Math.sin(Math.PI / n),
    perimeterError: perimeter / (Math.PI * d) - 1, areaError: area / (Math.PI * r * r) - 1 };
}

/** The 1-D shape functions on 0 ≤ ξ ≤ 1 (Krach 2021, pp. 55–56): linear on two nodes, quadratic on three (ξ = 0,
 *  ½, 1). Each is 1 at its node and 0 at the others, and they sum to 1. */
export const SHAPES = {
  linear: { nodes: [0, 1], N: z => [1 - z, z] },
  quadratic: { nodes: [0, 0.5, 1], N: z => [2 * (z - 0.5) * (z - 1), -4 * z * (z - 1), 2 * z * (z - 0.5)] },
};

/** The function y on [0, 1] approximated by m elements of the given kind: values taken at the nodes and
 *  interpolated with the shape functions in each element. */
export function interpolate(y, kind, m) {
  const S = SHAPES[kind];
  return x => {
    const e = Math.min(m - 1, Math.floor(x * m)), a = e / m, z = (x - a) * m;
    return S.N(z).reduce((s, Ni, i) => s + Ni * y(a + S.nodes[i] / m), 0);
  };
}

/** The two Gauss points of an element from a to b: at ξ = ±1/√3 of its natural coordinate, worked by hand. */
export const gaussPoints = (a, b) => [(a + b) / 2 - (b - a) / (2 * Math.sqrt(3)), (a + b) / 2 + (b - a) / (2 * Math.sqrt(3))];

/** The values at the element's nodes (ξ = −1, +1), extrapolated along the straight line through its two Gauss-point
 *  values (Krach 2021, pp. 60–62). */
export function extrapolate(s1, s2) {
  const mid = (s1 + s2) / 2, slope = (s2 - s1) / 2 * Math.sqrt(3);
  return [mid - slope, mid + slope];
}

/** A row of m elements on [0, L] sampling the field σ(x) at their Gauss points: each element's nodal values
 *  extrapolated, and the averaged value at each node (Krach 2021, p. 63). */
export function stressRecovery(sigma, L, m) {
  const elements = Array.from({ length: m }, (_, e) => {
    const a = e * L / m, b = (e + 1) * L / m, g = gaussPoints(a, b), s = g.map(sigma);
    return { a, b, gauss: g, values: s, nodal: extrapolate(s[0], s[1]) };
  });
  const averaged = Array.from({ length: m + 1 }, (_, i) => {
    const v = [i > 0 ? elements[i - 1].nodal[1] : null, i < m ? elements[i].nodal[0] : null].filter(x => x !== null);
    return v.reduce((s, x) => s + x, 0) / v.length;
  });
  return { elements, averaged, x: averaged.map((_, i) => i * L / m) };
}

/** The spring force of a nonlinear spring F(u) = k·u + c·u³ and its tangent stiffness dF/du: c > 0 stiffens, c < 0
 *  softens. */
export const springForce = (k, c) => ({ F: u => k * u + c * u ** 3, KT: u => k + 3 * c * u * u });

/** Newton–Raphson for F(u) = P in load steps, as an implicit nonlinear solver works (worked by hand from the
 *  definition): each step starts from the last equilibrium, each iteration solves KT·Δu = P − F(u). A step that
 *  does not converge, or reaches a tangent of zero or less (a softening spring past its peak, where the cubic's other,
 *  unphysical branch would also satisfy F(u) = P), ends the run and says so. */
export function newton({ k, c, P, steps = 1, tol = 1e-8, maxIter = 25 }) {
  const s = springForce(k, c), history = [];
  let u = 0;
  for (let j = 1; j <= steps; j++) {
    const load = P * j / steps, iters = [];
    let ok = false;
    for (let i = 0; i < maxIter; i++) {
      const r = load - s.F(u);
      iters.push({ u, residual: r });
      if (Math.abs(r) <= tol * Math.max(1, Math.abs(P))) { ok = true; break; }
      const KT = s.KT(u);
      if (KT <= 1e-12) break;
      u += r / KT;
      if (!Number.isFinite(u)) break;
    }
    history.push({ load, iters, converged: ok, u });
    if (!ok) return { u, history, converged: false, failedAt: j };
  }
  return { u, history, converged: true };
}
