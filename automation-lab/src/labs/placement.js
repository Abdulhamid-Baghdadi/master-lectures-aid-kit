// Beispiele 13–16 and the exam tasks that repeat them: a state controller by pole placement with a prefilter. Step 1
// compares coefficients in the RNF (slides p. 13) while the poles walk to their places; step 2 lets the reader move
// the poles and watch the step response; step 3 carries rᵀ back to the plant's own states; step 4 adds the prefilter.
import { h, choice, slider } from "../../../kit/ui/kit.js";
import * as a from "../../../kit/ui/art.js";
import { poles, closedLoop, prefilter, stepRun, stepinfo, placeByRnf, toRnf, ackermann, finalValue } from "../core/index.js";
import { stepper, fmt, fmtC, fmtVec, same } from "./view.js";
import { splane, grow, mtx } from "./pics.js";
import { SISO } from "./systems.js";
import { model, placement, placementRnf, vec } from "./matlab.js";

export const CASES = {
  B13: { title: "Beispiel 13: System A, s = −1 ± j3", sys: SISO.A, poles: [[-1, 3], [-1, -3]], sheet: { source: "S1, pp. 16–17", rRnf: [39, 10], Kf: -10 / 13, KfText: "−10/13" } },
  B14: { title: "Beispiel 14: System 5, s = −2 ± j2", sys: SISO.S5, poles: [[-2, 2], [-2, -2]], sheet: { source: "S1, pp. 18–19", rRnf: [15, 4], Kf: -2 / 7, KfText: "−8/28 = −2/7" } },
  B15: { title: "Beispiel 15: s = −1, −2", sys: SISO.B15, poles: [[-1, 0], [-2, 0]], sheet: { source: "S1, p. 20", rRnf: [6, -5] } },
  B16: { title: "Beispiel 16: rᵀ = [13 25] given", sys: SISO.B15, r: [13, 25], sheet: { source: "S1, p. 21", Kf: 4.5, KfText: "9/2" } },
  GrA: { title: "Exam SS2014 GrA, RB1: s = −3 ± j", sys: { A: [[0, 1], [3, -4]], b: [0, 1], c: [3, -2], d: 0 }, poles: [[-3, 1], [-3, -1]],
    sheet: { source: "student's solution to the SS2014 GrA exam", rRnf: [13, 2], Kf: 10 / 3, KfText: "10/3" } },
  GrB: { title: "Exam SS2014 GrB, RB2: s = −2 ± j2", sys: { A: [[0, 1], [-2, 3]], b: [0, 1], c: [-1, 3], d: 0 }, poles: [[-2, 2], [-2, -2]],
    sheet: { source: "student's solution to the SS2014 GrB exam", rRnf: [6, 7], Kf: -8, KfText: "−8" } },
};

/** Two wanted poles from two sliders: a pair σ ± jω, or two real poles when the exercise has real ones. */
const fromSliders = (C, s1, s2) => C.poles[0][1] ? [[s1, s2], [s1, -s2]] : [[s1, 0], [-s2, 0]];
const sorted = p => [...p].sort((x, y) => x[1] - y[1] || x[0] - y[0]);

export default {
  id: "placement",
  art: () => a.picture("Two poles moving left in the s-plane and the step response that settles faster",
    a.line([[100, 10], [100, 140]], a.DIM, 1) + a.line([[10, 75], [190, 75]], a.DIM, 1) + a.text(140, 50, "×", 18, a.DIM) + a.text(140, 106, "×", 18, a.DIM) +
    a.arrow(135, 45, 70, 45, a.ACC, 2) + a.arrow(135, 101, 70, 101, a.ACC, 2) + a.text(62, 50, "×", 18, a.ACC) + a.text(62, 106, "×", 18, a.ACC)),
  mount(root) {
    let key = "B13", wanted = CASES.B13.poles;
    const s1 = slider({ label: "Real part σ", min: -8, max: -0.2, step: 0.1, value: -1, format: v => fmt(v), onInput: v => { wanted = fromSliders(CASES[key], v, s2.get()); ui.refresh(); } });
    const s2 = slider({ label: "Imaginary part ω", min: 0, max: 8, step: 0.1, value: 3, format: v => fmt(v), help: "With two real poles (Beispiel 15), this slider puts the second pole at −ω.", onInput: v => { wanted = fromSliders(CASES[key], s1.get(), v); ui.refresh(); } });
    const sel = choice("Exercise", Object.entries(CASES).map(([k, C]) => [k, C.title]), key, v => {
      key = v; const C = CASES[v];
      if (C.poles) { wanted = C.poles; s1.set(C.poles[0][0]); s2.set(C.poles[0][1] || -C.poles[1][0]); }
      ui.go(0);
    });
    const design = () => {
      const C = CASES[key], S = C.sys;
      const r = C.r ?? placeByRnf(S.A, S.b, S.c, wanted).r;
      return { C, S, r, Kf: prefilter(S.A, S.b, S.c, r), pl: poles(closedLoop(S.A, S.b, r)) };
    };
    const steps = [
      { name: "Compare coefficients", draw: p => {
        const { C, S, r } = design(), rn = toRnf(S.A, S.b, S.c), open = sorted(poles(S.A)), goal = sorted(poles(closedLoop(S.A, S.b, r)));
        const now = open.map((q, i) => [q[0] + p * (goal[i][0] - q[0]), q[1] + p * (goal[i][1] - q[1])]);
        const pr = C.r ? null : placeByRnf(S.A, S.b, S.c, wanted), k = Math.floor(p * 3);
        const rRnf = pr ? pr.rRnf : C.r; // Beispiel 16: rᵀ is given, and A is already an RNF
        return {
          figure: [splane(now, { second: p >= 1 ? [] : open, label: "The poles walking from the plant's to the wanted ones" }),
            h("div", { class: "mtx-row" }, mtx("A_RNF", rn.A, {}), pr ? mtx("a", pr.a, { row: true, cells: k >= 0 ? 9 : 0 }) : null,
              pr ? mtx("p", pr.p, { row: true, cells: k >= 1 ? 9 : 0 }) : null, mtx("rᵀ_RNF = p − a", rRnf, { row: true, cells: k >= 2 ? 9 : 0 }))],
          notes: [["rᵀ_RNF", fmtVec(rRnf), "", "r_i = p_(i−1) − a_(i−1), read straight off the last rows (slides p. 13)"], ["Plant poles", open.map(fmtC).join(", ")]],
          sheet: C.sheet.rRnf ? [{ source: C.sheet.source, sheet: `rᵀ_RNF = (${C.sheet.rRnf.join(" ")})`, lab: fmtVec(rRnf), agree: same(rRnf, C.sheet.rRnf) }] : [],
          code: `${model(S)}\n${pr ? placementRnf(pr.a, pr.p) : `rT = ${vec(C.r, false)};`}`,
          hint: "In the RNF, A − b rᵀ is again an RNF, so each coefficient of the closed loop is a_i + r_(i+1): set it to the wanted p_i.",
        };
      } },
      { name: "Move the poles", draw: p => {
        const { C, S, r, Kf, pl } = design(), T = Math.min(20, 6 / Math.max(0.2, Math.min(...pl.map(([re]) => -re)))), run = stepRun(closedLoop(S.A, S.b, r), S.b.map(v => v * Kf), S.c, 0, T, 400);
        const u = run.x.map(x => -x.reduce((s, v, i) => s + r[i] * v, 0) + Kf), info = stepinfo(run.t, run.y, 1);
        return {
          figure: [splane(pl, { label: "The closed loop's poles" }), grow({ p, label: "Step response with prefilter and the input u", xLabel: "t [s]", yLabel: "v, u",
            lines: [{ x: run.t, y: run.y, name: "v" }, { x: run.t, y: u, name: "u", cls: "second" }] })],
          notes: [["rᵀ", fmtVec(r)], ["Rise time (10–90 %)", `${fmt(info.RiseTime, 3)} s`], ["Settling time (2 %)", `${fmt(info.SettlingTime, 3)} s`],
            ["Overshoot", `${fmt(info.Overshoot, 3)} %`], ["Largest |u|", fmt(Math.max(...u.map(Math.abs)), 3), "", "faster poles need a larger input"]],
          code: `${model(S)}\n${C.r ? `rT = ${vec(C.r, false)};\nAr = A - b*rT;\nKf = inv(cT*inv(-A+b*rT)*b);\nSYSrKf = ss(Ar,b*Kf,cT,d);\nstep(SYSrKf)` : placement(wanted)}\nS = stepinfo(SYSrKf)`,
          hint: C.r ? "Beispiel 16 gives rᵀ, so its poles are fixed: pick another exercise to move them." : "Move the poles left: the response gets faster, the input larger. A pair further from the real axis swings more.",
        };
      } },
      { name: "Back to the plant's states", draw: p => {
        const { C, S, r } = design(), rn = toRnf(S.A, S.b, S.c), ack = C.r ? null : ackermann(S.A, S.b, wanted);
        return {
          figure: h("div", { class: "fly" }, h("div", { class: "mtx-row" }, mtx("S", rn.S, { cells: Math.floor(p * 5) }),
            mtx("rᵀ = rᵀ_RNF·S", r, { row: true, cells: p >= 1 ? 9 : 0 }), ack ? mtx("acker(A,b,p)", ack, { row: true, cells: p >= 1 ? 9 : 0 }) : null)),
          notes: [["x_RNF = S·x", "S = Q_S,RNF · Q_S⁻¹", "", "since Q_S,RNF = S·Q_S; it exists because the plant is controllable"],
            ...(ack ? [["acker gives the same", same(ack, r) ? "yes" : "no", same(ack, r) ? "" : "danger"]] : [])],
          sheet: C.sheet.rRnf ? [{ source: C.sheet.source, sheet: "rᵀ in RNF coordinates only; no back-transformation on the sheet", lab: `rᵀ = ${fmtVec(r)} in the plant's states`, agree: undefined }] : [],
          code: `${model(S)}\n${C.r ? `rT = ${vec(C.r, false)};` : placementRnf(placeByRnf(S.A, S.b, S.c, wanted).a, placeByRnf(S.A, S.b, S.c, wanted).p)}\n% check: rT equals acker(A,b,p) in the plant's own states`,
          hint: "The sheets stop at rᵀ_RNF; that gain only fits the plant if its states are the RNF's. With u = −rᵀx on the real states, use rᵀ_RNF·S.",
        };
      } },
      { name: "Add the prefilter", draw: p => {
        const { C, S, r, Kf } = design(), T = 6;
        const no = stepRun(closedLoop(S.A, S.b, r), S.b, S.c, 0, T, 300), yes = stepRun(closedLoop(S.A, S.b, r), S.b.map(v => v * Kf), S.c, 0, T, 300);
        return {
          figure: grow({ p, label: "Step response without and with the prefilter Kf", xLabel: "t [s]", yLabel: "v",
            lines: [{ x: no.t, y: no.y, name: "Kf = 1", cls: "second" }, { x: yes.t, y: yes.y, name: `Kf = ${fmt(Kf, 3)}` }, { x: [0, T], y: [1, 1], cls: "faint", noTip: true }] }),
          notes: [["Kf = [cᵀ(−A + b rᵀ)⁻¹ b]⁻¹", fmt(Kf), "", "slides p. 16; the same in any coordinates, since it only depends on G(0)"],
            ["Steady v without Kf", fmt(finalValue(closedLoop(S.A, S.b, r), S.b, S.c, 0), 4)]],
          sheet: C.sheet.Kf !== undefined ? [{ source: C.sheet.source, sheet: `Gf = ${C.sheet.KfText}`, lab: fmt(Kf), agree: Math.abs(Kf - C.sheet.Kf) < 1e-6 * Math.abs(C.sheet.Kf) + 1e-9 }] : [],
          code: `${model(S)}\nrT = ${vec(r, false)};\nAr = A - b*rT;\nKf = inv(cT*inv(-A+b*rT)*b);\nSYSrKf = ss(Ar,b*Kf,cT,d);\nstep(ss(Ar,b,cT,d), SYSrKf)`,
          hint: "A negative Kf is no mistake: the closed loop's G(0) is negative, so the reference must enter with the other sign.",
        };
      } },
    ];
    const ui = stepper(root, steps, { controls: [sel, s1, s2] });
  },
};
