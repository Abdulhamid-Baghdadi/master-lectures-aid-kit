// The correspondence search (Kubinger 2020, Modul 3, pp. 87–90): along one rectified row, a small window of the left
// image is compared with the right image shifted by each disparity, by SAD or SSD; the smallest cost wins. On a plain
// wall every shift costs the same and no disparity can be chosen.
import { match, sad, ssd } from "../core/index.js";
import { h, slider, readout, choice } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

const N = 48;
// Fixed rows, no randomness, so every visit shows the same scene: a textured surface, a plain wall and a repeating
// pattern, surfaces of the kind MC Teil 2, Fragen 19 and 20, asks about (white wall, checked shirt).
const SCENES = {
  texture: x => 90 + 60 * Math.sin(0.9 * x) * Math.cos(0.23 * x) + 25 * Math.sin(2.7 * x + 1),
  wall: () => 120,
  stripes: x => (Math.floor(x / 3) % 2 ? 200 : 60),
};

export default {
  id: "correspondence",
  art: () => a.picture("A small window on the left row slid along the right row until the patterns match",
    a.path("M15 45 L35 30 L50 60 L70 35 L90 50", a.INK, 3) + a.rect(30, 22, 30, 45, a.ACC, 2) +
      a.path("M110 105 L130 90 L145 120 L165 95 L185 110", a.INK, 3) + a.rect(125, 82, 30, 45, a.ACC, 2) + a.arrow(60, 75, 120, 95, a.COOL, 2)),
  mount(root) {
    let scene = "texture", shift = 6, x = 26, w = 3, cost = "sad";
    const box = h("div", {}), boxC = h("div", {}), rB = readout("Best disparity"), rC = readout("Its cost");
    const update = () => {
      const left = Array.from({ length: N }, (_, i) => SCENES[scene](i));
      // The right camera sees each point shift places to the left: R(x − d) = L(x).
      const right = Array.from({ length: N }, (_, i) => SCENES[scene](i + shift));
      const m = match(left, right, x, w, 16, cost === "ssd" ? ssd : sad), xs = left.map((_, i) => i);
      box.replaceChildren(lineChart({ label: "The left and right rows, the window marked", xLabel: "Column u [px]", yLabel: "Grey value", xMin: 0, xMax: N - 1, yMin: 0, yMax: 255,
        lines: [{ x: xs, y: left, name: "left" }, { x: xs, y: right, name: "right", cls: "second" }],
        marks: [{ x: x - w, y: left[x - w], shape: "o" }, { x: x + w, y: left[x + w], shape: "o" }, { x: x - m.best, y: right[x - m.best], shape: "x" }] }));
      const ds = m.costs.map((_, d) => d);
      boxC.replaceChildren(lineChart({ label: "Cost over the disparity tried", xLabel: "Disparity d [px]", yLabel: `${cost.toUpperCase()} cost`, xMin: 0, xMax: 16, yMin: 0,
        lines: [{ x: ds, y: m.costs, stem: true }], marks: [{ x: m.best, y: m.costs[m.best], shape: "dot" }] }));
      rB.set(m.unique ? `${m.best} px` : "No unique match", m.unique ? (m.best === shift ? "" : "warn") : "danger", m.unique ? (m.best === shift ? "the true shift" : `the true shift is ${shift} px`) : "several disparities cost the same");
      rC.set(m.costs[m.best].toFixed(0), "", cost === "sad" ? "Σ|I1 − I2| over the window" : "Σ(I1 − I2)² over the window");
    };
    const sl = (label, min, max, v, set) => slider({ label, unit: "px", min, max, value: v, step: 1, format: q => `${q} px`, onInput: q => { set(q); update(); } });
    root.append(h("div", { class: "stage" }, h("div", {}, box, boxC), h("div", { class: "controls" },
      choice("Surface", [["texture", "textured"], ["wall", "plain wall"], ["stripes", "repeating stripes"]], scene, v => { scene = v; update(); }),
      choice("Cost", [["sad", "SAD"], ["ssd", "SSD"]], cost, v => { cost = v; update(); }),
      sl("True disparity", 0, 14, shift, q => shift = q), sl("Window centre u", 18, 30, x, q => x = q), sl("Window half-width", 1, 6, w, q => w = q),
      rB.el, rC.el,
      h("p", { class: "hint" }, "Because the images are rectified, corresponding points share a row and the search runs along it alone, which is what makes it fast (p. 89). Without texture there is nothing to match; with a repeating pattern several shifts fit. Try both, then widen the window."),
      h("p", { class: "hint" }, "Real systems add a census transform, a left–right check and sub-pixel interpolation of the cost minimum (pp. 90–91)."))));
    update();
  },
};
