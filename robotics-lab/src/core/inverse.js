// Inverse kinematics (Ajanović 2020, ch. 5): the joint angles of the planar two-link arm for a tip position, by atan2
// (pp. 16–18) and by the triangle (p. 13); the turn-and-tilt arm of p. 21. Angles in radians.

/**
 * Both solutions of the planar two-link arm, or none: cos θ2 = (x² + y² − l1² − l2²)/(2 l1 l2), θ2 = atan2(±√(1 − c²), c),
 * θ1 = atan2(y, x) − atan2(l2 sin θ2, l1 + l2 cos θ2) (ch. 5, pp. 16–18). A solution exists only for
 * (l1 − l2)² ≤ x² + y² ≤ (l1 + l2)² (p. 17).
 */
export function ik2r(l1, l2, x, y) {
  const r2 = x * x + y * y, c = (r2 - l1 * l1 - l2 * l2) / (2 * l1 * l2);
  const reach = { r2, min: (l1 - l2) ** 2, max: (l1 + l2) ** 2 };
  // A target a hair outside the circle by rounding is on it.
  if (c > 1 + 1e-12 || c < -1 - 1e-12) return { reachable: false, c, reach, solutions: [] };
  const cc = Math.max(-1, Math.min(1, c)), s = Math.sqrt(1 - cc * cc);
  const solutions = [1, -1].map(sign => {
    const t2 = Math.atan2(sign * s, cc);
    return { t1: Math.atan2(y, x) - Math.atan2(l2 * Math.sin(t2), l1 + l2 * Math.cos(t2)), t2, sign };
  });
  return { reachable: true, c, reach, solutions };
}

/**
 * The same arm by the triangle with sides l1, l2 and c = √(x² + y²) (ch. 5, p. 13): θ2 = 180° − arccos((c² − l1² −
 * l2²)/(−2 l1 l2)), θ1 = arctan(y/x) − arccos((l2² − c² − l1²)/(−2 l1 c)). The slide's arctan is taken as atan2 so the
 * whole plane works; this is the solution with θ2 ≥ 0.
 */
export function ik2rTriangle(l1, l2, x, y) {
  const c2 = x * x + y * y, c = Math.sqrt(c2);
  const t2 = Math.PI - Math.acos((c2 - l1 * l1 - l2 * l2) / (-2 * l1 * l2));
  const t1 = Math.atan2(y, x) - Math.acos((l2 * l2 - c2 - l1 * l1) / (-2 * l1 * c));
  return { t1, t2 };
}

/**
 * The arm of ch. 5, p. 21: a post l1 turning about its own axis (θ1) with an arm l2 tilted by θ2 at its top.
 * θ1 = atan2(y, x), l2xy = √(x² + y²), θ2 = atan2(z − l1, l2xy). The tip must lie l2 from the top of the post.
 */
export function ikTurnTilt(l1, l2, [x, y, z]) {
  const lxy = Math.hypot(x, y), gap = Math.hypot(lxy, z - l1) - l2;
  return { t1: Math.atan2(y, x), t2: Math.atan2(z - l1, lxy), lxy, reachable: Math.abs(gap) < 1e-9 * Math.max(1, l2), gap };
}

/**
 * The planar three-link arm reaching (x, y) with the last link at the angle φ: back off l3 along φ to the wrist, solve
 * the two-link arm for the wrist, θ3 = φ − θ1 − θ2. The wrist split of ch. 5, p. 6 in the plane; worked here, the
 * slides show the RRR arm (p. 4) but no numbers for it.
 */
export function ik3r(l1, l2, l3, x, y, phi) {
  const wrist = [x - l3 * Math.cos(phi), y - l3 * Math.sin(phi)];
  const two = ik2r(l1, l2, wrist[0], wrist[1]);
  return { wrist, reachable: two.reachable, reach: two.reach,
    solutions: two.solutions.map(s => ({ ...s, t3: phi - s.t1 - s.t2 })) };
}

/**
 * The IRB 120 backwards by the wrist split (ch. 5, p. 6: a jointed arm with a central wrist): the wrist centre is the
 * flange less 72 mm along its z (ABB 2020, p. 12); axis 1 points the arm at it; axes 2 and 3 are a two-link arm of
 * 270 mm and √(70² + 302²) mm in that plane; axes 4–6 turn ³R₆ = Rz(θ4) Ry(−θ5) Rz(θ6) (this lab's DH rows 4–6) onto
 * ⁰R₃ᵀ·R. Worked here for this lab's DH table (chains.js, IRB120); the arm in front of axis 1 only. T is the flange's
 * 4 × 4 pose; fk(q) gives the frames, so the arm's own chain sets ⁰R₃. Returns the elbow solutions, each with q.
 */
export function ikIrb120(T, fk, dims = { d1: 290, a2: 270, a3: 70, d4: 302, d6: 72 }) {
  const z = [T[0][2], T[1][2], T[2][2]], p = [T[0][3], T[1][3], T[2][3]];
  const w = p.map((v, i) => v - dims.d6 * z[i]);
  const t1 = Math.atan2(w[1], w[0]), u = Math.hypot(w[0], w[1]), v = w[2] - dims.d1;
  const fore = Math.hypot(dims.a3, dims.d4), step = Math.atan2(dims.a3, dims.d4);
  const arm = ik2r(dims.a2, fore, u, v);
  const solutions = arm.solutions.map(s => {
    // Upper arm at the angle s.t1 from the level, θ2 = 0 upright; the forearm rises by `step` when θ3 = 0.
    const q = [t1, Math.PI / 2 - s.t1, step - Math.PI / 2 - s.t2, 0, 0, 0];
    const R3 = fk(q)[3], R = [0, 1, 2].map(i => [0, 1, 2].map(j => R3[0][i] * T[0][j] + R3[1][i] * T[1][j] + R3[2][i] * T[2][j]));
    const t5 = Math.atan2(Math.hypot(R[0][2], R[1][2]), R[2][2]);
    const still = Math.abs(Math.sin(t5)) < 1e-9;
    q[3] = still ? 0 : Math.atan2(-R[1][2], -R[0][2]);
    q[4] = t5;
    q[5] = still ? Math.atan2(R[1][0], R[0][0]) : Math.atan2(-R[2][1], R[2][0]);
    return { q, sign: s.sign, wristSingular: still };
  });
  return { wrist: w, u, v, reachable: arm.reachable, reach: arm.reach, solutions };
}

/** Its forward kinematics, to check the way back. */
export const fkTurnTilt = (l1, l2, t1, t2) => [l2 * Math.cos(t2) * Math.cos(t1), l2 * Math.cos(t2) * Math.sin(t1), l1 + l2 * Math.sin(t2)];
