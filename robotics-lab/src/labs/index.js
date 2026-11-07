// The labs; data/labs.json puts them in order under their chapters. Adding a lab: write its module, add it here and its
// words to data/labs.json.
import dof from "./dof.js";
import frames2d from "./frames2d.js";
import rotations from "./rotations.js";
import planar from "./planar.js";
import dh from "./dh.js";
import irb120 from "./irb120.js";
import jacobian from "./jacobian.js";
import ik from "./ik.js";
import dhsteps from "./dhsteps.js";
import irbsteps from "./irbsteps.js";
import jacsteps from "./jacsteps.js";
import iksteps from "./iksteps.js";

export const labs = [dof, frames2d, rotations, planar, dh, irb120, jacobian, ik, dhsteps, irbsteps, jacsteps, iksteps];
