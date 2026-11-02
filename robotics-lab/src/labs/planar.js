// Forward kinematics of a planar arm (Ajanović 2020, ch. 2, p. 38): the tip is ⁰T₂ = ⁰T₁·¹T₂, each step a turn by θᵢ
// and a move along the link; x = l1 cos θ1 + l2 cos(θ1 + θ2), y = l1 sin θ1 + l2 sin(θ1 + θ2), φ = θ1 + θ2. And the bent
// arm of ch. 3, p. 3, where only the first joint turns.
import { planar2r, planar2rT, bentArm, rad, deg } from "../core/index.js";
import { h, readout, choice } from "../../../kit/ui/kit.js";
import * as a from "../../../kit/ui/art.js";
import { view, link, joint, ground, label, trace, angleSlider, lengthSlider, matrix, dot } from "./draw.js";

export default {
  id: "planar",
  art: () => a.picture("A two-link arm in the plane with its tip marked and the tip's path as a dashed arc",
    a.line([[40, 125], [95, 75], [160, 70]], a.INK, 3) + a.circle(40, 125, 6, a.ACC) + a.circle(95, 75, 5) + a.circle(160, 70, 6, a.ACC, 3, a.ACC) +
      a.path("M160 70 A65 65 0 0 0 120 18", a.DIM, 2, "5 4")),
  mount(root) {
    // The exercise of ch. 2, p. 38.
    const st = { arm: "2r", l1: 5, l2: 3, t1: rad(20), t2: rad(64), b1: 0 };
    const box = h("div", {}), mat = h("div", {}), rP = readout("Tip"), rF = readout("Tip's turn φ");
    const twoR = h("div", {},
      lengthSlider("Link l1", "", 5, 1, 8, 0.1, v => { st.l1 = v; update(); }).el,
      lengthSlider("Link l2", "", 3, 1, 8, 0.1, v => { st.l2 = v; update(); }).el,
      angleSlider("Joint θ1", 20, -180, 180, v => { st.t1 = v; update(); }).el,
      angleSlider("Joint θ2", 64, -180, 180, v => { st.t2 = v; update(); }).el);
    const bent = h("div", { hidden: true }, angleSlider("Joint θ1", 0, -90, 180, v => { st.b1 = v; update(); }).el,
      h("p", { class: "hint" }, "l1 = 1, l2 = 2, l3 = 3, l4 = 4 as on the slide; the two bends are fixed at 135°."));
    const update = () => {
      twoR.hidden = st.arm !== "2r"; bent.hidden = st.arm === "2r";
      if (st.arm === "2r") {
        const { elbow, tip, phi } = planar2r(st.l1, st.l2, st.t1, st.t2), R = st.l1 + st.l2;
        // The tip's path when θ2 holds and θ1 turns: a circle about the base.
        const circle = Array.from({ length: 121 }, (_, i) => { const t = i * Math.PI / 60; const p = planar2r(st.l1, st.l2, t, st.t2).tip; return p; });
        box.replaceChildren(view([-R - 1, -R - 1, R + 1, R + 1], `Two-link arm at θ1 = ${deg(st.t1).toFixed(0)}°, θ2 = ${deg(st.t2).toFixed(0)}°: tip at (${tip[0].toFixed(2)}, ${tip[1].toFixed(2)})`, [
          trace(circle, "faint"), link([[0, 0], elbow, tip]), joint(elbow), ground([0, 0]), dot(tip), label(tip, `(${tip[0].toFixed(3)}, ${tip[1].toFixed(3)})`), label(elbow, "θ2", 10, 16)]));
        mat.replaceChildren(h("p", { class: "hint" }, "⁰T₂ = ⁰T₁·¹T₂:"), matrix(planar2rT(st.l1, st.l2, st.t1, st.t2), 3, "The arm's homogeneous transform"));
        rP.set(`(${tip[0].toFixed(3)}; ${tip[1].toFixed(3)})`, "", "x = l1 cos θ1 + l2 cos(θ1 + θ2), y likewise with sin");
        rF.set(`${deg(phi).toFixed(1)}°`, "", "θ1 + θ2: the tip frame's turn, the angle in the matrix's first column");
      } else {
        const { pts, tip } = bentArm([1, 2, 3, 4], st.b1);
        box.replaceChildren(view([-8, -1, 8, 9], `Bent arm at θ1 = ${deg(st.b1).toFixed(0)}°: tip at (${tip[0].toFixed(2)}, ${tip[1].toFixed(2)})`, [
          link(pts), joint(pts[1]), ground([0, 0]), dot(tip), label(tip, `(${tip[0].toFixed(2)}, ${tip[1].toFixed(2)})`), label(pts[1], "θ1", -26, 4)]));
        mat.replaceChildren(h("p", { class: "hint" }, "The slide's answer: x = k cos(α + θ1), y = l1 + k sin(α + θ1), with k the line from the joint to the tip."));
        rP.set(`(${tip[0].toFixed(2)}; ${tip[1].toFixed(2)})`, "", "ch. 3, p. 3 prints (4.12; 7.12) at 0° and (−6.12; 5.12) at 90°");
        rF.set(`${(deg(st.b1) + 90).toFixed(0)}°`, "", "the last link stands at θ1 + 90°, the two 45° bends added");
      }
    };
    root.append(h("div", { class: "stage" }, h("div", {}, box, mat), h("div", { class: "controls" },
      choice("Arm", [["2r", "Two links (ch. 2, p. 38)"], ["bent", "Bent arm (ch. 3, p. 3)"]], st.arm, v => { st.arm = v; update(); }),
      twoR, bent, rP.el, rF.el,
      h("p", { class: "hint" }, "Forward kinematics has one answer for every set of joint values (ch. 3, p. 2). The faint circle is where the tip goes when only θ1 turns."))));
    update();
  },
};
