// The core's front door: the small dense solvers, the static models (springs, bar, beam, polygon, shape functions,
// Gauss-point extrapolation, the Newton iteration) and the dynamic ones (natural frequencies, time integration), the
// units and the practice checker. Pure: no page, no clock, no randomness.
export { zeros, solve as solveLinear, mulVec, eigSym } from "./linalg.js";
export { twoSprings, assemble, springChain, bar, barExact, beamElement, cantilever, cantileverExact, bendingStress,
  polygon, SHAPES, interpolate, gaussPoints, extrapolate, stressRecovery, springForce, newton } from "./statics.js";
export { sdof, twoMass, chainModes, integrate, criticalStep } from "./dynamics.js";
export { si, parseSi, isRight } from "../../../kit/core/index.js";
export { solve } from "./practice.js";
