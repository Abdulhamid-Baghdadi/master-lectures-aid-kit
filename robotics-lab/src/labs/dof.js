// Grübler's count (Ajanović 2020, ch. 1, pp. 37–39): DOF = T(n − 1 − g) + Σ fᵢ, the freedoms of n − 1 free links less
// what each joint takes away. The slides' examples: the 2R and 3R arms and the four-bar; the IRB 120 in space.
import { dof } from "../core/index.js";
import { h, slider, readout, choice } from "../../../kit/ui/kit.js";
import * as a from "../../../kit/ui/art.js";
import { view, link, ground, joint, label } from "./draw.js";

// n counts the base; every joint here turns, so each gives f = 1. Pictures in plane units, spatial ones from the side.
const EXAMPLES = {
  arm2: { name: "2R arm (ch. 1, p. 39)", T: 3, n: 3, g: 2, f: 2, pts: [[0, 0], [40, 50], [100, 90]], base: [[0, 0]] },
  arm3: { name: "3R arm (ch. 1, p. 38)", T: 3, n: 4, g: 3, f: 3, pts: [[0, 0], [40, 50], [100, 60], [140, 30]], base: [[0, 0]] },
  fourbar: { name: "Four-bar (ch. 1, p. 38)", T: 3, n: 4, g: 4, f: 4, pts: [[0, 0], [20, 60], [120, 70], [110, 0]], base: [[0, 0], [110, 0]] },
  irb: { name: "IRB 120, six turning axes in space", T: 6, n: 7, g: 6, f: 6, pts: [[0, 0], [0, 29], [0, 56], [30, 63], [37, 63]], base: [[0, 0]] },
};

export default {
  id: "dof",
  art: () => a.picture("A three-link arm on a fixed base with its count DOF = 3",
    a.line([[40, 120], [70, 70], [130, 60], [165, 85]], a.INK, 3) + a.circle(40, 120, 6, a.ACC) + a.circle(70, 70, 5) + a.circle(130, 60, 5) +
      a.line([[22, 132], [58, 132]], a.DIM, 2) + a.text(110, 30, "DOF = 3", 18, a.ACC)),
  mount(root) {
    let key = "arm3", { T, n, g, f } = EXAMPLES[key];
    const box = h("div", {}), rD = readout("Degrees of freedom"), rM = readout("What it means");
    const int = (text, min, max, value, set) => slider({ label: text, min, max, value, step: 1, format: v => String(v), onInput: v => { set(v); update(); } });
    const sN = int("Links n, the base included", 2, 10, n, v => { n = v; });
    const sG = int("Joints g", 0, 12, g, v => { g = v; });
    const sF = int("Freedoms of the joints Σf", 0, 24, f, v => { f = v; });
    const update = () => {
      const e = EXAMPLES[key], D = dof(T, n, g, f), own = e.T === T && e.n === n && e.g === g && e.f === f;
      const xs = e.pts.map(p => p[0]), ys = e.pts.map(p => p[1]);
      box.replaceChildren(view([Math.min(...xs) - 25, Math.min(...ys) - 25, Math.max(...xs) + 25, Math.max(...ys) + 25],
        `${e.name}: ${e.n} links with the base, ${e.g} joints`, [
          link(e.pts), e.pts.slice(1).map(p => joint(p)), e.base.map(p => ground(p)),
          label([Math.min(...xs) - 20, Math.max(...ys) + 18], own ? `T = ${T}, n = ${n}, g = ${g}, Σf = ${f}` : "your own count (picture: the example)", 0, 0)]));
      rD.set(`DOF = ${D}`, D < 0 ? "warn" : "", `${T}(${n} − 1 − ${g}) + ${f} = ${T * (n - 1 - g)} + ${f}`);
      rM.set(D > 0 ? `${D} drive${D > 1 ? "s" : ""} set its pose` : D === 0 ? "A rigid structure" : "Overconstrained",
        D < 0 ? "warn" : "", D > 0 ? "one drive per freedom; a free body in space has 6, in the plane 3" : "no motion left");
    };
    // The radio buttons cannot be set from outside, so the type choice is drawn again when an example sets T.
    const tBox = h("div", {});
    const drawT = () => tBox.replaceChildren(choice("Type of mechanism T", [["3", "Plane or spherical (T = 3)"], ["6", "Spatial (T = 6)"]], String(T), v => { T = Number(v); update(); }));
    const pick = v => { key = v; ({ T, n, g, f } = EXAMPLES[v]); sN.set(n); sG.set(g); sF.set(f); drawT(); update(); };
    drawT();
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      choice("Example", Object.entries(EXAMPLES).map(([k, e]) => [k, e.name]), key, pick),
      tBox,
      sN.el, sG.el, sF.el, rD.el, rM.el,
      h("p", { class: "hint" }, "Count the base as a link. A turning or sliding joint has f = 1, a cylindrical or universal joint 2, a ball joint 3 (ch. 1, p. 25). The formula is the freedoms of the free bodies, T(n − 1), less the constraints of each joint, T − fᵢ."))));
    update();
  },
};
