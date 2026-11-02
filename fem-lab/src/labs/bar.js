// The bar under load and h-refinement (Krach 2020a, pp. 52–54; Krach 2018, p. 30): a bar held at one end, with an
// end force and a line load, in n linear elements. The displacements at the nodes come out exact; the stress, one
// value per element, is a staircase that only approaches the true straight line as the elements shrink, and the
// cost grows with the square of the degrees of freedom.
import { bar, barExact } from "../core/index.js";
import { h, slider, readout } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";
import { view, link, joint, wall, force } from "./draw.js";

export default {
  id: "bar",
  art: () => a.picture("A staircase of element stresses approaching a sloping line",
    a.line([[25, 125], [175, 30]], a.DIM, 2) + a.line([[25, 115], [62, 115], [62, 92], [100, 92], [100, 68], [137, 68], [137, 45], [175, 45]], a.ACC, 3) +
      a.line([[25, 135], [175, 135]], a.INK, 3)),
  mount(root) {
    const p = { L: 1000, A: 100, E: 210000, F: 1000, q: 2, n: 4 };
    const pic = h("div", {}), chart = h("div", {}), rU = readout("Tip displacement, FE and exact"), rS = readout("Stress at the support, FE and exact"), rC = readout("Degrees of freedom and relative cost");
    const update = () => {
      const fe = bar(p), ex = barExact(p), xs = Array.from({ length: 101 }, (_, k) => k * p.L / 100);
      pic.replaceChildren(view([-80, -70, p.L + 160, 60], `A bar of ${p.L} mm in ${p.n} elements, held on the left, an end force of ${p.F} N on the right`, [
        wall([0, 0], [-1, 0]), link([[0, 0], [p.L, 0]]), fe.x.map(x => joint([x, 0])),
        p.F ? force([p.L, 0], [Math.sign(p.F), 0], "F") : null,
        p.q ? fe.x.slice(1).map(x => force([x - fe.h / 2, -40], [1, 0])) : null]));
      // The element stresses as a staircase: each element's constant value across its length.
      const stair = fe.sigma.flatMap((v, e) => [[fe.x[e], v], [fe.x[e + 1], v]]);
      chart.replaceChildren(lineChart({ label: "Stress along the bar: the elements' constant values against the exact line", xLabel: "Position x [mm]", yLabel: "Stress σ [MPa]", xMin: 0, xMax: p.L, yMin: 0,
        lines: [{ x: xs, y: xs.map(ex.sigma), name: "exact" }, { x: stair.map(v => v[0]), y: stair.map(v => v[1]), name: "elements", cls: "second" }] }));
      const tip = fe.u.at(-1), s0 = fe.sigma[0], e0 = ex.sigma(0);
      rU.set(`${(tip * 1000).toFixed(2)} µm, ${(ex.u(p.L) * 1000).toFixed(2)} µm`, "", "linear elements with consistent loads hit the nodes exactly");
      rS.set(`${s0.toFixed(2)} MPa, ${e0.toFixed(2)} MPa`, Math.abs(s0 / e0 - 1) > 0.05 ? "warn" : "", `${(100 * (s0 / e0 - 1)).toFixed(1)} %: the first element reports its mean, not the peak`);
      rC.set(`${fe.dofs} DOF, ×${((fe.dofs / 4) ** 2).toFixed(1)} against 4`, "", "doubling the degrees of freedom quadruples the time (p. 54)");
    };
    const sl = (name, key, min, max, step, unit, fmt) => slider({ label: name, unit, min, max, value: p[key], step, format: fmt ?? (v => `${v} ${unit}`), onInput: v => { p[key] = v; update(); } }).el;
    root.append(h("div", { class: "stage" }, h("div", {}, pic, chart), h("div", { class: "controls" },
      sl("Elements n", "n", 1, 40, 1, "", v => String(v)), sl("End force F", "F", 0, 5000, 100, "N"), sl("Line load q", "q", 0, 10, 0.5, "N/mm"),
      sl("Section A", "A", 20, 500, 10, "mm²"), sl("Modulus E", "E", 70000, 210000, 70000, "MPa"),
      rU.el, rS.el, rC.el,
      h("p", { class: "hint" }, "With only the end force the stress is the same everywhere and one element is exact. The line load makes the stress vary, and each element can hold only its mean: h-refinement, more and smaller elements, closes the gap (p. 52). The modulus steps between aluminium, 70 000 MPa, and steel, 210 000 MPa (Krach 2020c, p. 9); it changes the displacement, never the stress of this statically determinate bar. Halving the element length in a solid makes 8 times the elements and 64 times the time (p. 54); along a bar it doubles them."))));
    update();
  },
};
