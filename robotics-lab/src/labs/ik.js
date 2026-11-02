// Inverse kinematics of the planar two-link arm (Ajanović 2020, ch. 5, pp. 9–20): for a tip (x, y) there are two
// solutions, one, or none. cos θ2 = (x² + y² − l1² − l2²)/(2 l1 l2), θ2 = atan2(±√(1 − cos²θ2), cos θ2),
// θ1 = atan2(y, x) ∓ atan2(l2 sin θ2, l1 + l2 cos θ2); a solution needs (l1 − l2)² ≤ x² + y² ≤ (l1 + l2)².
import { ik2r, planar2r, deg } from "../core/index.js";
import { h, readout } from "../../../kit/ui/kit.js";
import * as a from "../../../kit/ui/art.js";
import { view, link, joint, ground, label, ring, dot, lengthSlider } from "./draw.js";

export default {
  id: "ik",
  art: () => a.picture("A target point reached by a two-link arm in two ways, elbow up and elbow down, inside a ring of reach",
    a.circle(60, 110, 70, a.DIM, 2) + a.circle(60, 110, 20, a.DIM, 2) + a.line([[60, 110], [80, 50], [125, 75]], a.INK, 3) +
      a.line([[60, 110], [112, 112], [125, 75]], a.COOL, 3, "6 4") + a.circle(125, 75, 6, a.ACC, 3, a.ACC) + a.circle(60, 110, 5, a.ACC)),
  mount(root) {
    // The example of ch. 5, p. 10: tip (4, 3), l1 = 3, l2 = 4.
    const st = { l1: 3, l2: 4, x: 4, y: 3 };
    const box = h("div", {}), rA = readout("Solution with θ2 > 0"), rB = readout("Solution with θ2 < 0"), rR = readout("Reach");
    const update = () => {
      const s = ik2r(st.l1, st.l2, st.x, st.y), R = st.l1 + st.l2, f = t => `${deg(t).toFixed(2)}°`;
      const arms = s.solutions.map((x, k) => { const p = planar2r(st.l1, st.l2, x.t1, x.t2); return [link([[0, 0], p.elbow, p.tip], k ? "second" : ""), joint(p.elbow, k ? "second" : "")]; });
      box.replaceChildren(view([-R - 1, -R - 1, R + 1, R + 1], s.reachable
        ? `Target (${st.x}, ${st.y}) reached two ways: θ1 = ${f(s.solutions[0].t1)}, θ2 = ${f(s.solutions[0].t2)}, or θ1 = ${f(s.solutions[1].t1)}, θ2 = ${f(s.solutions[1].t2)}`
        : `Target (${st.x}, ${st.y}) out of reach`, [
        ring([0, 0], R, "grid"), Math.abs(st.l1 - st.l2) > 0 ? ring([0, 0], Math.abs(st.l1 - st.l2), "grid") : null,
        arms, ground([0, 0]), dot([st.x, st.y]), label([st.x, st.y], s.reachable ? "target" : "target: out of reach", 10, -10)]));
      const say = (x, r) => r.set(s.reachable ? `θ1 = ${f(x.t1)}, θ2 = ${f(x.t2)}` : "none", s.reachable ? "" : "warn",
        s.reachable ? (Math.abs(Math.sin(x.t2)) < 1e-6 ? "on the edge of the ring: both solutions are the same" : "") : "the target lies outside the ring");
      say(s.solutions[0], rA); say(s.solutions[1], rB);
      rR.set(`${s.reach.min.toFixed(2)} ≤ ${s.reach.r2.toFixed(2)} ≤ ${s.reach.max.toFixed(2)}`, s.reachable ? "" : "warn",
        "(l1 − l2)² ≤ x² + y² ≤ (l1 + l2)²: the ring between the two circles is all the tip can reach");
    };
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      lengthSlider("Target x", "", 4, -8, 8, 0.01, v => { st.x = v; update(); }).el,
      lengthSlider("Target y", "", 3, -8, 8, 0.01, v => { st.y = v; update(); }).el,
      lengthSlider("Link l1", "", 3, 1, 6, 0.1, v => { st.l1 = v; update(); }).el,
      lengthSlider("Link l2", "", 4, 1, 6, 0.1, v => { st.l2 = v; update(); }).el,
      rA.el, rB.el, rR.el,
      h("p", { class: "hint" }, "Obstacles in the way and the joints' ranges decide which of the two to take (ch. 5, p. 10). With the slide's tip (4, 3), the arm reaches it with θ1 = 90°, θ2 = −90° or with θ1 = −16.26°, θ2 = 90°. atan2 keeps the quadrant that a plain arctan loses (p. 14)."))));
    update();
  },
};
