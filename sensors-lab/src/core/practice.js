// A practice question's answer, worked from its data with the laws, so the answer in labs.json is checked, never
// trusted.
import * as R from "./ranging.js";
import * as C from "./camera.js";
import * as K from "./colour.js";
import * as S from "./stereo.js";

const rad = d => d * Math.PI / 180, deg = r => r * 180 / Math.PI;
const speed = q => q.medium === "sound" ? R.C_SOUND : R.C_LIGHT;
const pick = (vec, axis) => vec[{ u: 0, x: 0, v: 1, y: 1, z: 2 }[axis]];
const cam = q => ({ fx: q.fx, fy: q.fy, cx: q.cx, cy: q.cy });

const LAWS = {
  echoDistance: q => R.echoDistance(speed(q), q.t),
  echoTime: q => R.echoTime(speed(q), q.d),
  tofPhaseDeg: q => deg(R.tofPhase(...q.A)),
  tofDistance: q => R.tofDistance(R.tofPhase(...q.A), q.fmod),
  tofRange: q => R.tofRange(q.fmod),
  tofReported: q => R.tofReported(q.d, q.fmod),
  imageBytes: q => R.imageBytes(q.w, q.h, q.bpp),
  dataRate: q => R.dataRate(q.w, q.h, q.bpp, q.fps),
  project: q => pick(C.project(cam(q), q.X), q.axis),
  backProject: q => pick(C.backProject(cam(q), q.uv, q.z), q.axis),
  projectWorld: q => pick(C.projectWorld(cam(q), C.rotY(rad(q.panDeg ?? 0)), q.t, q.X), q.axis),
  distort: q => pick(C.distort([q.xn, q.yn], q), q.axis),
  fovDeg: q => deg(C.fov(q.n, q.pitch, q.f)),
  hueDeg: q => 360 * (q.model === "hsv" ? K.hsv(...q.rgb) : K.hsi(...q.rgb)).H,
  saturation: q => (q.model === "hsv" ? K.hsv(...q.rgb) : K.hsi(...q.rgb)).S,
  luma: q => K.luma(...q.rgb),
  depth: q => S.depth(q.b, q.f / q.pitch, q.d),
  depthStep: q => S.depthStep(q.b, q.f / q.pitch, q.z),
  disparity: q => S.disparity(q.b, q.f / q.pitch, q.z),
  sad: q => S.sad(q.a, q.b),
  ssd: q => S.ssd(q.a, q.b),
  match: q => S.match(q.left, q.right, q.x, q.w, q.dMax, q.cost === "ssd" ? S.ssd : S.sad).best,
  bandPixels: q => q.hres * S.bandRatio(q.B, q.Z, rad(q.hfovDeg)),
};

/** The answer to a question's "compute" block; an unknown law is an error naming the ones there are. */
export function solve(compute) {
  const law = LAWS[compute.law];
  if (!law) throw new Error(`No law "${compute.law}" in src/core/practice.js; there are ${Object.keys(LAWS).join(", ")}.`);
  return law(compute);
}
