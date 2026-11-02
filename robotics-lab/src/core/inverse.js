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

/** Its forward kinematics, to check the way back. */
export const fkTurnTilt = (l1, l2, t1, t2) => [l2 * Math.cos(t2) * Math.cos(t1), l2 * Math.cos(t2) * Math.sin(t1), l1 + l2 * Math.sin(t2)];
