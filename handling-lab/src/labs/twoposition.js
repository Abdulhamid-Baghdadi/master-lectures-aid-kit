// Two-position synthesis (Berger 2021, ch. 4, p. 68, 4.2.2): a body moved from position 1 to position 2 can get there
// by one turn about the pole P12, where the perpendicular bisectors of A1A2 and B1B2 meet. A crank pivoted at P12, or any
// two pivots on the bisectors, guides it.
import { pole, deg, rad } from "../core/index.js";
import { h, slider, readout } from "../../../kit/ui/kit.js";
import * as a from "../../../kit/ui/art.js";
import { view, link, joint, label, dot, fit, ring } from "./draw.js";

export default {
  id: "twoposition",
  art: () => a.picture("A bar in two positions with the bisectors of its end points crossing at the pole",
    a.line([[40, 110], [90, 110]], a.INK, 3) + a.line([[150, 100], [150, 50]], a.INK, 3, "6 5") + a.line([[95, 140], [95, 20]], a.DIM, 2) + a.line([[60, 140], [180, 20]], a.DIM, 2) + a.circle(95, 105, 6, a.ACC)),
  mount(root) {
    // The Übungsskript's Kap. 4 Aufgabe 1: A1(30; 0), B1(60; 0) to A2(−30; 0), B2(−30; 30).
    let A1 = [30, 0], B1 = [60, 0], turn = 90, dx = -60, dy = 0;
    const box = h("div", {}), rP = readout("Pole P12"), rT = readout("Turn φ12 about it");
    const update = () => {
      const t = rad(turn), rot = p => [A1[0] + dx + Math.cos(t) * (p[0] - A1[0]) - Math.sin(t) * (p[1] - A1[1]), A1[1] + dy + Math.sin(t) * (p[0] - A1[0]) + Math.cos(t) * (p[1] - A1[1])];
      const A2 = rot(A1), B2 = rot(B1), p = pole(A1, A2, B1, B2);
      const bis = (P, Q) => { const m = [(P[0] + Q[0]) / 2, (P[1] + Q[1]) / 2], d = [Q[0] - P[0], Q[1] - P[1]], n = Math.hypot(...d) || 1; return [[m[0] - 200 * d[1] / n, m[1] + 200 * d[0] / n], [m[0] + 200 * d[1] / n, m[1] - 200 * d[0] / n]]; };
      const pts = [A1, B1, A2, B2, ...(p ? [p.P] : [])];
      box.replaceChildren(view(fit(pts, 0.25), p ? `Positions 1 and 2 of the bar AB and the pole P12 at (${p.P[0].toFixed(1)}, ${p.P[1].toFixed(1)})` : "A pure shift: the pole lies at infinity", [
        link(bis(A1, A2), "faint"), link(bis(B1, B2), "faint"), p ? ring(p.P, Math.hypot(A1[0] - p.P[0], A1[1] - p.P[1]), "grid") : null,
        link([A1, B1]), link([A2, B2], "second"), joint(A1), joint(B1), joint(A2), joint(B2),
        label(A1, "A1"), label(B1, "B1"), label(A2, "A2"), label(B2, "B2"), p ? dot(p.P) : null, p ? label(p.P, "P12", 10, 18) : null]));
      rP.set(p ? `(${p.P[0].toFixed(1)}; ${p.P[1].toFixed(1)}) mm` : "at infinity", p ? "" : "warn", p ? "where the bisectors a12 and b12 meet" : "the bisectors are parallel: guide it by a slider or a parallel crank");
      rT.set(p ? `${deg(p.angle).toFixed(1)}°` : "0°", "", "counter-clockwise positive; the bisectors halve it");
    };
    const sl = (name, unit, min, max, v, set) => slider({ label: name, unit, min, max, value: v, step: 1, format: x => `${x} ${unit}`, onInput: x => { set(x); update(); } }).el;
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      sl("Turn of the bar", "°", -180, 180, turn, v => turn = v), sl("Shift of A in x", "mm", -120, 120, dx, v => dx = v), sl("Shift of A in y", "mm", -120, 120, dy, v => dy = v),
      rP.el, rT.el,
      h("p", { class: "hint" }, "Start: the data of Kap. 4 Aufgabe 1 in the Übungsskript; by hand, the bisector of A1A2 is x = 0 and that of B1B2 meets it at (0; −30), a quarter turn. A crank pivoted at P12 carries the bar in one move. For a four-bar, pick A0 anywhere on a12 and B0 anywhere on b12: each choice is a solution, so choose for good transmission angles and, as the Zweilagensynthese solutions do, a shortest frame for a double crank. With turn 0 the bar only shifts and the pole runs off to infinity."))));
    update();
  },
};
