// VO example 8, the electromechanical Shaker (pp. 43–45): the coil circuit and the sprung plate, their transfer
// functions in series, the 3 × 3 state space, and the current with and without the back-EMF the sheet leaves out.
import { h } from "../../../kit/ui/kit.js";
import * as a from "../../../kit/ui/art.js";
import { stepper, fmt, fmtC, mtx, grow } from "../../../kit/ui/steps.js";
import { shaker, run, VALUES } from "../core/index.js";
import { massChain, bars } from "./pics.js";
import { reveal, memo, sliders, caption, at } from "./view.js";
import { ode, stateSpace, assign } from "./matlab.js";

const T = 1.5;
const sims = memo(v => ({ off: run(shaker(v), [0, 0, 0], T, 3000), on: run(shaker({ ...v, backEmf: true }), [0, 0, 0], T, 3000) }));
const P = v => [["R_S", v.RS, "Ohm"], ["L_S", v.LS, "H"], ["h_S", v.hS, "N/A"], ["m_S", v.mS, "kg"], ["k_S", v.kS, "N/m"], ["d_S", v.dS, "N*s/m"], ["U_S", v.US, "V, a step"]];

export default {
  id: "shaker",
  art: () => a.picture("A shaker: a coil in a magnet pushes a plate held by a spring and a damper",
    a.rect(60, 100, 80, 30, a.INK, 3) + a.rect(85, 70, 30, 30, a.ACC, 3) + a.line([[60, 60], [140, 60]], a.INK, 4)
    + a.path("M70 60 l0 -8 l-6 -4 l12 -8 l-12 -8 l6 -4 l0 -8", a.INK, 2) + a.arrow(160, 90, 160, 50, a.HOT, 3)),
  mount(root) {
    const st = { ...VALUES.shaker };
    const ui = { refresh: () => {} };
    const controls = sliders(st, [["US", "Voltage step U_S", 0.5, 12, 0.5, "V"], ["hS", "Shaker constant h_S", 0.5, 20, 0.5, "N/A"],
      ["LS", "Coil inductance L_S", 0.01, 2, 0.01, "H"], ["dS", "Damper d_S", 0.5, 40, 0.5, "N·s/m"]], () => ui.refresh());
    const steps = [
      { name: "Coil and plate: two equations", draw: p => ({
        figure: [massChain({ xs: [0.004 * Math.sin(2 * Math.PI * p)], labels: ["m_S"], scale: 3000, vertical: true, forces: p > 0.4 ? [{ on: 0, F: 50, label: "F_S = h_S i_S" }] : [], label: "The plate m_S on its spring k_S and damper d_S, pushed by the coil's force" }),
          reveal(["U_S = R_S i_S + L_S di_S/dt   (back-EMF left out)", "F_S = h_S i_S   (h_S: the shaker constant, from l·B_S)", "m_S ẍ + d_S ẋ + k_S x = h_S i_S"], p)],
        sheet: [{ source: "VO p. 43", sheet: "U_S = R_S i_S + L_S di_S/dt, m_S ẍ + d_S ẋ + k_S x = F_S = h_S i_S", lab: "the same; step 4 adds the back-EMF −h_S ẋ", agree: true }],
        code: ["syms i_S(t) x(t) R_S L_S h_S m_S d_S k_S U_S", "eq1 = L_S*diff(i_S,t) == U_S - R_S*i_S", "eq2 = m_S*diff(x,t,2) + d_S*diff(x,t) + k_S*x == h_S*i_S", "[Vf,S] = odeToVectorField(eq1,eq2)"].join("\n"),
      }) },
      { name: "Transfer functions in series", draw: p => ({
        figure: reveal(["U_S → [1/(R_S + sL_S)] → i_S → [h_S/(m_S s² + d_S s + k_S)] → x",
          "G_Ux(s) = x/U_S = 1/(R_S + sL_S) · h_S/(m_S s² + d_S s + k_S)", "G_Ua(s) = a/U_S = s² G_Ux(s)",
          "third order, not sprungfähig: no direct path from U_S to x"], p),
        sheet: [{ source: "VO p. 44", sheet: "\"G_Ux(s) = x/U_S = s²/(R_S + sL_S) · h_S/(…)\"", lab: "with s² it is G_Ua = a/U_S (p. 43 defines it so)", agree: false }],
        code: [assign(P(st)), "s = tf('s');", "G_Ux = 1/(R_S + s*L_S) * h_S/(m_S*s^2 + d_S*s + k_S)", "G_Ua = s^2*G_Ux;", "bode(G_Ux)", "step(U_S*G_Ux)   % x after the voltage step"].join("\n"),
      }) },
      { name: "State space, with and without back-EMF", draw: p => {
        const off = shaker(st), on = shaker({ ...st, backEmf: true }), cells = Math.floor(p * 13);
        return {
          figure: [h("div", { class: "mtx-row" }, mtx("A (sheet)", off.A, { cells, hot: cells }), mtx("B", off.B, { cells: cells - 9 })),
            h("div", { class: "mtx-row" }, mtx("A (with back-EMF)", on.A, { cells: p >= 1 ? 9 : 0, hot: p >= 1 ? 2 : -1 }))],
          notes: [["States", "(i_S, x, v)"], ["The one change", `a₁₃ = −h_S/L_S = ${fmt(on.A[0][2])}`, "", "the moving coil induces h_S·v against U_S"]],
          sheet: [{ source: "VO p. 44", sheet: "A = [−R_S/L_S 0 0; 0 0 1; h_S/m_S −k_S/m_S −d_S/m_S], B = [1/L_S; 0; 0]", lab: "the same", agree: true }],
          code: stateSpace({ params: P(st).slice(0, 6), A: "[-R_S/L_S 0 -h_S/L_S; 0 0 1; h_S/m_S -k_S/m_S -d_S/m_S]", B: "[1/L_S; 0; 0]", C: "[1 0 0; 0 1 0]", D: "[0; 0]",
            then: ["eig(A)", "step(sys)   % current and displacement, coupled"] }).replace("A = [-R_S/L_S 0 -h_S/L_S;", "% the sheet's A has 0 where -h_S/L_S stands: the back-EMF\nA = [-R_S/L_S 0 -h_S/L_S;"),
        };
      } },
      { name: "The current: coupled and uncoupled", draw: p => {
        const r = sims(st), s = shaker(st), k = at(r.on, p), pw = shaker({ ...st, backEmf: true }).powers(r.on.x[k]);
        return {
          figure: [massChain({ xs: [r.on.x[k][1]], labels: ["m_S"], scale: 3000 * 0.004 / Math.max(1e-6, s.xInf), vertical: true, ghost: [r.off.x[k][1]], label: "The plate with the back-EMF; without it, faint" }),
            grow({ p, label: "Coil current i_S without and with the back-EMF", xLabel: "t [s]", yLabel: "i_S [A]", lines: [{ x: r.off.t, y: r.off.x.map(x => x[0]), name: "sheet (uncoupled)" }, { x: r.on.t, y: r.on.x.map(x => x[0]), name: "with back-EMF", cls: "second" }] }),
            bars([{ name: "source U_S·i_S", value: pw.source }, { name: "coil R_S·i_S²", value: pw.resistor, cls: "loss" }, { name: "into motion h_S·i_S·v", value: pw.force, cls: "store" }, { name: "damper d_S·v²", value: pw.damper, cls: "loss" }], { label: "Power now, coupled", unit: "W" }),
            caption("Example values; the sheet gives none.")],
          notes: [["At rest", `i_S = U_S/R_S = ${fmt(s.iInf)} A, x = h_S U_S/(R_S k_S) = ${fmt(1000 * s.xInf)} mm`, "", "the same with and without coupling: the plate stands still"]],
          sheet: [{ source: "VO p. 45, plot read by eye", sheet: "coupled Simscape model: current with a shoulder, reaching the end value later (≈ 12–14 s against ≈ 6 s)", lab: "with back-EMF the current dips while the plate moves, then meets the uncoupled one", agree: true }],
          code: ode({ params: P(st), rows: ["(U_S - R_S*x(1) - h_S*x(3))/L_S", "x(3)", "(h_S*x(1) - k_S*x(2) - d_S*x(3))/m_S"], x0: [0, 0, 0], T, plot: "plot(t,x(:,1))   % drop h_S*x(3) in row 1 for the sheet's model" }),
        };
      } },
    ];
    Object.assign(ui, stepper(root, steps, { controls }));
  },
};
