// The core's front door: the Bayes filter family, robot vision, the convolution layer and pose from points, the
// seeded generator, the units and the practice checker. Pure: no page, no clock, no unseeded randomness.
export { uniform, normal } from "./random.js";
export { doorPosterior, predict, correct, doorLikelihood, kalman, odometry, move, jacobian, icr, ekfPredict, motionNoise, sampleMove,
  gaussWeight, resample, particleStep, histogram } from "./filters.js";
export { blank, scene, noisy, convolve, boxKernel, gaussKernel, median, medianFilter, meanError, SOBEL_X, SOBEL_Y, sobel,
  nonMax, hysteresis, canny, threshold, histogramOf, fisherJ, otsu, colourScene, excess, rgbToHsv, hsvToRgb } from "./vision.js";
export { convParams, denseParams, bnParams, outSize, relu, maxPool, featureMap, resnetStem } from "./cnn.js";
export { stereoDepth, project, flatDepth, fitLine, linePoints, ransac } from "./pose.js";
export { si, parseSi, isRight } from "../../../kit/core/index.js";
export { solve } from "./practice.js";

/** The corridor of the filter labs: 20 cells of 1 m, closed into a ring so the robot can drive on for ever, with doors
 *  at four cells. The example of Basics, p. 10 (one door, one sensor) laid out along a corridor; the layout is ours. */
export const CORRIDOR = { cells: 20, doors: [2, 3, 8, 14] };
