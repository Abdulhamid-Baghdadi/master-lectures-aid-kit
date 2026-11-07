// The core's front door: polynomials and matrices, state space as the course writes it, the exercises' models, the
// units and the practice checker. Pure: no page, no clock, no randomness.
export * from "./lti.js";
export { ss2tf, normalForms, ctrb, obsv, verdict, poles, stable, placeGain, closedLoop, prefilter, observerGain,
  withObserver, butterworth, lyap, lqr, linearise, stepRun, finalValue, stepinfo, col } from "./ss.js";
export * from "./models.js";
export { si, parseSi, isRight } from "../../../kit/core/index.js";
export { solve, tangent, NONLINEAR } from "./practice.js";
