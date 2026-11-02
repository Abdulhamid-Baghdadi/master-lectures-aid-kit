// Instant centres (Berger 2021, ch. 4, pp. 47 and 55, Blatt 52): n links have n(n − 1)/2 poles; three links' poles lie on
// one line (Kennedy). The pole of crank and rocker, where line AB meets the frame line, gives the speed ratio ω3/ω1.
import { fourBar, velocityRatio, poleCount, deg, rad } from "../core/index.js";
import { h, readout } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";
import { lengthSliders, drawing } from "./fourbar.js";
import { link, dot, label } from "./draw.js";

export default {
  id: "poles",
  art: () => a.picture("A four-bar with its crank and coupler lines extended to meet the frame line in a pole",
    a.line([[20, 120], [180, 120]], a.DIM, 2) + a.line([[50, 120], [70, 80], [130, 70], [150, 120]], a.INK, 3) + a.line([[130, 70], [20, 90]], a.DIM, 2, "5 4") + a.circle(20, 120, 6, a.ACC)),
  mount(root) {
    const dims = { a: 100, r: 30, l: 90, c: 70, phi: rad(60) };
    const box = h("div", {}), chart = h("div", {}), rZ = readout("Poles of a four-bar"), rP = readout("Pole of crank and rocker P13"), rW = readout("Speed ratio ω3/ω1");
    const update = () => {
      const st = fourBar(dims, dims.phi), v = st ? velocityRatio(st) : null;
      const extra = v && v.P && Math.hypot(...v.P) < 800 ? [s => link([s.A, v.P], "faint"), s => link([[0, 0], v.P], "faint"), () => dot(v.P), () => label(v.P, "P13", 8, 18)] : [];
      box.replaceChildren(drawing(dims, extra).svg);
      const xs = [], ys = [];
      for (let i = 0; i <= 360; i += 2) { const t = fourBar(dims, rad(i)); xs.push(i); ys.push(t ? velocityRatio(t).ratio : NaN); }
      chart.replaceChildren(lineChart({ label: "The rocker's angular speed over the crank's, over a turn", lines: [{ x: xs, y: ys, name: "ω3/ω1" }],
        marks: v ? [{ x: deg(dims.phi), y: v.ratio, shape: "dot" }] : [], xLabel: "Crank angle φ [°]", yLabel: "ω3/ω1 [1]", xMin: 0, xMax: 360,
        yMin: Math.max(-3, Math.min(...ys.filter(Number.isFinite))), yMax: Math.min(3, Math.max(...ys.filter(Number.isFinite))) }));
      rZ.set(`${poleCount(4)}`, "", "n(n − 1)/2 with n = 4: two at the frame pivots, two at the moving joints, P13 here and the coupler's pole P02 where A0A and B0B meet (0 frame, 1 crank, 2 coupler, 3 rocker)");
      rP.set(v && v.P ? `(${v.P[0].toFixed(1)}; ${v.P[1].toFixed(1)}) mm` : "at infinity", "", "on the frame line A0B0 and on the coupler line AB");
      rW.set(v ? v.ratio.toFixed(3) : "—", v && Math.abs(v.ratio) < 0.02 ? "warn" : "", v ? (Math.abs(v.ratio) < 0.02 ? "a dead centre: the rocker stands still for a moment" : "A0P13/B0P13, signed: negative means the rocker turns against the crank") : "the chain cannot close here");
    };
    root.append(h("div", { class: "stage" }, h("div", {}, box, chart), h("div", { class: "controls" },
      ...lengthSliders(dims, update).map(s => s.el), rZ.el, rP.el, rW.el,
      h("p", { class: "hint" }, "P13 moves with the crank as if it were a point of both crank and rocker, so ω1·A0P13 = ω3·B0P13. The course finds speeds by drawing with rotated velocities and the Kutzbach plan; this lab computes the pole and checks the ratio against the numerical derivative of the rocker angle (tests/unit/core.test.js). Where the ratio crosses zero the rocker turns back: a dead centre, as in the previous lab."))));
    update();
  },
};
