// The core's front door: the laws of ranging, the camera model, colour and stereo, the units and the practice
// checker. Pure: no page, no clock, no randomness.
export { C_LIGHT, C_SOUND, echoDistance, echoTime, tofPhase, tofDistance, modWavelength, tofRange, tofSamples, tofReported,
  imageBytes, dataRate } from "./ranging.js";
export { project, K, Kinv, mulV, mulM, transpose, backProject, rotY, rotX, toCamera, toWorld, projectWorld, normalise,
  toPixels, distort, distortedPixel, fov } from "./camera.js";
export { hsi, hsv, luma, meanGrey, bayerPrimary, bayerComplementary, primaryCell, complementaryCell } from "./colour.js";
export { depth, disparity, depthStep, range, sad, ssd, match, bandRatio, bandPixels } from "./stereo.js";
export { si, parseSi, isRight } from "../../../kit/core/index.js";
export { solve } from "./practice.js";
