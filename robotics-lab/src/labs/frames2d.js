// A point in two frames (Ajanović 2020, ch. 2, pp. 20–35): frame G turned by θ and moved by p against frame R. The
// homogeneous transform ᴿT_G = [R(θ) p; 0 1] carries G's coordinates into R's; its inverse [Rᵀ −Rᵀp; 0 1] carries them back.
import { toParent2, hom, rot2, rad } from "../core/index.js";
import { h, readout } from "../../../kit/ui/kit.js";
import * as a from "../../../kit/ui/art.js";
import { view, link, dot, label, arrow, angleSlider, lengthSlider, matrix } from "./draw.js";

export default {
  id: "frames2d",
  art: () => a.picture("Two coordinate frames, one turned and moved against the other, and a point seen from both",
    a.arrow(30, 125, 90, 125, a.DIM, 2) + a.arrow(30, 125, 30, 65, a.DIM, 2) + a.arrow(90, 95, 135, 70, a.INK, 3) + a.arrow(90, 95, 115, 50, a.INK, 3) +
      a.line([[30, 125], [90, 95]], a.DIM, 2, "4 4") + a.circle(150, 40, 6, a.ACC, 3, a.ACC)),
  mount(root) {
    // The exercise of ch. 2, p. 34: G turned 40° and moved (2, 3); the point (5, 2) in G.
    const st = { t: rad(40), p: [2, 3], g: [5, 2] };
    const box = h("div", {}), mat = h("div", {}), rR = readout("The point in R"), rG = readout("The point in G");
    const update = () => {
      const r = toParent2(st.t, st.p, st.g), c = Math.cos(st.t), s = Math.sin(st.t);
      const ex = [st.p[0] + 2 * c, st.p[1] + 2 * s], ey = [st.p[0] - 2 * s, st.p[1] + 2 * c];
      box.replaceChildren(view([-2, -2, 11, 11], `Frame G turned ${(st.t * 180 / Math.PI).toFixed(0)}° and moved to (${st.p.join(", ")}); the point at (${r[0].toFixed(2)}, ${r[1].toFixed(2)}) in R`, [
        arrow([0, 0], [10, 0], "faint"), arrow([0, 0], [0, 10], "faint"), label([10, 0], "xR", -10, 16), label([0, 10], "yR", 6, 4),
        link([[0, 0], st.p], "faint"), arrow(st.p, ex, "axis-x"), arrow(st.p, ey, "axis-y"), label(ex, "xG", 4, 14), label(ey, "yG", 4, -4),
        link([st.p, r], "second"), dot(r), label(r, `(${r[0].toFixed(2)}, ${r[1].toFixed(2)})`)]));
      mat.replaceChildren(h("p", { class: "hint" }, "The homogeneous transform from G to R:"), matrix(hom(rot2(st.t), st.p), 3, "The homogeneous transform from G to R"));
      rR.set(`(${r[0].toFixed(2)}; ${r[1].toFixed(2)})`, "", "ᴿp = R(θ)·ᴳp + p");
      rG.set(`(${st.g[0].toFixed(2)}; ${st.g[1].toFixed(2)})`, "", "back again: ᴳp = R(θ)ᵀ(ᴿp − p)");
    };
    root.append(h("div", { class: "stage" }, h("div", {}, box, mat), h("div", { class: "controls" },
      angleSlider("Turn of G θ", 40, -180, 180, v => { st.t = v; update(); }).el,
      lengthSlider("Origin of G, x", "", 2, -1, 6, 0.1, v => { st.p[0] = v; update(); }).el,
      lengthSlider("Origin of G, y", "", 3, -1, 6, 0.1, v => { st.p[1] = v; update(); }).el,
      lengthSlider("Point in G, x", "", 5, -4, 6, 0.1, v => { st.g[0] = v; update(); }).el,
      lengthSlider("Point in G, y", "", 2, -4, 6, 0.1, v => { st.g[1] = v; update(); }).el,
      rR.el, rG.el,
      h("p", { class: "hint" }, "The columns of the rotation are G's axes written in R (ch. 2, p. 33). Turning first and then moving is what the 3 × 3 matrix does in one product; chains of frames multiply such matrices (p. 36)."))));
    update();
  },
};
