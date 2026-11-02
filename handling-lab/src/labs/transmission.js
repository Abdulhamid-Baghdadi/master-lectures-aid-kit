// The transmission angle μ (Berger 2021, ch. 4, pp. 38–39, Blatt 43–44): the acute angle between coupler and rocker at
// B; small μ means the coupler pushes along the rocker and little of its force turns it. The smallest μ falls where
// crank and frame are folded or stretched.
import { fourBar, minTransmission, deg, rad } from "../core/index.js";
import { h, readout } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";
import { lengthSliders, drawing } from "./fourbar.js";
import { link } from "./draw.js";

export default {
  id: "transmission",
  art: () => a.picture("Coupler and rocker meeting at a joint, the angle between them marked",
    a.line([[30, 120], [100, 50]], a.INK, 3) + a.line([[100, 50], [170, 120]], a.INK, 3) + a.path("M82 68 A25 25 0 0 0 118 68", a.ACC, 3) + a.text(100, 100, "μ", 22, a.ACC) + a.circle(100, 50, 6, a.INK)),
  mount(root) {
    const dims = { a: 100, r: 30, l: 90, c: 70, phi: rad(60) };
    const box = h("div", {}), chart = h("div", {}), rN = readout("μ now"), rM = readout("Smallest μ over a turn");
    const update = () => {
      // A light line through B along the coupler shows the direction the force comes from.
      const { s, svg } = drawing(dims, [s => link([s.A, [2 * s.B[0] - s.A[0], 2 * s.B[1] - s.A[1]]], "faint")]);
      box.replaceChildren(svg);
      const xs = [], ys = [];
      for (let i = 0; i <= 360; i += 2) { const t = fourBar(dims, rad(i)); xs.push(i); ys.push(t ? deg(t.mu) : NaN); }
      const m = minTransmission(dims);
      chart.replaceChildren(lineChart({ label: "Transmission angle over a turn of the crank", lines: [{ x: xs, y: ys, name: "μ(φ)" }],
        marks: [...(s ? [{ x: deg(dims.phi), y: deg(s.mu), shape: "dot" }] : []), ...(Number.isFinite(m.mu) ? [{ x: deg(m.phi), y: deg(m.mu), shape: "o", name: "μmin" }] : [])],
        xLabel: "Crank angle φ [°]", yLabel: "μ [°]", xMin: 0, xMax: 360, yMin: 0, yMax: 90 }));
      rN.set(s ? `${deg(s.mu).toFixed(1)}°` : "—", "", s ? `at φ = ${deg(dims.phi).toFixed(0)}°` : "the chain cannot close here");
      rM.set(Number.isFinite(m.mu) ? `${deg(m.mu).toFixed(1)}° at φ = ${deg(m.phi).toFixed(0)}°` : "—", "",
        Math.abs(Math.sin(m.phi)) < 0.02 ? "crank and frame in line, as the course says (ch. 4, p. 38)" : "the chain does not turn fully: μ reaches 0 at its limits");
    };
    root.append(h("div", { class: "stage" }, h("div", {}, box, chart), h("div", { class: "controls" },
      ...lengthSliders(dims, update).map(s => s.el), rN.el, rM.el,
      h("p", { class: "hint" }, "The course defines μ and leaves its value to the drawing; here it comes from the cosine rule in triangle A B B0, worked from that definition. It is always the acute angle, μ ≤ 90°. Drag the crank to φ = 0° and 180°: one of these gives μmin. Kap. 4 Aufgaben 4 and 5 of the Übungsskript ask for the most favourable μmin of a crank-rocker built for given dead-centre angles; the next lab builds those."))));
    update();
  },
};
