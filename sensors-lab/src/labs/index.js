// The labs; data/labs.json puts them in order under their parts. Adding a lab: write its module, add it here and its
// words to data/labs.json.
import ranging from "./ranging.js";
import imagedata from "./imagedata.js";
import pinhole from "./pinhole.js";
import extrinsic from "./extrinsic.js";
import distortion from "./distortion.js";
import colour from "./colour.js";
import tof from "./tof.js";
import stereo from "./stereo.js";
import correspondence from "./correspondence.js";

export const labs = [ranging, imagedata, pinhole, extrinsic, distortion, colour, tof, stereo, correspondence];
