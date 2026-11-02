// Serial chains: the degrees of freedom by Grübler's count (ch. 1), the Denavit–Hartenberg transform and the chains
// built from it (ch. 3), planar arms (ch. 2, p. 38; ch. 3, p. 3), the ABB IRB 120 (its product specification) and the
// Jacobian (ch. 4). Lengths in the source's units, angles in radians.
import { matmul, identity, rotOf, posOf, rad } from "./frames.js";

/** Grübler: DOF = T(n − 1 − g) + Σ fᵢ, with T = 3 in the plane, 6 in space (ch. 1, p. 37). */
export function dof(T, n, g, f) {
  const sum = Array.isArray(f) ? f.reduce((a, b) => a + b, 0) : f;
  return T * (n - 1 - g) + sum;
}

/**
 * One Denavit–Hartenberg step ⁱ⁻¹Tᵢ = Rot(z, θ) · Trans(z, d) · Trans(x, a) · Rot(x, α) (ch. 3, p. 20; slide 21).
 */
export function dh(theta, alpha, a, d) {
  const ct = Math.cos(theta), st = Math.sin(theta), ca = Math.cos(alpha), sa = Math.sin(alpha);
  return [[ct, -st * ca, st * sa, a * ct], [st, ct * ca, -ct * sa, a * st], [0, sa, ca, d], [0, 0, 0, 1]];
}

/** The frames of a chain of DH rows [{ theta, alpha, a, d }]: ⁰T₀ = I, ⁰T₁, …, ⁰Tₙ, each the product so far (p. 21). */
export function chain(rows) {
  const frames = [identity(4)];
  for (const r of rows) frames.push(matmul(frames.at(-1), dh(r.theta, r.alpha, r.a, r.d)));
  return frames;
}

/**
 * The RRT robot of ch. 3, pp. 22–26 (slides 23–27): its DH table with the lengths l1…l4 and the slide's stroke l5*.
 * θ1 and θ2 are the joint angles; the table adds 90° to θ2.
 */
export function rrtRows(l, t1, t2, l5) {
  return [
    { theta: t1, alpha: rad(90), a: l[2], d: l[0] + l[1] },
    { theta: rad(90) + t2, alpha: rad(90), a: 0, d: 0 },
    { theta: 0, alpha: 0, a: 0, d: l[3] + l5 },
  ];
}

/** A planar arm of two links: its elbow, its tip and the tip's turn φ = θ1 + θ2 (ch. 2, p. 38). */
export function planar2r(l1, l2, t1, t2) {
  const elbow = [l1 * Math.cos(t1), l1 * Math.sin(t1)];
  const tip = [elbow[0] + l2 * Math.cos(t1 + t2), elbow[1] + l2 * Math.sin(t1 + t2)];
  return { elbow, tip, phi: t1 + t2 };
}

/** The same arm as the product of two plane homogeneous transforms ⁰T₁ · ¹T₂ (ch. 2, p. 38). */
export function planar2rT(l1, l2, t1, t2) {
  const step = (t, l) => [[Math.cos(t), -Math.sin(t), l * Math.cos(t)], [Math.sin(t), Math.cos(t), l * Math.sin(t)], [0, 0, 1]];
  return matmul(step(t1, l1), step(t2, l2));
}

/**
 * The bent arm of ch. 3, p. 3: a post l1, then l2 turned by θ1, then l3 and l4 each bent by a further 45° (the drawing's
 * 135° inner angles). Returns the joints in the plane and the tip.
 */
export function bentArm(l, t1) {
  const pts = [[0, 0], [0, l[0]]];
  let dir = t1;
  for (const [k, len] of [l[1], l[2], l[3]].entries()) {
    if (k > 0) dir += rad(45);
    const p = pts.at(-1);
    pts.push([p[0] + len * Math.cos(dir), p[1] + len * Math.sin(dir)]);
  }
  return { pts, tip: pts.at(-1) };
}

/**
 * The ABB IRB 120 as a DH chain, built here from the dimensions of its product specification (ABB 2020, p. 12): base to
 * axis 2 290 mm, upper arm 270 mm, the 70 mm step to the forearm, forearm 302 mm, flange 72 mm. Axes 2 and 3 turn
 * forward for positive angles, as the specification's working-range table (p. 31) reads; θ2 is 0 with the upper arm
 * upright, hence its −90° offset. The signs of axes 4–6 are this lab's choice; the specification does not show them.
 */
export const IRB120 = {
  rows: [
    { offset: 0, alpha: rad(-90), a: 0, d: 290 },
    { offset: rad(-90), alpha: 0, a: 270, d: 0 },
    { offset: 0, alpha: rad(-90), a: 70, d: 0 },
    { offset: 0, alpha: rad(90), a: 0, d: 302 },
    { offset: 0, alpha: rad(-90), a: 0, d: 0 },
    { offset: 0, alpha: 0, a: 0, d: 72 },
  ],
  // Working ranges, ABB (2020), p. 32; axis 6 is ±400° by default.
  limits: [[-165, 165], [-110, 110], [-110, 70], [-160, 160], [-120, 120], [-400, 400]].map(([lo, hi]) => [rad(lo), rad(hi)]),
};

/** The IRB 120's frames for the joint angles q (six, radians); frame 4's origin is the wrist centre, frame 6 the flange. */
export const irb120 = q => chain(IRB120.rows.map((r, i) => ({ theta: q[i] + r.offset, alpha: r.alpha, a: r.a, d: r.d })));
export const wristCentre = q => posOf(irb120(q)[4]);

/**
 * The geometric Jacobian by the course's schema (ch. 4, p. 15): a turning joint i adds z × (pₙ − pᵢ₋₁) above z, a
 * sliding joint z above 0, z being the z-axis of frame i − 1 in the base frame. Rows: vx, vy, vz, ωx, ωy, ωz.
 */
export function jacobian(frames, types) {
  const pn = posOf(frames.at(-1));
  const cols = types.map((type, i) => {
    const R = rotOf(frames[i]), z = [R[0][2], R[1][2], R[2][2]], p = posOf(frames[i]);
    if (type === "T") return [...z, 0, 0, 0];
    const r = [pn[0] - p[0], pn[1] - p[1], pn[2] - p[2]];
    return [z[1] * r[2] - z[2] * r[1], z[2] * r[0] - z[0] * r[2], z[0] * r[1] - z[1] * r[0], ...z];
  });
  return cols[0].map((_, row) => cols.map(c => c[row]));
}

/** The planar two-link arm's Jacobian of the tip position, ∂(x, y)/∂(θ1, θ2) (ch. 4, p. 20). */
export function jacobian2r(l1, l2, t1, t2) {
  const s1 = Math.sin(t1), c1 = Math.cos(t1), s12 = Math.sin(t1 + t2), c12 = Math.cos(t1 + t2);
  return [[-l1 * s1 - l2 * s12, -l2 * s12], [l1 * c1 + l2 * c12, l2 * c12]];
}

/** The RT robot's position Jacobian (ch. 4, p. 18): x = (l1 + l2)cos θ1, y = (l1 + l2)sin θ1, l2 the stroke. */
export function jacobianRT(l1, t1, l2) {
  return [[-(l1 + l2) * Math.sin(t1), Math.cos(t1)], [(l1 + l2) * Math.cos(t1), Math.sin(t1)]];
}

/** A determinant by elimination with row swaps, for the square Jacobians. */
export function det(M) {
  const A = M.map(r => [...r]), n = A.length;
  let d = 1;
  for (let i = 0; i < n; i++) {
    let p = i;
    for (let r = i + 1; r < n; r++) if (Math.abs(A[r][i]) > Math.abs(A[p][i])) p = r;
    if (Math.abs(A[p][i]) < 1e-12) return 0;
    if (p !== i) { [A[p], A[i]] = [A[i], A[p]]; d = -d; }
    d *= A[i][i];
    for (let r = i + 1; r < n; r++) {
      const k = A[r][i] / A[i][i];
      for (let c = i; c < n; c++) A[r][c] -= k * A[i][c];
    }
  }
  return d;
}

/** The two half-axes of the ellipse a unit circle of joint speeds maps to through a 2 × 2 Jacobian, and its tilt. */
export function speedEllipse(J) {
  const [[a, b], [c, d]] = J;
  // JJᵀ is symmetric; its eigenvalues are the squared half-axes.
  const p = a * a + b * b, q = a * c + b * d, r = c * c + d * d;
  const mean = (p + r) / 2, diff = Math.hypot((p - r) / 2, q);
  return { major: Math.sqrt(mean + diff), minor: Math.sqrt(Math.max(0, mean - diff)), tilt: 0.5 * Math.atan2(2 * q, p - r) };
}

