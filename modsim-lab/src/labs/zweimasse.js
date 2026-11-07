// VO example 5, the Zwei-Massen-Schwinger (pp. 27–31), with the values of the TM3 note "Bestimmung der Eigenfrequenzen
// des 2DoF Systems": the cut gives M, C, K; two Simulink rows; det(K − λM) = 0 and the trace give the eigenfrequencies,
// and the two modes move; the masses driven by the Fcn forces, beside the frequency response.
import { h } from "../../../kit/ui/kit.js";
import * as a from "../../../kit/ui/art.js";
import { stepper, fmt, mtx, grow } from "../../../kit/ui/steps.js";
import { twoMass, receptance, run, VALUES } from "../core/index.js";
import { massChain, blocks, blockCount } from "./pics.js";
import { reveal, memo, sliders, caption, at } from "./view.js";
import { ode, simulink, eigKM, assign } from "./matlab.js";
import * as Py from "./python.js";

const forced = memo(v => run(twoMass(v), [0, 0, 0, 0], 4, 4000));
const P = v => [["m1", v.m1, "kg"], ["m2", v.m2, "kg"], ["k1", v.k1, "N/m"], ["k2", v.k2, "N/m"], ["c1", v.c1, "N*s/m"], ["c2", v.c2, "N*s/m"]];
const ROWS = [
  { input: "F₁(t)", signs: "+ − − + +", gain: "1/m₁", states: ["ẍ₁", "ẋ₁", "x₁"], ics: ["0", "0"], feedback: [{ from: 1, gain: "c₁, c₂(ẋ₂ − ẋ₁)" }, { from: 2, gain: "k₁, k₂(x₂ − x₁)" }] },
  { input: "F₂(t)", signs: "+ − −", gain: "1/m₂", states: ["ẍ₂", "ẋ₂", "x₂"], ics: ["0", "0"], feedback: [{ from: 1, gain: "c₂(ẋ₂ − ẋ₁)" }, { from: 2, gain: "k₂(x₂ − x₁)" }] }];

export default {
  id: "zweimasse",
  art: () => a.picture("Two blocks in a row, each tied to the one before by a spring and a damper, from a wall",
    a.line([[14, 40], [14, 130]], a.INK, 3) + a.path("M14 80 l8 0 l5 -8 l7 16 l7 -16 l7 16 l5 -8 l6 0", a.INK, 2) + a.rect(60, 60, 40, 40, a.ACC, 3)
    + a.path("M100 80 l8 0 l5 -8 l7 16 l7 -16 l7 16 l5 -8 l6 0", a.INK, 2) + a.rect(146, 60, 40, 40, a.COOL, 3) + a.line([[10, 100], [190, 100]], a.DIM, 2)),
  mount(root) {
    const st = { ...VALUES.zweimasse };
    const ui = { refresh: () => {} };
    const controls = sliders(st, [["m1", "Mass m₁", 0.2, 5, 0.1, "kg"], ["m2", "Mass m₂", 0.2, 5, 0.1, "kg"],
      ["k1", "Spring k₁", 100, 5000, 50, "N/m"], ["k2", "Spring k₂", 100, 5000, 50, "N/m"], ["c1", "Damper c₁", 0, 20, 0.1, "N·s/m"], ["c2", "Damper c₂", 0, 20, 0.1, "N·s/m"]], () => ui.refresh());
    const steps = [
      { name: "Cut free → M, C, K", draw: p => {
        const t = twoMass(st), n = Math.floor(p * 12);
        const f = [{ on: 0, F: 50, label: "F₁" }, { on: 1, F: 50, label: "F₂" }, { on: 0, F: -50, label: "k₁x₁, c₁ẋ₁", off: -20, cls: "react" },
          { on: 1, F: -50, label: "k₂(x₂−x₁), c₂(ẋ₂−ẋ₁)", off: 20, cls: "react" }];
        return {
          figure: [massChain({ xs: [0, 0], labels: ["m₁", "m₂"], forces: f.slice(0, Math.ceil(p * 4)), label: "Both masses cut free, the spring and damper forces on each arriving" }),
            reveal(["m₁ẍ₁ + c₁ẋ₁ + k₁x₁ − c₂(ẋ₂ − ẋ₁) − k₂(x₂ − x₁) = F₁", "m₂ẍ₂ + c₂(ẋ₂ − ẋ₁) + k₂(x₂ − x₁) = F₂", "M ẍ + C ẋ + K x = F"], p),
            h("div", { class: "mtx-row" }, mtx("M", t.M, { cells: n }), mtx("C", t.Cd, { cells: n - 4 }), mtx("K", t.K, { cells: n - 8 }))],
          sheet: [{ source: "VO p. 28", sheet: "M = [m₁ 0; 0 m₂], C = [c₁+c₂ −c₂; −c₂ c₂], K = [k₁+k₂ −k₂; −k₂ k₂]", lab: "the same", agree: true }],
          code: [assign(P(st)), "M = [m1 0; 0 m2];", "C = [c1+c2 -c2; -c2 c2];", "K = [k1+k2 -k2; -k2 k2];   % TM3 note p. 1"].join("\n"),
          python: ["import numpy as np", "", Py.assign(P(st)), "M = np.array([[m1, 0], [0, m2]])", "C = np.array([[c1+c2, -c2], [-c2, c2]])", "K = np.array([[k1+k2, -k2], [-k2, k2]])   # TM3 note p. 1"].join("\n"),
          pyCheck: [["M", t.M], ["C", t.Cd], ["K", t.K]],
        };
      } },
      { name: "Two Simulink rows", draw: p => ({
        figure: blocks(ROWS, { show: Math.ceil(p * blockCount(ROWS)), label: "One Simulink row per mass; the spring and damper between them feed both rows" }),
        sheet: [{ source: "VO p. 31", sheet: "Fcn 10*sin(2*pi*u) on mass 1, 5*sin(2*pi*u) on mass 2; Gains b and k; x0 = 0 m", lab: "the same forces; c for b, the text's name", agree: true }],
        code: simulink({ params: [...P(st), ["F1", st.F1, "N"], ["F2", st.F2, "N"]],
          rows: [{ ...ROWS[0], input: "Clock -> Fcn F1*sin(2*pi*u)", feedback: [{ from: 1, gain: "c1 (and c2 on v2-v1)" }, { from: 2, gain: "k1 (and k2 on x2-x1)" }] },
            { ...ROWS[1], input: "Clock -> Fcn F2*sin(2*pi*u)", feedback: [{ from: 1, gain: "c2 on v2-v1" }, { from: 2, gain: "k2 on x2-x1" }] }],
          simscape: "wall -> Translational Spring 1 || Translational Damper 1 -> Mass 1 -> Spring 2 || Damper 2 -> Mass 2; an Ideal Force Source on each mass; Solver Configuration (VO p. 31)" }),
        python: Py.simulink({ params: [...P(st), ["F1", st.F1, "N"], ["F2", st.F2, "N"]], rows: ROWS, simscape: "Translational Springs, Dampers, Masses and Ideal Force Sources (VO p. 31)" }),
      }) },
      { name: "det(K − λM) = 0: the eigenmodes", draw: p => {
        const t = twoMass(st), j = p < 0.5 ? 0 : 1, md = t.modes[j], ph = Math.sin(2 * Math.PI * 3 * ((p % 0.5) * 2));
        const amp = 0.05 / Math.max(...md.v.map(Math.abs));
        return {
          figure: [massChain({ xs: md.v.map(v => amp * v * ph), labels: ["m₁", "m₂"], scale: 600, label: `Eigenmode ${j + 1}: the masses move ${md.v[1] > 0 ? "together" : "against each other"}` }),
            h("div", { class: "mtx-row" }, mtx("M⁻¹K", t.trace.MinvK))],
          notes: [["tr(M⁻¹K), det(M⁻¹K)", `${fmt(t.trace.tr)}, ${fmt(t.trace.det)}`, "", "λ₁,₂ = tr/2 ∓ √((tr/2)² − det)"],
            ...t.modes.map((m, i) => [`λ${i + 1} = ω${i + 1}²`, `${fmt(m.lambda)} s⁻²: f = ${fmt(m.f)} Hz`, "", `shape x₂/x₁ = ${fmt(m.v[1])}`])],
          sheet: [{ source: "TM3 note p. 2", sheet: "EW = diag(500, 3000), f0_1 = 3.5588 Hz, f0_2 = 8.7173 Hz", lab: `${fmt(t.modes[0].lambda)}, ${fmt(t.modes[1].lambda)}: ${fmt(t.modes[0].f)} Hz, ${fmt(t.modes[1].f)} Hz${st.k1 === 2000 && st.k2 === 750 && st.m1 === 1 && st.m2 === 1 ? "" : " (with your values)"}`, agree: st.k1 === 2000 && st.k2 === 750 && st.m1 === 1 && st.m2 === 1 },
            { source: "VO p. 29", sheet: "Jacobi matrix [(k₁+k₂)/m₁ −k₂/m₁; −k₂/m₂ k₂/m₂]", lab: "that is M⁻¹K; ∂f/∂x is its negative (VO p. 30 has the right sign)", agree: false },
            { source: "VO p. 28", sheet: "stable if all Re(λ) < 0, with λ = ω²", lab: "λ = ω² > 0; Re < 0 is the test for eig(A) of the state space", agree: false }],
          code: eigKM({ params: P(st).slice(0, 4), K: "[k1+k2 -k2; -k2 k2]", M: "[m1 0; 0 m2]" }) + "\nlam = trace(M\\K)/2 + [-1; 1]*sqrt((trace(M\\K)/2)^2 - det(M\\K))   % the trace route",
          python: Py.eigKM({ params: P(st).slice(0, 4), K: "[k1+k2 -k2; -k2 k2]", M: "[m1 0; 0 m2]" }) + "\nMK = np.linalg.solve(M, K)   # MATLAB's M\\K\nlam_tr = np.trace(MK)/2 + np.array([-1, 1])*np.sqrt((np.trace(MK)/2)**2 - np.linalg.det(MK))   # the trace route",
          pyCheck: [["f0", t.modes.map(m => m.f)], ["lam_tr", t.modes.map(m => m.lambda)]],
        };
      } },
      { name: "Driven: the masses and the frequency response", draw: p => {
        const t = twoMass(st), r = forced(st), k = at(r, p);
        const fs = Array.from({ length: 400 }, (_, i) => 0.5 + i * 12 / 399), H = fs.map(f => receptance(t, 2 * Math.PI * f)[0]);
        return {
          figure: [massChain({ xs: [r.x[k][0], r.x[k][1]], labels: ["m₁", "m₂"], scale: 2000, label: "The masses under F₁ = 10 sin 2πt and F₂ = 5 sin 2πt, to scale ×2000" }),
            grow({ p, label: "Displacements x₁ and x₂", xLabel: "t [s]", yLabel: "x [mm]", lines: [{ x: r.t, y: r.x.map(x => 1000 * x[0]), name: "x₁" }, { x: r.t, y: r.x.map(x => 1000 * x[1]), name: "x₂", cls: "second" }] }),
            grow({ p: 1, label: "Frequency response |x₁/F₁|, as the TM3 note plots it", xLabel: "f [Hz]", yLabel: "|x₁/F₁| [mm/N]", lines: [{ x: fs, y: H.map(v => 1000 * v), name: "|x₁/F₁|", noTip: true }] }),
            caption(`Values: ${VALUES.zweimasse.source}.`)],
          notes: [["Peaks of |x₁/F₁|", t.modes.map(m => `${fmt(m.f)} Hz`).join(", "), "", "near the eigenfrequencies; damping shifts them a little"]],
          sheet: [{ source: "TM3 note p. 2", sheet: "peaks read at 3.56628 and 8.7279 Hz", lab: `${fmt(t.modes[0].f)} and ${fmt(t.modes[1].f)} Hz undamped`, agree: true },
            { source: "TM3 note p. 1", sheet: "f0 = om(:)/6.28", lab: "2π = 6.2832: the axis is 0.05 % off", agree: false }],
          code: [ode({ params: [...P(st), ["F1", st.F1], ["F2", st.F2]], rows: ["x(3)", "x(4)", "(F1*sin(2*pi*t) - c1*x(3) - k1*x(1) + c2*(x(4)-x(3)) + k2*(x(2)-x(1)))/m1", "(F2*sin(2*pi*t) - c2*(x(4)-x(3)) - k2*(x(2)-x(1)))/m2"], x0: [0, 0, 0, 0], T: 4, plot: "plot(t,x(:,1:2))" }),
            "A = [0 0 1 0; 0 0 0 1; -(k1+k2)/m1 k2/m1 -(c1+c2)/m1 c2/m1; k2/m2 -k2/m2 c2/m2 -c2/m2];   % VO p. 30",
            "sys1 = ss(A,[0; 0; 1/m1; 0],[1 0 0 0],0);",
            "[mag,phase,om] = bode(sys1,logspace(-1,2,2000));", "plot(om/(2*pi), squeeze(mag))   % mag is a ratio, 1x1xN"].join("\n"),
          python: [Py.ode({ params: [...P(st), ["F1", st.F1], ["F2", st.F2]], rows: ["x(3)", "x(4)", "(F1*sin(2*pi*t) - c1*x(3) - k1*x(1) + c2*(x(4)-x(3)) + k2*(x(2)-x(1)))/m1", "(F2*sin(2*pi*t) - c2*(x(4)-x(3)) - k2*(x(2)-x(1)))/m2"], x0: [0, 0, 0, 0], T: 4, plot: "plt.plot(sol.t, sol.y[0], sol.t, sol.y[1])" }),
            "import control as ct", "A = np.array([[0, 0, 1, 0], [0, 0, 0, 1], [-(k1+k2)/m1, k2/m1, -(c1+c2)/m1, c2/m1], [k2/m2, -k2/m2, c2/m2, -c2/m2]])   # VO p. 30",
            "sys1 = ct.ss(A, [[0], [0], [1/m1], [0]], [[1, 0, 0, 0]], 0)", "resp = ct.frequency_response(sys1, np.logspace(-1, 2, 2000))   # MATLAB's [mag,phase,om] = bode(...)",
            "plt.plot(resp.omega/(2*np.pi), resp.magnitude)   # a ratio, as MATLAB's mag; plt.show() above already drew the first figure"].join("\n"),
          pyCheck: Py.odeCheck(r),
        };
      } },
    ];
    Object.assign(ui, stepper(root, steps, { controls }));
  },
};
