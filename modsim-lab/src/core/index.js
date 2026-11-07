// The core's front door: the exercises' models, their starting values and the practice checker, with the kit's
// Runge–Kutta, units and answer check. Pure: no page, no clock, no randomness.
export * from "./models.js";
export { VALUES } from "./values.js";
export { solve } from "./practice.js";
export { simulate, si, parseSi, isRight } from "../../../kit/core/index.js";
