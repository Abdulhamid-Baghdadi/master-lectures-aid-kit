// A practice question's answer, worked from its data with the laws, so the answer in labs.json is checked, never
// trusted.
import * as F from "./filters.js";
import * as V from "./vision.js";
import * as C from "./cnn.js";
import * as P from "./pose.js";

const patch = rows => ({ w: rows[0].length, h: rows.length, px: rows.flat() });
const centre = img => img.px[((img.h - 1) >> 1) * img.w + ((img.w - 1) >> 1)];
const kalman = q => F.kalman(q);

const LAWS = {
  door: q => F.doorPosterior(q),
  corridorDoor: q => {
    const doors = Array.from({ length: q.n }, (_, i) => i < q.doors);
    return F.correct(new Array(q.n).fill(1 / q.n), F.doorLikelihood(doors, true, q.hit, q.falseHit)).bel[0];
  },
  kalmanMu: q => kalman(q).mu,
  kalmanSigma: q => kalman(q).sigma2,
  kalmanGain: q => kalman(q).K,
  odometryD: q => F.odometry(q.dPhiL, q.dPhiR, q.r, q.b).dd,
  odometryTheta: q => F.odometry(q.dPhiL, q.dPhiR, q.r, q.b).dth,
  moveX: q => F.move([q.x, q.y, q.th], q.dd, q.dth)[0],
  jacobian13: q => F.jacobian([0, 0, q.th], q.dd, q.dth)[0][2],
  weight: q => F.gaussWeight(q.z, q.zHat, q.sd),
  median: q => V.median(q.values),
  box: q => centre(V.convolve(patch(q.patch), V.boxKernel(3))),
  sobelX: q => centre(V.convolve(patch(q.patch), V.SOBEL_X)),
  sobelMag: q => { const g = V.sobel(patch(q.patch)); return centre(g.mag); },
  excess: q => V.excess(q.main, q.o1, q.o2),
  hue: q => V.rgbToHsv(q.r, q.g, q.b).H,
  saturation: q => V.rgbToHsv(q.r, q.g, q.b).S,
  fisherJ: q => { const h = new Array(256).fill(0); q.values.forEach(v => h[v]++); return V.fisherJ(h, q.th).J; },
  convParams: q => C.convParams(q.m, q.n, q.d, q.k),
  denseParams: q => C.denseParams(q.nPrev, q.nL),
  outSize: q => C.outSize(q.size, q.m, q.s, q.p),
  depth: q => P.stereoDepth(q.B, q.f, q.D),
  projectU: q => P.project([q.x, q.y, q.z], q)[0],
  flatDepth: q => P.flatDepth(q.real, q.image, q.f),
  lsqSlope: q => P.fitLine(q.points).k,
};

/** The answer to a question's "compute" block; an unknown law is an error naming the ones there are. */
export function solve(compute) {
  const law = LAWS[compute.law];
  if (!law) throw new Error(`No law "${compute.law}" in src/core/practice.js; there are ${Object.keys(LAWS).join(", ")}.`);
  return law(compute);
}
