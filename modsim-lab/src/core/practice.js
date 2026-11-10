// A practice question's answer, worked from its data with the core, so the answer in labs.json is checked, never
// trusted.
import { g, smd, pendel, rlc, twoMass, doppel, motor, shaker, cartPendulum, chain2, rolle, rolleRest, modes2,
  elasticPendulum, unbalance, coupledPendulum, rollingDiscs, rollerPendulum, manipulator } from "./models.js";

const LAWS = {
  w0: q => smd(q).w0,
  wD: q => smd(q).wD,
  f0: q => smd(q).f0,
  T0: q => smd(q).T0,
  pendelT0: q => pendel(q).T0,
  pendelW0: q => pendel(q).w0D,
  rlcW0: q => rlc(q).w0,
  twoMassF: q => twoMass(q).modes[q.mode].f,
  twoMassLambda: q => twoMass(q).modes[q.mode].lambda,
  modesLambda: q => modes2(q.K, q.M)[q.mode].lambda,
  doppelOmega: q => doppel(q).modes[q.mode].omega,
  motorW: q => motor(q).wInf,
  shakerX: q => shaker(q).xInf,
  cartF: q => cartPendulum(q).modes[q.mode].f,
  cartRest: q => cartPendulum(q).rest,
  chainF: q => chain2(q).modes[q.mode].f,
  rolleRest: q => rolleRest(rolle(q)) * 180 / Math.PI,
  elasticF: q => elasticPendulum(q).modes[q.mode].f,
  unbalanceF: q => unbalance(q).modes[q.mode].f,
  coupledF: q => coupledPendulum(q).modes[q.mode].f,
  discsF: q => rollingDiscs(q).modes[q.mode].f,
  rollerF: q => rollerPendulum(q).modes[q.mode].f,
  robotF: q => manipulator(q).modes[q.mode].f,
  gravity: () => g,
};

/** The answer to a question's "compute" block; an unknown law is an error naming the ones there are. */
export function solve(compute) {
  const law = LAWS[compute.law];
  if (!law) throw new Error(`No law "${compute.law}" in src/core/practice.js; there are ${Object.keys(LAWS).join(", ")}.`);
  return law(compute);
}
