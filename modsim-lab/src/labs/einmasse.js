// VO example 1, the Ein-Massen-Schwinger (single-mass oscillator, pp. 7–9): the forces on the cut-free mass give the
// ODE, the ODE becomes the Simulink integrator chain, the state space fills in, and the mass bounces under the force.
import { h } from "../../../kit/ui/kit.js";
import * as a from "../../../kit/ui/art.js";
import { stepper, fmt, fmtC, mtx, grow } from "../../../kit/ui/steps.js";
import { smd, run, eig2, VALUES } from "../core/index.js";
import { massChain, blocks, blockCount } from "./pics.js";
import { reveal, memo, sliders, caption, at } from "./view.js";
import { lagrange, ode, stateSpace, simulink } from "./matlab.js";

const sim = memo((v, T) => run(smd(v), [0, 0], T, 2000));
const P = v => [["m", v.m, "kg"], ["k", v.k, "N/m"], ["c", v.c, "N*s/m"], ["F0", v.F0, "N"], ["Om", v.Om, "rad/s"]];
const ROW = { input: "F0·sin(Ωt)", signs: "+ − −", gain: "1/m", states: ["ẍ", "ẋ", "x"], ics: ["0", "0"],
  feedback: [{ from: 1, gain: "c" }, { from: 2, gain: "k" }] };

export default {
  id: "einmasse",
  art: () => a.picture("A block on the floor tied to a wall by a spring and a damper, a force pushing it to the right",
    a.line([[20, 30], [20, 130]], a.INK, 3) + a.path("M20 60 l12 0 l6 -8 l8 16 l8 -16 l8 16 l8 -16 l6 8 l12 0", a.INK, 2)
    + a.line([[20, 100], [60, 100]], a.INK, 2) + a.rect(60, 92, 20, 16, a.INK, 2) + a.line([[80, 100], [100, 100]], a.INK, 2)
    + a.rect(100, 45, 50, 70, a.ACC, 3) + a.arrow(152, 80, 190, 80, a.HOT, 3) + a.line([[10, 115], [190, 115]], a.DIM, 2)),
  mount(root) {
    const st = { ...VALUES.einmasse };
    const ui = { refresh: () => {} };
    const controls = sliders(st, [["m", "Mass m", 0.2, 5, 0.1, "kg"], ["k", "Spring stiffness k", 50, 2000, 10, "N/m"],
      ["c", "Damping constant c", 0, 40, 0.5, "N·s/m"], ["F0", "Force amplitude F₀ (VO p. 9: 10)", 0, 20, 1, "N"]], () => ui.refresh());
    const steps = [
      { name: "Forces on the mass → the ODE", draw: p => {
        const f = [{ on: 0, F: 70, label: "F₁(t)" }, { on: 0, F: -60, label: "k(x − x₀)", off: -18, cls: "react" },
          { on: 0, F: -60, label: "c(ẋ − ẋ₀)", off: 18, cls: "react" }, { on: 0, F: -90, label: "m ẍ (d'Alembert)", off: 0, cls: "inertia" }];
        return {
          figure: [massChain({ xs: [0.05], labels: ["m"], forces: f.slice(0, Math.ceil(p * 4)), label: "The mass cut free from spring and damper, the forces on it arriving one by one" }),
            reveal(["F₁(t) acts to the right", "k(x − x₀) and c(ẋ − ẋ₀) pull back", "m ẍ + c(ẋ − ẋ₀) + k(x − x₀) = F₁",
              "ẍ = F₁/m − (c/m)(ẋ − ẋ₀) − (k/m)(x − x₀)   (the form for Simulink)"], p)],
          notes: [["Degree of freedom", "x, to the right", "", "x₀, ẋ₀: where the spring and damper are relaxed; here 0"]],
          sheet: [{ source: "VO p. 7", sheet: "ẍ = F₁/m − (c/m)(ẋ − ẋ₀) − (k/m)(x − x₀)", lab: "the same", agree: true },
            { source: "VO p. 7", sheet: "\"neglecting the damping\", yet c stays in the equation", lab: "c kept, as the equation does", agree: false }],
          code: lagrange({ q: ["x"], names: ["m", "k", "c", "F_1"], T: "1/2*m*diff(x,t)^2", V: "1/2*k*x^2", D: "1/2*c*diff(x,t)^2", Q: ["F_1"] })
            + "\n% gives m*x'' + c*x' + k*x == F_1, the same ODE as the cut on VO p. 7",
          hint: "Newton's cut (d'Alembert) on the sheet; the MATLAB checks it by Lagrange's route: the same equation.",
        };
      } },
      { name: "The ODE as Simulink blocks", draw: p => ({
        figure: blocks([ROW], { show: Math.ceil(p * blockCount([ROW])), label: "Fcn, Sum, Gain 1/m, two Integrators, and the gains c and k fed back" }),
        notes: [["Why two integrators", "ẍ → ẋ → x", "", "the ODE is solved for its highest derivative; each Integrator takes one dot off"]],
        sheet: [{ source: "VO p. 9", sheet: "Gain b (\"Damping\"), Gain k (\"Stiffness\"), Fcn 10*sin(2*pi*u), x0 = 0 m", lab: "Gain c: the text's name for the damper", agree: false }],
        code: simulink({ params: P(st), rows: [{ ...ROW, input: "Clock -> Fcn F0*sin(Om*u)", gain: "1/m" }],
          simscape: "Simulink-PS Converter -> Ideal Force Source -> Mass, Translational Spring, Translational Damper to a Mechanical Translational Reference; Solver Configuration" }),
      }) },
      { name: "State space: A and B fill in", draw: p => {
        const s = smd(st), cells = Math.floor(p * 7);
        return {
          figure: [h("div", { class: "mtx-row" }, mtx("A", [["0", "1"], ["−k/m", "−c/m"]], { cells, hot: cells }), mtx("B", ["0", "1/m"], { cells: cells - 4, hot: cells - 4 })),
            h("div", { class: "mtx-row" }, mtx("A", s.A, { cells: p >= 1 ? 4 : cells }), mtx("B", s.B, { cells: p >= 1 ? 2 : cells - 4 }), mtx("C", [1, 0], { row: true, cells: p >= 1 ? 2 : 0 }))],
          notes: [["States", "x₁ = x, x₂ = ẋ"], ["Poles, eig(A)", eig2(s.A).map(fmtC).join(", "), "", "−c/(2m) ± j·ωD"]],
          sheet: [{ source: "VO p. 8", sheet: "A = [0 1; −k/m −c/m], B = [0; 1/m]", lab: "the same", agree: true },
            { source: "VO p. 8", sheet: "no C, D", lab: "C = [1 0], D = 0 to output x", agree: undefined }],
          code: stateSpace({ params: P(st).slice(0, 3), A: "[0 1; -k/m -c/m]", B: "[0; 1/m]", C: "[1 0]", then: ["eig(A)", "step(sys)   % x after a unit step of F1"] }),
        };
      } },
      { name: "The mass bounces", draw: p => {
        const s = smd(st), T = 5, r = sim(st, T), k = at(r, p);
        return {
          figure: [massChain({ xs: [r.x[k][0]], labels: ["m"], scale: 600, forces: [{ on: 0, F: 50 * s.F(r.t[k]) / Math.max(1, st.F0), label: "F₁" }], label: "The mass moved by the force, to scale ×600" }),
            grow({ p, label: "Displacement x over time", xLabel: "t [s]", yLabel: "x [mm]", lines: [{ x: r.t, y: r.x.map(x => 1000 * x[0]), name: "x" }] }),
            caption(`Example values (${VALUES.einmasse.source}).`)],
          notes: [["ω₀ = √(k/m)", `${fmt(s.w0)} rad/s`], ["f₀, T₀", `${fmt(s.f0)} Hz, ${fmt(s.T0)} s`],
            ["ωD = √(ω₀² − (c/2m)²)", `${fmt(s.wD)} rad/s`, "", "the free swing's frequency once damped"],
            ["Static deflection F₀/k", `${fmt(1000 * st.F0 / st.k)} mm`, "", "the response is larger when Ω is near ω₀"]],
          sheet: [{ source: "VO pp. 7–8", sheet: "ω₀ = √(k/m), f₀ = ω₀/2π, T₀ = 1/f₀, ωD = √(ω₀² − (c/2m)²)", lab: `ω₀ = ${fmt(s.w0)} rad/s from these values`, agree: true }],
          code: ode({ params: P(st), rows: ["x(2)", "(F0*sin(Om*t) - c*x(2) - k*x(1))/m"], x0: [0, 0], T, plot: "plot(t,1000*x(:,1)), xlabel('t [s]'), ylabel('x [mm]')" }),
          hint: "The lab integrates with Runge–Kutta at a fixed 2.5 ms step; ode45 picks its own steps. The curves agree to the eye.",
        };
      } },
    ];
    Object.assign(ui, stepper(root, steps, { controls }));
  },
};
