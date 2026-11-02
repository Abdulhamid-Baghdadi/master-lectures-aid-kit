// The core's front door: the laws of linkages, motion design and grippers, the units and the practice checker. Pure:
// no page, no clock, no randomness.
export { deg, rad, mobility, grashof, sliderCrankRotates, circles, fourBar, transmission, minTransmission, deadCentres,
  synthesise, pole, cognates, poleCount, velocityRatio, cmul } from "./mechanisms.js";
export { quintic, polynomial, LAWS, characteristic, peaks, camLift, cam, turned, indexing, indexStep, feedLength } from "./motion.js";
export { MU0, airPressure, suctionForce, cupArea, magnetForce } from "./grippers.js";
export { si, parseSi, isRight } from "../../../kit/core/index.js";
export { solve } from "./practice.js";
