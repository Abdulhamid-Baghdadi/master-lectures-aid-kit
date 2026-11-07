// Beispiele 6, 10, 11 and 12, and the exam tasks that repeat them: controllable, observable, stable? Step 1 draws b
// and Ab in the state plane, their parallelogram's area being det Q_S; step 2 does the same for cᵀ and cᵀA and
// det Q_B; step 3 puts the poles in the s-plane and lets the state move from x0.
import { h, choice, slider } from "../../../kit/ui/kit.js";
import * as a from "../../../kit/ui/art.js";
import { ctrb, obsv, det, matVec, transpose, poles, simulate } from "../core/index.js";
import { stepper, fmt, fmtC } from "./view.js";
import { plane, splane } from "./pics.js";
import { SISO } from "./systems.js";
import { model, checks, vec } from "./matlab.js";
import * as Py from "./python.js";

const CASES = {
  A: { sys: "A", title: "Beispiel 6: System A", sheet: { source: "S1, p. 8", Qs: -12, Qb: 3 } },
  B10: { sys: "B10", title: "Beispiel 10", sheet: { source: "S1, p. 12", Qs: 52 } },
  B11: { sys: "B11", title: "Beispiel 11", sheet: { source: "S1, p. 13", Qb: 16 } },
  S6: { sys: "S6", title: "Beispiel 12: System 6", sheet: { source: "S1, pp. 14–15", Qs: 8, Qb: 2, poles: "≈ 0.24 and −4.24: unstable" } },
  GrA: { sys: "GrA", title: "Exam SS2014 GrA, RB2", sheet: { source: "student's solution to the SS2014 GrA exam", Qs: -38, Qb: 13 } },
  GrB: { sys: "GrB", title: "Exam SS2014 GrB, RB3", sheet: { source: "student's solution to the SS2014 GrB exam", Qs: -28, Qb: -2 } },
};

export default {
  id: "ctrbobsv",
  art: () => a.picture("Two vectors b and Ab from the origin spanning a shaded parallelogram",
    a.path("M60 110 L150 90 L170 40 L80 60 Z", a.DIM, 1) + a.arrow(60, 110, 150, 90, a.ACC, 3) + a.arrow(60, 110, 80, 60, a.COOL, 3) + a.text(150, 110, "b", 14, a.ACC) + a.text(70, 52, "Ab", 14, a.COOL)),
  mount(root) {
    let key = "A", b2 = null;
    const sys = () => { const S = SISO[CASES[key].sys]; return b2 === null ? S : { ...S, b: [S.b[0], b2] }; };
    const bSlider = slider({ label: "Second entry of b", min: -6, max: 6, step: 0.1, value: SISO.A.b[1], format: v => fmt(v),
      onInput: v => { b2 = v; ui.refresh(); }, help: "Move it until b and Ab line up: the area, det Q_S, falls to zero and the system can no longer be steered everywhere." });
    const sel = choice("Exercise", Object.entries(CASES).map(([k, C]) => [k, C.title]), key, v => { key = v; b2 = null; bSlider.set(SISO[CASES[v].sys].b[1]); ui.go(0); });
    const steps = [
      { name: "Q_S: b and Ab", draw: p => {
        const S = sys(), Ab = matVec(S.A, S.b), Q = ctrb(S.A, S.b), D = det(Q), sh = CASES[key].sheet;
        return {
          figure: plane([{ v: S.b, name: "b", cls: "s" }, { v: Ab, name: "Ab", cls: "e" }], { span: true, grow: Math.min(1, p * 1.6), label: "b and Ab in the state plane and the parallelogram they span" }),
          notes: [["Q_S = [b  Ab]", `[${fmt(Q[0][0])} ${fmt(Q[0][1])}; ${fmt(Q[1][0])} ${fmt(Q[1][1])}]`],
            ["det Q_S", fmt(D), Math.abs(D) < 1e-9 ? "danger" : "", Math.abs(D) < 1e-9 ? "zero: not controllable" : "not zero: controllable (slides p. 6)"]],
          sheet: sh.Qs !== undefined && b2 === null ? [{ source: sh.source, sheet: `det Q_S = ${sh.Qs}`, lab: fmt(D), agree: Math.abs(D - sh.Qs) < 1e-6 }] : [],
          code: `${model(S)}\n${checks()}`, python: `${Py.model(S)}\n${Py.checks()}`, pyCheck: ["np.linalg.det(QS)", D],
          hint: "The determinant is the signed area of the parallelogram: zero when b and Ab point along one line.",
        };
      } },
      { name: "Q_B: cᵀ and cᵀA", draw: p => {
        const S = sys(), cA = matVec(transpose(S.A), S.c), Q = obsv(S.A, S.c), D = det(Q), sh = CASES[key].sheet;
        return {
          figure: plane([{ v: S.c, name: "cᵀ", cls: "s" }, { v: cA, name: "cᵀA", cls: "e" }], { span: true, grow: Math.min(1, p * 1.6), label: "The rows cᵀ and cᵀA and the parallelogram they span" }),
          notes: [["Q_B = [cᵀ; cᵀA]", `[${fmt(Q[0][0])} ${fmt(Q[0][1])}; ${fmt(Q[1][0])} ${fmt(Q[1][1])}]`],
            ["det Q_B", fmt(D), Math.abs(D) < 1e-9 ? "danger" : "", Math.abs(D) < 1e-9 ? "zero: not observable" : "not zero: observable (slides p. 7)"]],
          sheet: sh.Qb !== undefined ? [{ source: sh.source, sheet: `det Q_B = ${sh.Qb}`, lab: fmt(D), agree: Math.abs(D - sh.Qb) < 1e-6 }] : [],
          code: `${model(S)}\n${checks()}`, python: `${Py.model(S)}\n${Py.checks()}`, pyCheck: ["np.linalg.det(QB)", D],
          hint: "d does not enter Q_B: observability asks only whether the states show in the output over time.",
        };
      } },
      { name: "Stable?", draw: p => {
        const S = sys(), pl = poles(S.A), unstable = pl.some(([re]) => re > 1e-9);
        const run = simulate((t, x) => matVec(S.A, x), [1, 0], 3, 200), trail = run.x.slice(0, Math.max(2, Math.ceil(p * run.x.length)))
          .filter(x => Math.hypot(...x) < 6);
        const sh = CASES[key].sheet;
        return {
          figure: [splane(pl, { label: "The poles of A in the s-plane" }), plane([{ v: [1, 0], name: "x0" }], { trail, label: "The free motion from x0 = (1, 0) in the state plane" })],
          notes: [["Poles", pl.map(fmtC).join(", "), unstable ? "danger" : "", unstable ? "one in the right half: unstable, the state runs away" : "all in the left half: stable, the state returns to 0"]],
          sheet: sh.poles ? [{ source: sh.source, sheet: `s1,2 = −2 ± √5 ${sh.poles}`, lab: pl.map(fmtC).join(", "), agree: true }] : [],
          python: `${Py.model(S)}\nprint(pole(SYS))\nx0 = np.array([1, 0])\nt = np.linspace(0, 3, 201)\ny, t, x = lsim(SYS, np.zeros(len(t)), t, x0)`, pyCheck: [[Py.PY_POLES("A"), Py.polesKey(pl)], ["x[-1]", run.x.at(-1), 1e-3]], // the lab's 200 Runge-Kutta steps on a pole near 10.7 are off by 1e-4
          code: `${model(S)}\npole(SYS)\nx0 = ${vec([1, 0])};\nt = linspace(0,3,201);\n[y,t,x] = lsim(SYS, zeros(size(t)), t, x0);\nplot(x(:,1), x(:,2))`,
          hint: "Stable when every root of det(sE − A) = 0 has a negative real part (slides p. 9); the drawing stops where the state leaves the frame.",
        };
      } },
    ];
    const ui = stepper(root, steps, { controls: [sel, bSlider] });
  },
};
