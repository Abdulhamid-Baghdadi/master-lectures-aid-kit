// The labs; data/labs.json puts them in order under their parts. Adding a lab: write its module, add it here and its
// words to data/labs.json.
import histogram from "./histogram.js";
import kalman from "./kalman.js";
import odometry from "./odometry.js";
import ekf from "./ekf.js";
import particles from "./particles.js";
import denoise from "./denoise.js";
import threshold from "./threshold.js";
import hsv from "./hsv.js";
import edges from "./edges.js";
import cnn from "./cnn.js";
import stereo from "./stereo.js";
import ransac from "./ransac.js";

export const labs = [histogram, kalman, odometry, ekf, particles, denoise, threshold, hsv, edges, cnn, stereo, ransac];
