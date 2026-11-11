// Normalised motion laws and their characteristic values (Berger 2021, chapter 5), the cam with a translating roller
// follower (chapter 6) and the indexing cam's step (6.3.3.2). A law is f(z) on 0 ≤ z ≤ 1 with its first three
// derivatives; y = yH·f(x/xP) (ch. 5, p. 23, Blatt 25).

const TAU = 2 * Math.PI;

/** The 5th-order polynomial from its boundary values, f(0) = f′(0)… given (ch. 5, pp. 34–35, Blatt 36–37; a3 as the
 *  Übung 5_1 solution prints it). */
export function quintic({ f1 = 1, v0 = 0, v1 = 0, a0 = 0, a1: acc1 = 0 }) {
  return [0, v0, a0 / 2,
    10 * f1 - 6 * v0 - 4 * v1 - 1.5 * a0 + 0.5 * acc1,
    -15 * f1 + 8 * v0 + 7 * v1 + 1.5 * a0 - acc1,
    6 * f1 - 3 * (v0 + v1) - 0.5 * (a0 - acc1)];
}

/** A polynomial law from its coefficients [c0, c1, …]: f and its derivatives. */
export function polynomial(c) {
  const der = p => p.slice(1).map((v, i) => v * (i + 1));
  const ev = p => z => p.reduce((s, v, i) => s + v * z ** i, 0);
  const d1 = der(c), d2 = der(d1), d3 = der(d2);
  return { f: ev(c), v: ev(d1), a: ev(d2), j: ev(d3), coefficients: c };
}

/** The course's laws: the 3rd, 5th and 7th power (ch. 5, p. 32, Blatt 34) and Bestehorn's sine (the Übungsskript,
 *  Kap. 6 Aufgabe 4). */
export const LAWS = {
  cubic: { name: "3rd power, 3z² − 2z³", ...polynomial([0, 0, 3, -2]) },
  quintic: { name: "5th power, 10z³ − 15z⁴ + 6z⁵", ...polynomial([0, 0, 0, 10, -15, 6]) },
  septic: { name: "7th power, 35z⁴ − 84z⁵ + 70z⁶ − 20z⁷", ...polynomial([0, 0, 0, 0, 35, -84, 70, -20]) },
  sine: { name: "Bestehorn's sine, z − sin(2πz)/(2π)",
    f: z => z - Math.sin(TAU * z) / TAU, v: z => 1 - Math.cos(TAU * z), a: z => TAU * Math.sin(TAU * z), j: z => TAU * TAU * Math.cos(TAU * z) },
};

/** The characteristic values (ch. 5, p. 30, Blatt 32): Cv = max|f′|, Ca = max|f″|, Cj = max|f‴|, CM = max|f′f″|, each
 *  with the z where it falls; sampled, then refined by golden-section search. */
export function characteristic(law, steps = 2000) {
  const peak = g => {
    let best = 0, at = 0;
    for (let i = 0; i <= steps; i++) { const z = i / steps, v = Math.abs(g(z)); if (v > best) { best = v; at = z; } }
    let lo = Math.max(0, at - 1 / steps), hi = Math.min(1, at + 1 / steps);
    for (let k = 0; k < 60; k++) {
      const m1 = hi - 0.618034 * (hi - lo), m2 = lo + 0.618034 * (hi - lo);
      if (Math.abs(g(m1)) > Math.abs(g(m2))) hi = m2; else lo = m1;
    }
    const z = (lo + hi) / 2, v = Math.abs(g(z));
    return v >= best ? { value: v, z } : { value: best, z: at };
  };
  return { Cv: peak(law.v), Ca: peak(law.a), Cj: peak(law.j), CM: peak(z => law.v(z) * law.a(z)) };
}

/** The output's real peaks (ch. 5, p. 30): max ẏ = Cv·yH/xP·ω and max ÿ = Ca·yH/xP²·ω² for a drive turning at ω; yH and
 *  xP in radians (or yH in mm). */
export const peaks = (C, yH, xP, omega) => ({ v: C.Cv.value * yH / xP * omega, a: C.Ca.value * yH / (xP * xP) * omega * omega });

/** A disc cam with a translating, centred roller follower: base circle rG, roller rR, stroke sH over the rise angle
 *  phiP, a dwell, the same law back over phiN, and a dwell. Returns the follower lift s(φ) and its derivatives. */
export function camLift(law, { sH, phiP, phiR1 = 0, phiN }) {
  return phi => {
    const p = ((phi % TAU) + TAU) % TAU;
    if (p < phiP) { const z = p / phiP; return { s: sH * law.f(z), ds: sH * law.v(z) / phiP, dds: sH * law.a(z) / (phiP * phiP) }; }
    if (p < phiP + phiR1) return { s: sH, ds: 0, dds: 0 };
    if (p < phiP + phiR1 + phiN) { const z = (p - phiP - phiR1) / phiN; return { s: sH * (1 - law.f(z)), ds: -sH * law.v(z) / phiN, dds: -sH * law.a(z) / (phiN * phiN) }; }
    return { s: 0, ds: 0, dds: 0 };
  };
}

/** The cam's pitch curve (the roller centre's path, RMB), its pressure angle α and transmission angle μ = 90° − |α| for a
 *  centred translating follower (tan α = s′/(r0 + s), worked from the definition of ch. 6, p. 32), and its radius of
 *  curvature ρB, positive where the curve is convex (ch. 6, p. 41). The working profile is ρA = ρB − rR. */
export function cam(law, dims, steps = 720) {
  const lift = camLift(law, dims), r0 = dims.rG + dims.rR;
  const pts = [];
  let muMin = { mu: Infinity, phi: 0 }, rhoMin = { rho: Infinity, phi: 0 };
  for (let i = 0; i < steps; i++) {
    const phi = TAU * i / steps, { s, ds, dds } = lift(phi), R = r0 + s;
    const alpha = Math.atan2(ds, R), mu = Math.PI / 2 - Math.abs(alpha);
    // Polar curve R(φ): ρ = (R² + R′²)^{3/2} / (R² + 2R′² − R R″).
    const rho = (R * R + ds * ds) ** 1.5 / (R * R + 2 * ds * ds - R * dds);
    if (mu < muMin.mu) muMin = { mu, phi };
    if (rho > 0 && rho < rhoMin.rho) rhoMin = { rho, phi };
    // The cam turns under a fixed follower: the roller centre, in the cam's frame, sits at −φ.
    pts.push({ phi, s, pitch: [R * Math.sin(phi), R * Math.cos(phi)], mu, rho });
  }
  const profile = pts.map((_, i) => {
    // The working profile is the pitch curve moved inward by rR along its normal.
    const p = pts[i].pitch, q = pts[(i + 1) % steps].pitch, o = pts[(i - 1 + steps) % steps].pitch;
    const t = [q[0] - o[0], q[1] - o[1]], n = Math.hypot(...t);
    let nx = -t[1] / n, ny = t[0] / n;
    if (nx * p[0] + ny * p[1] > 0) { nx = -nx; ny = -ny; }
    return [p[0] + dims.rR * nx, p[1] + dims.rR * ny];
  });
  return { pts, profile, muMin, rhoMin, cutsUnder: rhoMin.rho <= dims.rR, rollerAdvice: 0.7 * rhoMin.rho };
}

/** A point of the cam, drawn with the cam turned by t: the pitch point of angle t comes to the top, under the follower. */
export const turned = ([x, y], t) => [x * Math.cos(t) - y * Math.sin(t), x * Math.sin(t) + y * Math.cos(t)];

/** The indexing cam (ch. 6, pp. 16–19): the step angle at the output φS = 360°/n for n stations, and nR = 360°·ga/φS
 *  rollers per plane for a cam of ga threads. */
export const indexing = (stations, ga) => { const phiS = 360 / stations; return { phiS, nR: 360 * ga / phiS }; };

/** The output's angle over one turn of the input: the step over the indexing part β of the turn by the law, at rest
 *  for the rest. */
export function indexStep(law, phiS, beta) {
  return phi => {
    const p = ((phi % 360) + 360) % 360;
    return p < beta ? { angle: phiS * law.f(p / beta), speed: phiS / beta * law.v(p / beta) } : { angle: phiS, speed: 0 };
  };
}

/** The friction-wheel feed (ch. 2, p. 26, Blatt 29): feed length L = (360° − φ)·(π/180)·rRolle, φ the roller's flat
 *  (unused) angle. */
export const feedLength = (phiDeg, rRoll) => (360 - phiDeg) * Math.PI / 180 * rRoll;
