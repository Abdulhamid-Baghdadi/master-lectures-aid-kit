// Describing where a body is and how it is turned (Ajanović 2020, ch. 2): rotation matrices in the plane and in space,
// homogeneous transforms, and the Euler, Cardan and roll-pitch-yaw angle sequences with their gimbal lock. Angles in
// radians; matrices as arrays of rows.

export const rad = d => d * Math.PI / 180;
export const deg = r => r * 180 / Math.PI;

export const matmul = (A, B) => A.map(row => B[0].map((_, j) => row.reduce((sum, v, k) => sum + v * B[k][j], 0)));
export const transpose = A => A[0].map((_, j) => A.map(r => r[j]));
export const apply = (A, v) => A.map(r => r.reduce((sum, x, k) => sum + x * v[k], 0));
export const identity = n => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));

/** The plane rotation by θ (ch. 2, p. 24). */
export const rot2 = t => [[Math.cos(t), -Math.sin(t)], [Math.sin(t), Math.cos(t)]];

/** The elementary rotations about x, y and z (ch. 2, pp. 41–43). */
export const Rx = t => [[1, 0, 0], [0, Math.cos(t), -Math.sin(t)], [0, Math.sin(t), Math.cos(t)]];
export const Ry = t => [[Math.cos(t), 0, Math.sin(t)], [0, 1, 0], [-Math.sin(t), 0, Math.cos(t)]];
export const Rz = t => [[Math.cos(t), -Math.sin(t), 0], [Math.sin(t), Math.cos(t), 0], [0, 0, 1]];
const AXIS = { X: Rx, Y: Ry, Z: Rz };

/** A homogeneous transform from a rotation and a translation, of any size (ch. 2, pp. 32 and 53). */
export const hom = (R, p) => [...R.map((row, i) => [...row, p[i]]), [...R.map(() => 0), 1]];
/** Its rotation and its translation back. */
export const rotOf = T => T.slice(0, -1).map(r => r.slice(0, -1));
export const posOf = T => T.slice(0, -1).map(r => r.at(-1));

/** The inverse of a homogeneous transform: Rᵀ and −Rᵀp, not a general inverse (ch. 2, p. 32). */
export function invHom(T) {
  const Rt = transpose(rotOf(T));
  return hom(Rt, apply(Rt, posOf(T)).map(v => -v));
}

/** A point given in frame G, seen from frame R, which has G turned by θ and moved by p (ch. 2, pp. 29 and 34). */
export const toParent2 = (t, p, point) => apply(hom(rot2(t), p), [...point, 1]).slice(0, 2);
/** The way back, from R into G (ch. 2, p. 35). */
export const toChild2 = (t, p, point) => apply(invHom(hom(rot2(t), p)), [...point, 1]).slice(0, 2);

/**
 * A sequence of three rotations, "ZYX" and the like. Turned about the moving axes (Z, then Y′, then X″) the matrices
 * multiply left to right; about the fixed axes, right to left (ch. 2, pp. 44–45). Euler sequences repeat the first axis
 * (ZYZ, ZXZ); Cardan sequences use three different ones.
 */
export function euler(seq, angles, fixed = false) {
  const Rs = [...seq].map((axis, k) => AXIS[axis](angles[k]));
  return (fixed ? Rs.reverse() : Rs).reduce(matmul);
}

/** Roll about x, then pitch about y, then yaw about z, all fixed: the same as Z(yaw) Y′(pitch) X″(roll) (ch. 2, p. 50). */
export const rpy = (roll, pitch, yaw) => euler("ZYX", [yaw, pitch, roll]);

/**
 * Gimbal lock: the middle axis turns the third onto the first, so one freedom is lost (ch. 2, pp. 56–59). For a
 * Cardan sequence that is a middle angle of ±90°, for an Euler sequence 0° or 180°.
 */
export function gimbalLocked(seq, angles, tol = 1e-6) {
  const euler = seq[0] === seq[2];
  return euler ? Math.abs(Math.sin(angles[1])) < tol : Math.abs(Math.cos(angles[1])) < tol;
}

/** The angle a rotation turns by about its own axis, from its trace; 0 for the identity. */
export const turnAngle = R => Math.acos(Math.max(-1, Math.min(1, (R[0][0] + R[1][1] + R[2][2] - 1) / 2)));

/** Z Y′ X″ angles back from a matrix; at gimbal lock (pitch ±90°) the roll is set to 0 and the yaw takes the rest. */
export function zyxAngles(R) {
  const pitch = Math.atan2(-R[2][0], Math.hypot(R[0][0], R[1][0]));
  if (Math.abs(Math.cos(pitch)) < 1e-9) return [Math.atan2(-R[0][1], R[1][1]), pitch, 0];
  return [Math.atan2(R[1][0], R[0][0]), pitch, Math.atan2(R[2][1], R[2][2])];
}
