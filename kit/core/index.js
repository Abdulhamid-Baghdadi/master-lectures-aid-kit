// The kit core's front door: complex numbers, units, the answer check and fixed-step Runge–Kutta every lab shares. Pure: no page, no clock,
// no randomness. It names no lab.
export * from "./complex.js";
export { si, parseSi } from "./units.js";
export { isRight } from "./answer.js";
export { rk4Step, simulate } from "./ode.js";
export { examQuestions } from "./exams.js";
