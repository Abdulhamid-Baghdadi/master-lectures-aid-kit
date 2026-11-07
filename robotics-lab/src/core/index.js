// The core's front door: frames and rotations, serial chains and their Jacobians, inverse kinematics, the units and the
// practice checker. Pure: no page, no clock, no randomness.
export { rad, deg, matmul, transpose, apply, identity, rot2, Rx, Ry, Rz, hom, rotOf, posOf, invHom, toParent2, toChild2,
  euler, rpy, gimbalLocked, turnAngle, zyxAngles } from "./frames.js";
export { dof, dh, chain, rrtRows, planar2r, planar2rT, bentArm, IRB120, WRIST_TABLE, STUDENT_ROWS, irb120Student, irb120, wristCentre, jacobian, jacobian2r,
  jacobianRT, det, speedEllipse } from "./chains.js";
export { ik2r, ik2rTriangle, ikTurnTilt, fkTurnTilt, ik3r, ikIrb120 } from "./inverse.js";
export { si, parseSi, isRight } from "../../../kit/core/index.js";
export { solve } from "./practice.js";
