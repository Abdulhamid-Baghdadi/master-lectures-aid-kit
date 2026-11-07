// A practice question's answer, worked from its data with the core, so the answer in labs.json (the solution sheet's
// value) is checked, never trusted.
import { det } from "./lti.js";
import { ss2tf, ctrb, obsv, poles, prefilter, linearise, normalForms, butterworth, finalValue } from "./ss.js";
import { placeByRnf, observeByBnf, circuit20, circuit27, circuit28, motor21, crane } from "./models.js";

/** The nonlinear systems of Beispiele 23–26 as ẋ = f(x, u), v = g(x, u), from the task sheet's equations. K are
 *  the constants of Beispiel 24, given by the question. */
export const NONLINEAR = {
  bsp23: ({ D = 0.5, w = 2 } = {}) => ({ f: ([y, yd]) => [yd, -D * yd - w * w * Math.sin(y)], g: ([y]) => y, n: 2 }),
  bsp24: ({ K }) => ({
    f: ([x1, x2], u) => [-(K[1] * x1 * Math.cos(x1) + K[2] * Math.sin(x2) + K[3] * u) / K[0],
                         -(K[5] * Math.sin(x1) + K[6] * x2 * Math.cos(x2) + K[7] * u) / K[4]],
    g: ([x1, x2], u) => K[8] * x1 + K[9] * x2 + K[10] * u, n: 2 }),
  bsp25: () => ({
    f: ([x1, x2, x3], u) => [-2 * Math.sin(x1) - 3 * x2 * Math.cos(x2) - 4 * x3 - 3 * u,
                             2 * x1 + 2 * Math.tan(x2) + x3 + u,
                             -6 * x1 - 7 * x2 * x2 - 8 * x3 - 9 * u],
    g: ([x1, x2, x3], u) => -2 * x1 - 3 * x2 - 4 * x3 - 5 * u, n: 3 }),
  bsp26: () => ({
    f: ([x1, x2, x3], u) => [-2 * Math.sin(x1) - 3 * x2 * Math.cos(x2) - 4 * Math.sin(x3) - 3 * u,
                             Math.sin(x1) + 2 * Math.tan(x2) + x3 + u,
                             -6 * x1 - 7 * x2 - 8 * x3 - 9 * u],
    g: ([x1, x2, x3], u) => -2 * x1 - 3 * x2 - 4 * x3 - 5 * u, n: 3 }),
  // The past exams' systems not among the Beispiele (Prüfungen\, file and page in data/labs.json). C are the
  // constants C1 … C11 of SS2014 group B, given by the question.
  exam14b: ({ C }) => ({
    f: ([x1, x2], u) => [-(C[1] * Math.sin(x1) + C[2] * x2 * Math.cos(x2) + C[3] * u) / C[0],
                         -(C[5] * x1 * Math.cos(x1) + C[6] * Math.sin(x2) + C[7] * u) / C[4]],
    g: ([x1, x2], u) => -C[8] * x1 - C[9] * x2 - C[10] * u, n: 2 }),
  exam17a: () => ({
    f: ([x1, x2, x3], u) => [1.3 * x1 + Math.sin(x2) * Math.cos(x3) - 2.2 * u,
                             0.27 * x1 * x1 - 2.1 * x1 * Math.cos(x2) - 3.7 * x3,
                             -Math.atan(x1) - 0.7 * u],
    g: ([x1, x2, x3]) => -2.8 * x1 + 0.3 * x2 - 4.4 * x3 * x3, n: 3 }),
  exam17b: () => ({
    f: ([x1, x2, x3], u) => [Math.cos(x1) * Math.sin(x2) - 3.3 * x3 * x3,
                             -1.35 * x1 - 2.1 * x2 * Math.cos(x2) - 2.1 * Math.sin(x3),
                             -2.7 * x2 - Math.atan(x3) + 1.2 * u],
    g: ([x1, x2, x3]) => 1.4 * x1 * x1 + 1.8 * x2 + 6.7 * x3, n: 3 }),
};

/** The past exams' questions on one lab, each prefixed with its exam and task, so a lab's Practise tab can show
 *  them below the Beispiele' questions without a second copy in data/labs.json. */
export function examQuestions(exams, labId) {
  return exams.flatMap(e => e.tasks.filter(t => t.lab === labId)
    .flatMap(t => t.questions.map(q => ({ ...q, question: `${e.title}, RB${t.number}: ${q.question}` }))));
}
/** A, b, cᵀ, d of a nonlinear system's tangent at x0 = 0, u0 = 0. */
export function tangent(name, params = {}) {
  const sys = NONLINEAR[name](params);
  return linearise(sys.f, sys.g, new Array(sys.n).fill(0), 0);
}
const pick = (m, at) => at.reduce((v, k) => v[k], m);

const LAWS = {
  tf: q => ss2tf(q.A, q.b, q.c, q.d ?? 0)[q.part][q.k],
  detQs: q => det(ctrb(q.A, q.b)),
  detQb: q => det(obsv(q.A, q.c)),
  maxPoleRe: q => Math.max(...poles(q.A).map(p => p[0])),
  rRnf: q => placeByRnf(q.A, q.b, q.c, q.poles).rRnf[q.k],
  Kf: q => prefilter(q.A, q.b, q.c, q.r ?? placeByRnf(q.A, q.b, q.c, q.poles).r),
  lBnf: q => observeByBnf(q.A, q.b, q.c, q.poles).lBnf[q.k],
  tangent: q => pick(tangent(q.system, q.params), q.at),
  circuit20Qs: q => det(ctrb(circuit20(q).A, circuit20(q).b)),
  circuit20Qb: q => { const m = circuit20(q); return det(obsv(m.A, m.c)); },
  motor21: q => pick(motor21(q), q.at),
  crane: q => pick(crane(q), q.at),
  entry: q => pick(q.M, q.at),
  nf: q => pick(normalForms(q.num, q.den), q.at),
  circuit27: q => pick(circuit27(q), q.at),
  circuit28: q => pick(circuit28(q), q.at),
  butterworth: q => pick(butterworth(q.n, q.w0), q.at),
  dcGain: q => { const m = circuit20(q, q.scale); return finalValue(m.A, m.b, m.c, 0); },
};

/** The answer to a question's "compute" block; an unknown law is an error naming the ones there are. */
export function solve(compute) {
  const law = LAWS[compute.law];
  if (!law) throw new Error(`No law "${compute.law}" in src/core/practice.js; there are ${Object.keys(LAWS).join(", ")}.`);
  return law(compute);
}
