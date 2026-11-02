// A practice question's answer, worked from its data with the laws, so the answer in labs.json is checked, never
// trusted.
import * as S from "./statics.js";
import * as D from "./dynamics.js";

const LAWS = {
  springU1: q => S.twoSprings(q).u[0],
  springU2: q => S.twoSprings(q).u[1],
  polygonPerimeter: q => S.polygon(q.n, q.d).perimeter,
  polygonErrorPercent: q => -100 * S.polygon(q.n, q.d).perimeterError,
  barTip: q => S.bar(q).u.at(-1),
  barFirstStress: q => S.bar(q).sigma[0],
  barExactRootStress: q => S.barExact(q).sigma(0),
  costRatio: q => (q.factor) ** q.power,
  bendingStress: q => S.bendingStress(q.M, q.b, q.t),
  cantileverTip: q => S.cantileverExact(q).tip,
  feRootMoment: q => S.cantilever(q).at(0).M,
  shapeValue: q => S.SHAPES[q.kind].N(q.xi)[q.node],
  interpolated: q => S.interpolate(x => x * x, q.kind, q.m)(q.x),
  extrapolatedNode: q => S.extrapolate(q.s1, q.s2)[q.node],
  newtonFirst: q => S.newton({ k: q.k, c: q.c, P: q.P, maxIter: 2 }).history[0].iters[1].u,
  nonlinearU: q => S.newton(q).u,
  sdofF: q => D.sdof(q.k, q.m).f,
  twoMassF: q => D.twoMass(q).f[q.mode],
  criticalStep: q => D.criticalStep(D.sdof(q.k, q.m).omega),
  stepsNeeded: q => Math.ceil(q.duration / D.criticalStep(D.sdof(q.k, q.m).omega)),
};

/** The answer to a question's "compute" block, times its "scale" when the question asks in another unit (µm for a
 *  law in mm); an unknown law is an error naming the ones there are. */
export function solve(compute) {
  const law = LAWS[compute.law];
  if (!law) throw new Error(`No law "${compute.law}" in src/core/practice.js; there are ${Object.keys(LAWS).join(", ")}.`);
  return law(compute) * (compute.scale ?? 1);
}
