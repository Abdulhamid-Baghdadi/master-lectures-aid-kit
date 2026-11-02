// The cantilever, by hand and by beam elements (Krach 2020a, p. 40; Krach 2018, p. 20): the course's bending beam,
// 10 × 10 mm and 100 mm long under 100 N, gives σ = M/W = 60 MPa and u = F·l³/(3EIy). Beam elements with cubic shape
// functions match both exactly under an end force; under a line load the nodes stay exact but the bending moment
// inside each element is only approximate, and refining closes the gap.
import { cantilever, cantileverExact } from "../core/index.js";
import { h, slider, readout, choice } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

// Aluminium and steel moduli of Krach (2020c), p. 9; the course's example uses aluminium (Krach 2020a, p. 14).
const MATERIALS = { aluminium: ["Aluminium, 70 000 MPa", 70000], steel: ["Steel, 210 000 MPa", 210000] };

export default {
  id: "beam",
  art: () => a.picture("A cantilever clamped on the left, bent down by a force at its tip",
    a.line([[25, 35], [25, 105]], a.DIM, 3) + a.path("M25 70 Q110 72 170 100", a.INK, 4) + a.line([[25, 70], [170, 70]], a.DIM, 2, "5 5") +
      a.arrow(170, 60, 170, 98, a.ACC, 3) + a.text(100, 135, "F·l³ / 3EI", 15, a.ACC)),
  mount(root) {
    const p = { L: 100, b: 10, t: 10, E: 70000, F: 100, q: 0, n: 1 };
    let mat = "aluminium";
    const wChart = h("div", {}), mChart = h("div", {}), rT = readout("Tip deflection, FE and F·l³/(3EI)"), rS = readout("Stress at the clamp σ = M/W"), rM = readout("Moment at the clamp, FE and exact");
    const update = () => {
      const fe = cantilever(p), ex = cantileverExact(p), xs = Array.from({ length: 201 }, (_, k) => k * p.L / 200);
      wChart.replaceChildren(lineChart({ label: "Deflection along the beam, beam elements against the exact curve", xLabel: "Position x [mm]", yLabel: "Deflection w [mm]", xMin: 0, xMax: p.L, yMin: 0,
        lines: [{ x: xs, y: xs.map(ex.w), name: "exact" }, { x: xs, y: xs.map(x => fe.at(x).w), name: "elements", cls: "second" }],
        marks: fe.x.map((x, i) => ({ x, y: fe.w[i], shape: "o" })), yFormat: v => v.toFixed(3) }));
      mChart.replaceChildren(lineChart({ label: "Bending moment along the beam, beam elements against the exact curve", xLabel: "Position x [mm]", yLabel: "Moment M [N·mm]", xMin: 0, xMax: p.L, yMin: 0,
        lines: [{ x: xs, y: xs.map(ex.M), name: "exact" }, { x: xs, y: xs.map(x => fe.at(Math.min(x, p.L * (1 - 1e-9))).M), name: "elements", cls: "second" }] }));
      const M0 = fe.at(0).M;
      rT.set(`${fe.w.at(-1).toFixed(4)} mm, ${ex.tip.toFixed(4)} mm`, "", `I = b·t³/12 = ${fe.I.toFixed(0)} mm⁴, W = b·t²/6 = ${fe.W.toFixed(1)} mm³`);
      rS.set(`${(M0 / fe.W).toFixed(1)} MPa (FE), ${ex.rootStress.toFixed(1)} MPa (exact)`, "", "p. 40: 100 N · 100 mm over 10·10²/6 mm³ gives 60 MPa");
      rM.set(`${M0.toFixed(0)}, ${ex.M(0).toFixed(0)} N·mm`, Math.abs(M0 / ex.M(0) - 1) > 0.01 ? "warn" : "", `${(100 * (M0 / ex.M(0) - 1)).toFixed(2)} % in the first element`);
    };
    const sl = (name, key, min, max, step, unit, fmt) => slider({ label: name, unit, min, max, value: p[key], step, format: fmt ?? (v => `${v} ${unit}`), onInput: v => { p[key] = v; update(); } }).el;
    root.append(h("div", { class: "stage" }, h("div", {}, wChart, mChart), h("div", { class: "controls" },
      sl("Elements n", "n", 1, 20, 1, "", v => String(v)), sl("Tip force F", "F", 0, 500, 10, "N"), sl("Line load q", "q", 0, 10, 0.5, "N/mm"),
      sl("Length L", "L", 50, 400, 10, "mm"), sl("Width b", "b", 5, 40, 1, "mm"), sl("Height t", "t", 5, 40, 1, "mm"),
      choice("Material", Object.entries(MATERIALS).map(([k, [name]]) => [k, name]), mat, v => { mat = v; p.E = MATERIALS[v][1]; update(); }),
      rT.el, rS.el, rM.el,
      h("p", { class: "hint" }, "Start with the course's example: one element, 100 N at the tip, no line load. The element is exact: the true deflection is a cubic, the shape the element can take. Now add a line load and set the force to 0: the circles (nodes) stay on the curve, but the moment, worked from each element's curvature, is a straight line in each element where the true one is a parabola. The element's stiffness matrix and the line-load formulas are worked by hand; the course prints σ = M/W and F·l³/(3EIy)."))));
    update();
  },
};
