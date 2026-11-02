// Coupler curves and the Roberts–Chebyshev theorem (Berger 2021, ch. 4, pp. 113–116): a point fixed to the coupler
// draws a curve, and two more four-bars, the cognates, draw exactly the same curve with the same point.
import { fourBar, cognates, grashof, rad, deg } from "../core/index.js";
import { h, slider, readout, choice } from "../../../kit/ui/kit.js";
import * as a from "../../../kit/ui/art.js";
import { lengthSliders } from "./fourbar.js";
import { view, link, ground, joint, trace, dot, shape, fit, label } from "./draw.js";

export default {
  id: "coupler",
  art: () => a.picture("A four-bar with a triangle on its coupler tracing a looped curve",
    a.path("M40 60 C70 20 150 20 160 55 C170 90 110 70 90 80 C60 95 30 85 40 60", a.ACC, 2) + a.line([[40, 130], [60, 95], [130, 100], [160, 130]], a.INK, 3) + a.line([[60, 95], [100, 62], [130, 100]], a.INK, 2) + a.circle(100, 62, 5, a.ACC)),
  mount(root) {
    const dims = { a: 100, r: 30, l: 90, c: 70, phi: rad(60), k: [0.4, 0.6] };
    let show = "both";
    const box = h("div", {}), rC = readout("Coupler point C"), rK = readout("The three linkages");
    const update = () => {
      const s = fourBar(dims, dims.phi), curve = [], runs = [curve];
      for (let i = 0; i <= 360; i++) { const t = fourBar(dims, rad(i)); if (t) runs.at(-1).push(t.C); else if (runs.at(-1).length) runs.push([]); }
      const parts = [runs.filter(r => r.length > 1).map(r => trace(r))];
      if (s) {
        const c = cognates(s, dims.k);
        if (show !== "none") parts.push(link(c.first, "second"), shape([c.first[1], c.first[2], c.C], "faint"), link(c.second, "faint"), ground(c.F0), label(c.F0, "F0", 8, 20));
        parts.push(link([s.A0, s.A, s.B, s.B0]), shape([s.A, s.B, s.C]), joint(s.A), joint(s.B), ground(s.A0), ground(s.B0), dot(s.C), label(s.C, "C"));
        if (show !== "none") parts.push(...[...c.first, ...c.second].map(p => joint(p)));
      }
      const all = [[0, 0], [dims.a, 0], ...curve, ...(s ? Object.values(cognates(s, dims.k)).flat(1).filter(p => Array.isArray(p) && typeof p[0] === "number") : [])];
      box.replaceChildren(view(fit(all, 0.08), s ? `The coupler curve of C, with ${show === "none" ? "the linkage" : "the linkage and its two cognates"}` : "The chain cannot close at this crank angle", parts));
      rC.set(`k = ${dims.k[0].toFixed(2)} + ${dims.k[1].toFixed(2)}i`, "", "C − A = k·(B − A): the coupler triangle's shape");
      const kinds = s ? [cognates(s, dims.k).first, cognates(s, dims.k).second].map(q => grashof([0, 1, 2, 3].map(j => Math.hypot(q[(j + 1) % 4][0] - q[j][0], q[(j + 1) % 4][1] - q[j][1]))).mechanism) : [];
      rK.set(`${grashof([dims.a, dims.r, dims.l, dims.c]).mechanism}`, "", s ? `the cognates are ${kinds.join(" and ")}; one crank-rocker comes with a second crank-rocker and a double rocker (ch. 4, p. 114)` : "");
    };
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      choice("Show", [["both", "Linkage and cognates"], ["none", "Linkage only"]], show, v => { show = v; update(); }),
      ...lengthSliders(dims, update).map(s => s.el),
      slider({ label: "C along AB", min: -1, max: 2, value: dims.k[0], step: 0.01, format: v => v.toFixed(2), onInput: v => { dims.k[0] = v; update(); } }).el,
      slider({ label: "C off AB", min: -1.5, max: 1.5, value: dims.k[1], step: 0.01, format: v => v.toFixed(2), onInput: v => { dims.k[1] = v; update(); } }).el,
      rC.el, rK.el,
      h("p", { class: "hint" }, "Every coupler curve of a four-bar A0ABB0 can be drawn by two more four-bars A0A′F′F0 and B0B′FF0 (ch. 4, p. 113): their third pivot F0 makes the triangle A0B0F0 similar to the coupler triangle ABC. Turn the crank: all three move C along the same curve. That is the freedom the course uses for straight-line guidance (pp. 128–138): if a linkage draws the curve you want but is badly placed, one of its cognates may fit."))));
    update();
  },
};
