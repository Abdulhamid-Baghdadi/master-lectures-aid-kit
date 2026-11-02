// Discretisation (Krach 2020a, pp. 48–49): the circle's perimeter approximated by a polygon of n chords, one element
// each, its length the sum of the elements. More elements, smaller error, and the result is always below the true
// value: a check against an analytic estimate is part of the work.
import { polygon } from "../core/index.js";
import { h, slider, readout, s } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

const ring = (cx, cy, r, n) => Array.from({ length: n + 1 }, (_, k) => [cx + r * Math.cos(2 * Math.PI * k / n - Math.PI / 2), cy + r * Math.sin(2 * Math.PI * k / n - Math.PI / 2)]);

export default {
  id: "polygon",
  art: () => a.picture("A circle with a hexagon inside it, its corners the nodes",
    a.circle(100, 75, 55, a.DIM, 2) + a.line(ring(100, 75, 55, 6), a.INK, 3) + ring(100, 75, 55, 6).slice(0, 6).map(([x, y]) => a.circle(x, y, 4, a.ACC, 2, a.ACC)).join("")),
  mount(root) {
    let n = 6, d = 100;
    const pic = h("div", {}), chart = h("div", {}), rP = readout("Perimeter of the polygon Σ Lij"), rE = readout("Error against π·d"), rA = readout("Area error");
    const update = () => {
      const p = polygon(n, d), pts = ring(160, 160, 130, n);
      pic.replaceChildren(s("svg", { viewBox: "0 0 320 320", role: "img", class: "chart mech", "aria-label": `A circle of diameter ${d} mm and a polygon of ${n} elements inside it` },
        s("circle", { cx: 160, cy: 160, r: 130, class: "link faint", fill: "none" }),
        s("polyline", { points: pts.map(q => q.map(c => c.toFixed(1)).join(",")).join(" "), class: "link", fill: "none" }),
        ...pts.slice(0, n).map(([x, y]) => s("circle", { cx: x, cy: y, r: n > 40 ? 2.5 : 5, class: "joint" }))));
      const ns = Array.from({ length: 47 }, (_, k) => k + 3);
      chart.replaceChildren(lineChart({ label: "The perimeter's error against the number of elements", xLabel: "Elements n", yLabel: "Error [%]", xMin: 3, xMax: 49, yMin: 0,
        lines: [{ x: ns, y: ns.map(k => -100 * polygon(k, d).perimeterError), name: "perimeter" }, { x: ns, y: ns.map(k => -100 * polygon(k, d).areaError), name: "area", cls: "second" }],
        marks: [{ x: n, y: -100 * p.perimeterError, shape: "dot" }], yMax: 20 }));
      rP.set(`${p.perimeter.toFixed(2)} mm`, "", `${n} chords of ${p.chord.toFixed(2)} mm; the circle has ${(Math.PI * d).toFixed(2)} mm`);
      rE.set(`${(100 * p.perimeterError).toFixed(3)} %`, "", "always too short: every chord is shorter than its arc");
      rA.set(`${(100 * p.areaError).toFixed(3)} %`, "", "the polygon's area (p. 48): about four times the perimeter's error, falling at the same rate");
    };
    root.append(h("div", { class: "stage" }, h("div", {}, pic, chart), h("div", { class: "controls" },
      slider({ label: "Elements n", min: 3, max: 64, value: n, step: 1, format: v => String(v), onInput: v => { n = v; update(); } }).el,
      slider({ label: "Diameter d", unit: "mm", min: 10, max: 200, value: d, step: 1, format: v => `${v} mm`, onInput: v => { d = v; update(); } }).el,
      rP.el, rE.el, rA.el,
      h("p", { class: "hint" }, "Each chord is one element between nodes i and j; the perimeter is the sum of the element lengths (p. 49). The error is relative, so the diameter does not change it. Doubling the elements quarters the error: the same rate a mesh of linear elements shows, and the reason a converged result needs a second, finer mesh to prove it. The chord length d·sin(π/n) is worked here by hand."))));
    update();
  },
};
