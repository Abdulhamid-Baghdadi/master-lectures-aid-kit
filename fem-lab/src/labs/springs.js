// The spring as the simplest finite element (Krach 2020a, pp. 29–30): two nodes, three springs, the force–displacement
// relations written as [K]{u} = {f}, the basic equation of the method. The student sets the stiffnesses and forces
// and watches the matrix, the displacements and the spring forces.
import { twoSprings } from "../core/index.js";
import { h, slider, readout } from "../../../kit/ui/kit.js";
import * as a from "../../../kit/ui/art.js";
import { view, spring, joint, wall, force, label } from "./draw.js";

const zig = (x1, x2, y) => {
  const pts = [[x1, y]];
  for (let k = 1; k < 8; k++) pts.push([x1 + (x2 - x1) * k / 8, y + (k % 2 ? -7 : 7)]);
  return a.line([...pts, [x2, y]], a.INK, 2.5);
};

export default {
  id: "springs",
  art: () => a.picture("Two nodes between two walls joined by three springs, a force on each node",
    a.line([[18, 50], [18, 100]], a.DIM, 3) + a.line([[182, 50], [182, 100]], a.DIM, 3) + zig(18, 62, 75) + zig(70, 130, 75) + zig(138, 182, 75) +
      a.circle(66, 75, 6, a.ACC, 3) + a.circle(134, 75, 6, a.ACC, 3) + a.arrow(66, 110, 96, 110, a.COOL, 2) + a.arrow(134, 110, 164, 110, a.COOL, 2) +
      a.text(100, 40, "[K]{u} = {f}", 15, a.ACC)),
  mount(root) {
    const p = { k1: 1000, k12: 1000, k2: 1000, f1: 100, f2: 0 };
    const box = h("div", {}), rK = readout("Stiffness matrix [K]"), rU = readout("Displacements u1, u2"), rS = readout("Spring forces (tension +)");
    const update = () => {
      const r = twoSprings(p), [u1, u2] = r.u, sc = 40 / Math.max(1e-9, ...r.u.map(Math.abs));
      // The nodes drawn displaced, scaled so the larger displacement shows as 40 mm: the scale is the picture's.
      const n1 = [100 + sc * u1, 0], n2 = [200 + sc * u2, 0];
      box.replaceChildren(view([-20, -60, 320, 60], `Two nodes held by springs of ${p.k1}, ${p.k12} and ${p.k2} N/mm, moved ${(u1 * 1000).toFixed(1)} and ${(u2 * 1000).toFixed(1)} µm`, [
        wall([0, 0], [-1, 0]), wall([300, 0], [1, 0]),
        spring([0, 0], n1), spring(n1, n2), spring(n2, [300, 0]),
        joint(n1), joint(n2),
        p.f1 ? force([n1[0], -25], [Math.sign(p.f1), 0], `f1 = ${p.f1} N`) : null,
        p.f2 ? force([n2[0], -45], [Math.sign(p.f2), 0], `f2 = ${p.f2} N`) : null,
        label([40, 12], "k1", 0, -10), label([150, 12], "k12", 0, -10), label([250, 12], "k2", 0, -10),
        label([-10, 50], "displacements drawn enlarged", 0, 0)]));
      rK.set(`[${r.K[0][0]}  ${r.K[0][1]};  ${r.K[1][0]}  ${r.K[1][1]}] N/mm`, "", "k1 + k12 and k2 + k12 on the diagonal, −k12 off it: each spring adds its own 2 × 2 matrix");
      rU.set(`${(u1 * 1000).toFixed(2)} µm, ${(u2 * 1000).toFixed(2)} µm`, "", "{u} = [K]⁻¹{f}");
      rS.set(`${r.spring.k1.toFixed(1)}, ${r.spring.k12.toFixed(1)}, ${r.spring.k2.toFixed(1)} N`, "", "k1·u1, k12·(u2 − u1), k2·(0 − u2): the walls carry f1 + f2 between them");
    };
    const sl = (name, key, min, max, step, unit) => slider({ label: name, unit, min, max, value: p[key], step, format: v => `${v} ${unit}`, onInput: v => { p[key] = v; update(); } }).el;
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      sl("Stiffness k1", "k1", 100, 5000, 100, "N/mm"), sl("Stiffness k12", "k12", 100, 5000, 100, "N/mm"), sl("Stiffness k2", "k2", 100, 5000, 100, "N/mm"),
      sl("Force f1", "f1", -200, 200, 10, "N"), sl("Force f2", "f2", -200, 200, 10, "N"),
      rK.el, rU.el, rS.el,
      h("p", { class: "hint" }, "The springs are the elements, the two nodes join them, and the displacements are the nodes' degrees of freedom (p. 29). Make k12 very stiff: the two nodes move as one. Set k1 and k2 to their lowest and both forces the same way: the displacements grow, because only weak springs hold the pair against the walls. A real model has thousands of such equations, not two (p. 16)."))));
    update();
  },
};
