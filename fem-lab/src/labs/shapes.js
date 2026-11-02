// Shape functions (Krach 2021, pp. 55–56): each belongs to one node, is 1 there and 0 at the others, and in each
// element they sum to 1. Linear elements join the nodal values with straight lines, quadratic ones with parabolas
// through a mid-node; the chart shows the functions of one element and how a curve is approximated by several.
import { SHAPES, interpolate } from "../core/index.js";
import { h, slider, readout, choice } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

// Curves to approximate on 0 ≤ x ≤ 1: smooth, steep at one end, and a peak, as stresses near a notch are.
const CURVES = {
  bend: ["A parabola, x²", x => x * x],
  wave: ["A sine wave", x => Math.sin(2 * Math.PI * x)],
  peak: ["A sharp peak near x = 0.7", x => Math.exp(-(((x - 0.7) / 0.08) ** 2))],
};

export default {
  id: "shapes",
  art: () => a.picture("Two crossing straight shape functions and the three parabolas of a quadratic element",
    a.line([[20, 40], [100, 120]], a.INK, 3) + a.line([[20, 120], [100, 40]], a.INK, 3) +
      a.path("M110 40 Q135 130 180 120", a.ACC, 2.5) + a.path("M110 120 Q145 -5 180 120", a.COOL, 2.5) + a.path("M110 120 Q155 130 180 40", a.ACC, 2.5)),
  mount(root) {
    let kind = "linear", m = 2, curve = "wave";
    const one = h("div", {}), many = h("div", {}), rSum = readout("Sum of the shape functions"), rErr = readout("Largest error of the approximation");
    const update = () => {
      const S = SHAPES[kind], zs = Array.from({ length: 101 }, (_, k) => k / 100);
      one.replaceChildren(lineChart({ label: `The ${kind} shape functions of one element`, xLabel: "Position in the element ξ", yLabel: "Shape function N", xMin: 0, xMax: 1, yMin: -0.2, yMax: 1.1,
        xFormat: v => v.toFixed(1),
        lines: [...S.nodes.map((_, i) => ({ x: zs, y: zs.map(z => S.N(z)[i]), name: `N${i + 1}`, cls: ["", "second", "third"][i] })),
          { x: zs, y: zs.map(z => S.N(z).reduce((s, v) => s + v, 0)), cls: "faint" }],
        marks: S.nodes.map(z => ({ x: z, y: 1, shape: "o" })) }));
      const y = CURVES[curve][1], f = interpolate(y, kind, m), xs = Array.from({ length: 401 }, (_, k) => k / 400);
      const nodes = Array.from({ length: m * (S.nodes.length - 1) + 1 }, (_, k) => k / (m * (S.nodes.length - 1)));
      many.replaceChildren(lineChart({ label: `${CURVES[curve][0]} approximated by ${m} ${kind} elements`, xLabel: "Position x", yLabel: "y", xMin: 0, xMax: 1, xFormat: v => v.toFixed(1),
        lines: [{ x: xs, y: xs.map(y), name: "y(x)" }, { x: xs, y: xs.map(f), name: "approximation", cls: "second" }],
        marks: nodes.map(x => ({ x, y: y(x), shape: "o" })) }));
      const sum = Math.max(...zs.map(z => Math.abs(S.N(z).reduce((s, v) => s + v, 0) - 1)));
      rSum.set(sum < 1e-12 ? "1 everywhere" : `off by ${sum.toExponential(1)}`, "", "the dotted line in the first chart");
      rErr.set(Math.max(...xs.map(x => Math.abs(f(x) - y(x)))).toFixed(4), "", `with ${nodes.length} nodes in all`);
    };
    root.append(h("div", { class: "stage" }, h("div", {}, one, many), h("div", { class: "controls" },
      choice("Element", [["linear", "Linear: two nodes"], ["quadratic", "Quadratic: three nodes"]], kind, v => { kind = v; update(); }),
      choice("Curve", Object.entries(CURVES).map(([k, [name]]) => [k, name]), curve, v => { curve = v; update(); }),
      slider({ label: "Elements", min: 1, max: 16, value: m, step: 1, format: v => String(v), onInput: v => { m = v; update(); } }).el,
      rSum.el, rErr.el,
      h("p", { class: "hint" }, "Raising the polynomial order is p-refinement, adding elements h-refinement (Krach 2020a, p. 52). Compare one quadratic element with two linear ones: the same three nodes, a smaller error on the smooth curves. The sharp peak needs nodes where it is, whatever the order: a fine mesh only where it is needed (Krach 2020a, p. 55). The quadratic functions are written out here by hand from the properties of p. 55."))));
    update();
  },
};
