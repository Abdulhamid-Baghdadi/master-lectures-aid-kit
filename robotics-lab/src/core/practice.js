// A practice question's answer, worked from its data with the laws, so the answer in labs.json is checked, never
// trusted. Angles in the data are in degrees, as the course writes them.
import * as F from "./frames.js";
import * as C from "./chains.js";
import * as I from "./inverse.js";

const r = F.rad, d = F.deg;
const pick = (v, out) => ({ x: v[0], y: v[1], z: v[2] })[out];

const LAWS = {
  dof: q => C.dof(q.T, q.n, q.g, q.f),
  polarX: q => q.l * Math.cos(r(q.t)),
  polarAngle: q => d(Math.asin(q.y / q.l)),
  toParent2: q => pick(F.toParent2(r(q.t), q.p, q.point), q.out),
  toChild2: q => pick(F.toChild2(r(q.t), q.p, q.point), q.out),
  translate: q => pick(q.p.map((v, i) => v + q.point[i]), q.out),
  eulerEntry: q => F.euler(q.seq, q.angles.map(r), q.fixed)[q.row - 1][q.col - 1],
  planar2r: q => { const a = C.planar2r(q.l1, q.l2, r(q.t1), r(q.t2)); return q.out === "phi" ? d(a.phi) : pick(a.tip, q.out); },
  bentArm: q => pick(C.bentArm(q.l, r(q.t1)).tip, q.out),
  rrt: q => pick(F.posOf(C.chain(C.rrtRows(q.l, r(q.t1), r(q.t2), q.l5)).at(-1)), q.out),
  irbWrist: q => pick(C.wristCentre([0, r(q.axis2), r(q.axis3), 0, 0, 0]), q.out),
  rtVel: q => pick(F.apply(C.jacobianRT(q.l1, r(q.t1), q.l2), [q.w1, q.v2]), q.out),
  det2r: q => C.det(C.jacobian2r(q.l1, q.l2, r(q.t1), r(q.t2))),
  irbFlange: q => pick(F.posOf(C.irb120(q.q.map(r))[6]), q.out),
  ik3r: q => { const s = I.ik3r(q.l1, q.l2, q.l3, q.x, q.y, r(q.phi)).solutions.find(s => s.sign === q.sign); return d(s[q.out]); },
  irbIk: q => { const T = C.irb120(q.q.map(r))[6], s = I.ikIrb120(T, C.irb120).solutions.find(s => s.sign === q.sign); return d(s.q[q.axis - 1]); },
  ik2r: q => { const s = I.ik2r(q.l1, q.l2, q.x, q.y).solutions.find(s => s.sign === q.sign); return d(s[q.out]); },
  reach: q => q.x * q.x + q.y * q.y,
  turnTilt: q => d(I.ikTurnTilt(q.l1, q.l2, q.p)[q.out]),
};

/** The answer to a question's "compute" block; an unknown law is an error naming the ones there are. */
export function solve(compute) {
  const law = LAWS[compute.law];
  if (!law) throw new Error(`No law "${compute.law}" in src/core/practice.js; there are ${Object.keys(LAWS).join(", ")}.`);
  return law(compute);
}
