// A practice question's answer, worked from its data with the laws, so the answer in labs.json is checked, never
// trusted.
import * as K from "./mechanisms.js";
import * as M from "./motion.js";
import * as G from "./grippers.js";

const LAWS = {
  mobility: q => K.mobility(q.n, q.g1, q.g2).F,
  poleCount: q => K.poleCount(q.n),
  grashofMargin: q => { const g = K.grashof(q.lengths); return g.rhs - g.lhs; },
  sliderGap: q => Math.abs(q.l - q.r),
  ratio: q => q.phi0 / (360 - q.phi0),
  poleY: q => K.pole(q.A1, q.A2, q.B1, q.B2).P[1],
  poleAngle: q => K.deg(K.pole(q.A1, q.A2, q.B1, q.B2).angle),
  quinticA3: q => M.quintic(q)[3],
  Cv: q => M.characteristic(q.motion ? M.LAWS[q.motion] : M.polynomial(M.quintic(q))).Cv.value,
  Ca: q => M.characteristic(q.motion ? M.LAWS[q.motion] : M.polynomial(M.quintic(q))).Ca.value,
  CM: q => M.characteristic(q.motion ? M.LAWS[q.motion] : M.polynomial(M.quintic(q))).CM.value,
  peakSpeed: q => M.peaks(M.characteristic(M.LAWS[q.motion]), K.rad(q.yHDeg), K.rad(q.xPDeg), 2 * Math.PI * q.rpm / 60).v,
  peakAccel: q => M.peaks(M.characteristic(M.LAWS[q.motion]), K.rad(q.yHDeg), K.rad(q.xPDeg), 2 * Math.PI * q.rpm / 60).a,
  camSlope: q => q.sH * M.characteristic(M.LAWS[q.motion]).Cv.value / K.rad(q.phiPDeg),
  rollers: q => M.indexing(q.stations, q.ga).nR,
  stepAngle: q => M.indexing(q.stations, q.ga).phiS,
  feed: q => M.feedLength(q.phiDeg, q.r),
  altitude: q => G.airPressure(q.h) / 100,
  suction: q => G.suctionForce({ po: q.po, pu: q.pu, A: G.cupArea(q.d), n3: q.n3, eta: q.eta, z: q.z, S: q.S }),
  magnet: q => G.magnetForce({ A: q.A, B: q.B, mur: q.mur }),
};

/** The answer to a question's "compute" block; an unknown law is an error naming the ones there are. */
export function solve(compute) {
  const law = LAWS[compute.law];
  if (!law) throw new Error(`No law "${compute.law}" in src/core/practice.js; there are ${Object.keys(LAWS).join(", ")}.`);
  return law(compute);
}
