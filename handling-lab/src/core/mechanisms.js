// Planar linkages (Berger 2021, chapters 3–4): the mobility count, Grashof's rule, the four-bar's position, transmission
// angle, dead-centre positions and poles. Points are [x, y] in mm; angles in radians unless a name ends in Deg.

const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
const len = a => Math.hypot(a[0], a[1]);
const dir = t => [Math.cos(t), Math.sin(t)];
const scale = (a, k) => [a[0] * k, a[1] * k];
/** Complex product: a point rotated and stretched by k = [re, im]. */
export const cmul = (a, k) => [a[0] * k[0] - a[1] * k[1], a[0] * k[1] + a[1] * k[0]];
const cdiv = (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
export const deg = r => r * 180 / Math.PI, rad = d => d * Math.PI / 180;

/** Ch. 4, p. 23 (Blatt 27): F = 3(n − 1) − 2g1 − g2 for plane mechanisms; with the number of drives, what it means. */
export function mobility(n, g1, g2 = 0, drives = 1) {
  const F = 3 * (n - 1) - 2 * g1 - g2;
  const verdict = F < 0 ? "overconstrained" : F === 0 ? "structure" : F === drives ? "constrained" : F > drives ? "unconstrained" : "overdriven";
  return { F, verdict };
}

/** Ch. 4, p. 26 (Blatt 30): Grashof's rule on four link lengths [frame, crank, coupler, rocker]. The shortest link's
 *  place says which mechanism the fixed frame gives when the rule holds. */
export function grashof(lengths) {
  const sorted = [...lengths].sort((a, b) => a - b);
  const lhs = sorted[0] + sorted[3], rhs = sorted[1] + sorted[2];
  const tol = 1e-9 * rhs;
  const kind = lhs < rhs - tol ? "rotating" : lhs > rhs + tol ? "rocking" : "change-point";
  const shortest = lengths.indexOf(sorted[0]);
  let mechanism;
  if (kind === "rocking") mechanism = "triple rocker";
  else mechanism = ["double crank", "crank-rocker", "double rocker", "crank-rocker"][shortest];
  return { lhs, rhs, kind, shortest, mechanism };
}

/** Ch. 3, p. 81: the slider-crank chain with crank r, coupler l and offset e turns fully when e < lmax − lmin. */
export function sliderCrankRotates(r, l, e) {
  const gap = Math.max(r, l) - Math.min(r, l), tol = 1e-9 * gap;
  return Math.abs(e) < gap - tol ? "rotating" : Math.abs(e) > gap + tol ? "rocking" : "change-point";
}

/** Where the circles about p (radius rp) and q (radius rq) meet; branch ±1 picks one of the two; null when apart. */
export function circles(p, rp, q, rq, branch = 1) {
  const d = sub(q, p), D = len(d);
  if (D === 0 || D > rp + rq || D < Math.abs(rp - rq)) return null;
  const a = (rp * rp - rq * rq + D * D) / (2 * D), hgt = Math.sqrt(Math.max(0, rp * rp - a * a));
  const u = scale(d, 1 / D);
  return add(add(p, scale(u, a)), scale([-u[1], u[0]], branch * hgt));
}

/** A four-bar A0 A B B0: frame a along x from A0 = (0, 0), crank r at angle phi, coupler l, rocker c, and a coupler
 *  point C fixed to AB by k = (C − A)/(B − A) as a complex ratio. Null where the chain cannot close. */
export function fourBar({ a, r, l, c, k = [0.5, 0] }, phi, branch = 1) {
  const A0 = [0, 0], B0 = [a, 0], A = add(A0, scale(dir(phi), r));
  const B = circles(A, l, B0, c, branch);
  if (!B) return null;
  const C = add(A, cmul(sub(B, A), k));
  return { A0, B0, A, B, C, psi: Math.atan2(B[1], B[0] - a), mu: transmission(A, B, B0) };
}

/** The transmission angle μ (ch. 4, p. 38, Blatt 43): between coupler and rocker at B, always the acute one. Worked
 *  from the definition, the course gives no formula. */
export function transmission(A, B, B0) {
  const u = sub(A, B), v = sub(B0, B);
  const g = Math.acos(Math.max(-1, Math.min(1, (u[0] * v[0] + u[1] * v[1]) / (len(u) * len(v)))));
  return g > Math.PI / 2 ? Math.PI - g : g;
}

/** The smallest transmission angle over a turn of the crank, with the crank angle where it falls. */
export function minTransmission(dims, branch = 1, steps = 720) {
  let best = { mu: Infinity, phi: 0 };
  for (let i = 0; i < steps; i++) {
    const phi = 2 * Math.PI * i / steps, s = fourBar(dims, phi, branch);
    if (s && s.mu < best.mu) best = { mu: s.mu, phi };
  }
  return best;
}

/** The crank-rocker's two dead-centre positions (ch. 4, p. 97): crank and coupler folded (inner, |A0B| = l − r) and
 *  stretched (outer, l + r). φ0 is the crank's turn from inner to outer in the sense it is driven, ψ0 the rocker's swing,
 *  φ0/(360° − φ0) the ratio of working to return stroke. */
export function deadCentres({ a, r, l, c }, branch = 1) {
  const Bi = circles([0, 0], l - r, [a, 0], c, branch), Ba = circles([0, 0], l + r, [a, 0], c, branch);
  if (!Bi || !Ba) return null;
  const crankI = Math.atan2(-Bi[1], -Bi[0]), crankA = Math.atan2(Ba[1], Ba[0]);
  let phi0 = crankA - crankI;
  phi0 = ((phi0 % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  // The crank is driven counter-clockwise, so φ0 is measured that way from the inner to the outer position.
  const psiI = Math.atan2(Bi[1], Bi[0] - a), psiA = Math.atan2(Ba[1], Ba[0] - a);
  const psi0 = Math.abs(Math.atan2(Math.sin(psiA - psiI), Math.cos(psiA - psiI)));
  return { Bi, Ba, crankI, crankA, phi0, psi0, ratio: phi0 / (2 * Math.PI - phi0) };
}

/** Dead-centre synthesis, worked as the construction of ch. 4, pp. 97–102, does it: the frame a, the rocker c and its
 *  outer position angle psiA, and the swing ψ0 give Ba and Bi, and from them r = (|A0Ba| − |A0Bi|)/2 and
 *  l = (|A0Ba| + |A0Bi|)/2. The swing runs towards A0 from the outer position. */
export function synthesise({ a, c, psiA, psi0 }) {
  const Ba = [a + c * Math.cos(psiA), c * Math.sin(psiA)], Bi = [a + c * Math.cos(psiA + psi0), c * Math.sin(psiA + psi0)];
  const da = len(Ba), di = len(Bi);
  return { r: (da - di) / 2, l: (da + di) / 2, Ba, Bi };
}

/** Ch. 4, p. 68: the pole P12 of a plane motion from two positions of two points, where the perpendicular bisectors
 *  of A1A2 and B1B2 meet, and the turn φ12 about it. Null for a pure shift. */
export function pole(A1, A2, B1, B2) {
  const mA = scale(add(A1, A2), 0.5), mB = scale(add(B1, B2), 0.5), dA = sub(A2, A1), dB = sub(B2, B1);
  // p·dA = mA·dA and p·dB = mB·dB.
  const det = dA[0] * dB[1] - dA[1] * dB[0];
  const cA = mA[0] * dA[0] + mA[1] * dA[1], cB = mB[0] * dB[0] + mB[1] * dB[1];
  let P;
  if (Math.abs(det) > 1e-12) P = [(cA * dB[1] - cB * dA[1]) / det, (dA[0] * cB - dB[0] * cA) / det];
  else if (len(dA) < 1e-12) P = A1; // A stays put: it is the pole
  else if (len(dB) < 1e-12) P = B1;
  else return null;
  const u = sub(A1, P), v = sub(A2, P);
  const angle = len(u) < 1e-12 ? Math.atan2(cross(sub(B1, P), sub(B2, P)), dot(sub(B1, P), sub(B2, P))) : Math.atan2(cross(u, v), dot(u, v));
  return { P, angle };
}
const dot = (u, v) => u[0] * v[0] + u[1] * v[1], cross = (u, v) => u[0] * v[1] - u[1] * v[0];

/** The Roberts–Chebyshev cognates (ch. 4, p. 113): two more four-bars A0 D E F0 and B0 G H F0 whose couplers carry the
 *  same point C. F0 = A0 + k(B0 − A0) makes A0 B0 F0 similar to the coupler triangle A B C. */
export function cognates(s, k) {
  const { A0, B0, A, B, C } = s, F0 = add(A0, cmul(sub(B0, A0), k)), one = [1 - k[0], -k[1]];
  const D = add(A0, cmul(sub(B, A), k)), E = add(F0, cmul(sub(B, B0), k));
  const G = add(B0, sub(C, B)), H = add(F0, cmul(sub(A, A0), one));
  return { F0, first: [A0, D, E, F0], second: [B0, G, H, F0], C };
}

/** Ch. 4, p. 47 (Blatt 52): n links have n(n − 1)/2 poles. */
export const poleCount = n => n * (n - 1) / 2;

/** The four-bar's pole of crank and rocker relative motion, P13 on line A0B0 where line AB meets it, and by it the
 *  rocker's angular speed over the crank's, ω3/ω1 = A0P13/B0P13 (signed along the frame). */
export function velocityRatio(s) {
  const { A0, B0, A, B } = s, d = sub(B, A), f = sub(B0, A0);
  const det = cross(f, d);
  if (Math.abs(det) < 1e-12) return { P: null, ratio: 0 };
  const t = cross(sub(A, A0), d) / det, P = add(A0, scale(f, t));
  // Signed distances along the frame: A0 at 0, B0 at |f|.
  const L = len(f), x = t * L;
  return { P, ratio: x / (x - L), P12: A, P23: B };
}

export { sub, add, len, dir, scale, cdiv };
