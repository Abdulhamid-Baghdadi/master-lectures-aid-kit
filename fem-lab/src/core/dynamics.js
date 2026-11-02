// The dynamic models of the labs: natural frequencies of a spring–mass chain from [M]{ẍ} + [K]{x} = 0 (Krach 2018,
// p. 44; Puhwein 2020, p. 28), and the step-by-step time integration of an oscillator, explicit against implicit.
// Units: kg, N/m, s. Pure: no page, no clock, no randomness.
import { zeros, eigSym } from "./linalg.js";
import { springChain } from "./statics.js";

/** ω = √(k/m) and f = ω/2π of one mass on one spring (Krach 2018, p. 44; Puhwein 2020, pp. 7–8). */
export const sdof = (k, m) => ({ omega: Math.sqrt(k / m), f: Math.sqrt(k / m) / (2 * Math.PI), T: 2 * Math.PI / Math.sqrt(k / m) });

/** The two-mass oscillator of Puhwein (2020), pp. 27–28: det([K] − λ[M]) = 0 with λ = ω², solved as the quadratic
 *  m1·m2·λ² − (m1·K22 + m2·K11)·λ + det K = 0. */
export function twoMass({ m1, m2, k1, k2 }) {
  const K = [[k1 + k2, -k2], [-k2, k2]];
  const a = m1 * m2, b = -(m1 * K[1][1] + m2 * K[0][0]), c = K[0][0] * K[1][1] - K[0][1] ** 2;
  const root = Math.sqrt(b * b - 4 * a * c), lambda = [(-b - root) / (2 * a), (-b + root) / (2 * a)];
  // Mode shape from the first row: (K11 − λ m1) x1 − k2 x2 = 0, scaled so x2 = 1.
  const modes = lambda.map(l => [k2 / (K[0][0] - l * m1), 1]);
  return { K, lambda, omega: lambda.map(Math.sqrt), f: lambda.map(l => Math.sqrt(l) / (2 * Math.PI)), modes };
}

/** A chain of point masses joined by springs, the first spring to a wall (and the last to a wall when bothEnds):
 *  its natural frequencies and mode shapes from the eigenvalues of M^−½ K M^−½, each mode scaled to a largest
 *  amplitude of 1. */
export function chainModes(masses, springs, { bothEnds = false } = {}) {
  const { K } = springChain(springs, { bothEnds });
  const n = K.length, r = masses.slice(0, n).map(m => 1 / Math.sqrt(m)), A = zeros(n);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) A[i][j] = r[i] * K[i][j] * r[j];
  const { values, vectors } = eigSym(A);
  const modes = vectors.map(v => {
    const x = v.map((vi, i) => vi * r[i]), big = x.reduce((m, xi) => Math.abs(xi) > Math.abs(m) ? xi : m, 0);
    return x.map(xi => xi / big);
  });
  return { K, lambda: values, omega: values.map(l => Math.sqrt(Math.max(0, l))), f: values.map(l => Math.sqrt(Math.max(0, l)) / (2 * Math.PI)), modes };
}

/** The oscillator ü + ω²u = 0 from u(0) = u0, u̇(0) = 0, stepped with Δt by the explicit central difference or the
 *  implicit average-acceleration rule (Newmark, γ = ½, β = ¼); both worked by hand from their definitions. Returns
 *  the displacement at each step. */
export function integrate({ omega, dt, steps, method, u0 = 1 }) {
  const w2 = omega * omega, u = [u0];
  if (method === "explicit") {
    // The step before t = 0 from a Taylor series, so the start is at rest: u−1 = u0 + Δt²/2 · ü0.
    let prev = u0 - dt * dt / 2 * w2 * u0, now = u0;
    for (let k = 0; k < steps; k++) {
      const next = 2 * now - prev - dt * dt * w2 * now;
      prev = now; now = next; u.push(now);
    }
  } else {
    let x = u0, v = 0, a = -w2 * u0;
    const beta = 0.25, gamma = 0.5;
    for (let k = 0; k < steps; k++) {
      // Implicit: the new acceleration depends on the new displacement, so each step solves an equation, here one
      // unknown: (1 + βΔt²ω²) x+ = x + Δt v + (½ − β) Δt² a.
      const xn = (x + dt * v + (0.5 - beta) * dt * dt * a) / (1 + beta * dt * dt * w2);
      const an = -w2 * xn, vn = v + dt * ((1 - gamma) * a + gamma * an);
      x = xn; v = vn; a = an; u.push(x);
    }
  }
  return u;
}

/** The largest step the central difference takes without growing without bound: Δt = 2/ω, worked by hand from the
 *  recurrence's characteristic equation. */
export const criticalStep = omega => 2 / omega;
