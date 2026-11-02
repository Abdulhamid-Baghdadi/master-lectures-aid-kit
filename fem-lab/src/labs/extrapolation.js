// Integration points, extrapolation and averaging (Krach 2021, pp. 58–67): an element computes its stress at its
// Gauss points, the program extrapolates it to the nodes, and the plot averages the nodal values of neighbouring
// elements. Steep gradients make the extrapolated peak overshoot, which is why a stress above the yield point in an
// elastic-plastic run need not be a wrong calculation (p. 67).
import { stressRecovery, extrapolate } from "../core/index.js";
import { h, slider, readout, choice } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

// Stress fields along a line of elements, in MPa over 0 ≤ x ≤ 100 mm: a constant gradient, a notch peak at the end,
// and an elastic–ideally plastic field capped at a yield point of 200 MPa.
const FIELDS = {
  gradient: ["Even gradient", x => 100 + x],
  notch: ["Notch at the right end", x => 80 + 220 * Math.exp(-(100 - x) / 12)],
  plastic: ["Capped at yield, 200 MPa", x => Math.min(200, 60 + 3 * x)],
};

export default {
  id: "extrapolation",
  art: () => a.picture("A square element with four integration points as crosses and a value extrapolated to its corner node",
    a.rect(35, 40, 90, 80, a.INK, 3) + [[61, 63], [99, 63], [61, 97], [99, 97]].map(([x, y]) => a.line([[x - 5, y - 5], [x + 5, y + 5]], a.ACC, 2.5) + a.line([[x - 5, y + 5], [x + 5, y - 5]], a.ACC, 2.5)).join("") +
      a.line([[61, 97], [99, 63], [125, 40]], a.COOL, 2, "5 4") + a.circle(125, 40, 6, a.COOL, 3) + a.text(160, 30, "node", 14, a.COOL)),
  mount(root) {
    let field = "notch", m = 4, s1 = 100, s2 = 150;
    const chart = h("div", {}), rPeak = readout("Value at the last node, averaged, and the true one"), rJump = readout("Largest jump between neighbours"), rOne = readout("One element: extrapolated nodal values");
    const update = () => {
      const f = FIELDS[field][1], r = stressRecovery(f, 100, m), xs = Array.from({ length: 201 }, (_, k) => k / 2);
      chart.replaceChildren(lineChart({ label: `${FIELDS[field][0]}: Gauss-point values, each element's extrapolation, and the averaged nodal values`, xLabel: "Position x [mm]", yLabel: "Stress σ [MPa]", xMin: 0, xMax: 100,
        lines: [{ x: xs, y: xs.map(f), name: "true field" },
          ...r.elements.map((e, k) => ({ x: [e.a, e.b], y: e.nodal, cls: "second", name: k === 0 ? "per element" : undefined })),
          { x: r.x, y: r.averaged, cls: "third", name: "averaged" }],
        marks: r.elements.flatMap(e => e.gauss.map((x, i) => ({ x, y: e.values[i], shape: "x" }))) }));
      const last = r.averaged.at(-1), truth = f(100);
      rPeak.set(`${last.toFixed(1)} MPa, ${truth.toFixed(1)} MPa`, Math.abs(last / truth - 1) > 0.05 ? "warn" : "", `${(100 * (last / truth - 1)).toFixed(1)} %${field === "plastic" && last > 200 ? ": above the yield point, from extrapolation alone" : ""}`);
      const jumps = r.elements.slice(1).map((e, k) => Math.abs(e.nodal[0] - r.elements[k].nodal[1]));
      rJump.set(jumps.length ? `${Math.max(...jumps).toFixed(1)} MPa` : "—", "", "unaveraged plots show these steps; a large one asks for a finer mesh");
      const [n1, n2] = extrapolate(s1, s2);
      rOne.set(`${n1.toFixed(1)} and ${n2.toFixed(1)} MPa`, "", `from ${s1} and ${s2} MPa at ξ = ∓1/√3: the sketch of p. 62 reads about 80 and 170`);
    };
    const sl = (name, min, max, step, v, set, unit = "") => slider({ label: name, unit, min, max, value: v, step, format: x => unit ? `${x} ${unit}` : String(x), onInput: x => { set(x); update(); } }).el;
    root.append(h("div", { class: "stage" }, chart, h("div", { class: "controls" },
      choice("Stress field", Object.entries(FIELDS).map(([k, [name]]) => [k, name]), field, v => { field = v; update(); }),
      sl("Elements", 1, 20, 1, m, v => m = v),
      rPeak.el, rJump.el,
      h("h3", {}, "One element, two integration points"),
      sl("Value at the first point", 0, 300, 5, s1, v => s1 = v, "MPa"), sl("Value at the second point", 0, 300, 5, s2, v => s2 = v, "MPa"),
      rOne.el,
      h("p", { class: "hint" }, "Each element here is linear with two Gauss points, at ξ = ±1/√3 of its natural coordinate (worked by hand; the course names the Gauss point, p. 60). Its nodal values lie on the straight line through them. The capped field shows p. 67: the stresses at the integration points never pass 200 MPa, yet the extrapolated node does. Shell elements with one integration point give one constant stress per element (p. 58)."))));
    update();
  },
};
