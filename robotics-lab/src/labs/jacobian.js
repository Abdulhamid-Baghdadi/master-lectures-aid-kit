// Velocity kinematics (Ajanović 2020, ch. 4, pp. 10–20): the Jacobian maps joint speeds to the tip's speed, v = J(q)·q̇.
// For the planar two-link arm J = [[−l1 s1 − l2 s12, −l2 s12], [l1 c1 + l2 c12, l2 c12]] (p. 20); where det J = l1 l2 sin θ2
// is zero the arm is singular and some tip speeds need infinite joint speeds (q̇ = J⁻¹v, p. 12).
import { planar2r, jacobian2r, det, speedEllipse, rad, deg } from "../core/index.js";
import { h, readout } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";
import { view, link, joint, ground, label, arrow, trace, angleSlider, lengthSlider, matrix } from "./draw.js";

export default {
  id: "jacobian",
  art: () => a.picture("A two-link arm with an ellipse at its tip: the tip speeds one unit of joint speed can give",
    a.line([[40, 125], [95, 80], [145, 60]], a.INK, 3) + a.circle(40, 125, 6, a.ACC) + a.circle(95, 80, 5) +
      `<ellipse cx="145" cy="60" rx="38" ry="14" transform="rotate(-25 145 60)" fill="none" stroke="${a.ACC}" stroke-width="2"/>` + a.arrow(145, 60, 178, 45, a.COOL, 2)),
  mount(root) {
    const st = { l1: 5, l2: 3, t1: rad(20), t2: rad(64), w1: 1, w2: 0 };
    const box = h("div", {}), mat = h("div", {}), chart = h("div", {}), rV = readout("Tip speed"), rD = readout("det J");
    const update = () => {
      const { elbow, tip } = planar2r(st.l1, st.l2, st.t1, st.t2), J = jacobian2r(st.l1, st.l2, st.t1, st.t2), D = det(J);
      const v = [J[0][0] * st.w1 + J[0][1] * st.w2, J[1][0] * st.w1 + J[1][1] * st.w2], e = speedEllipse(J), R = st.l1 + st.l2;
      // The ellipse of tip speeds for all joint speeds of size 1, drawn a quarter of its size so it fits beside the arm.
      const k = 0.25, ell = Array.from({ length: 73 }, (_, i) => { const t = i * Math.PI / 36, u = [Math.cos(t), Math.sin(t)];
        return [tip[0] + k * (J[0][0] * u[0] + J[0][1] * u[1]), tip[1] + k * (J[1][0] * u[0] + J[1][1] * u[1])]; });
      box.replaceChildren(view([-R - 2, -R - 2, R + 2, R + 2], `Two-link arm at θ1 = ${deg(st.t1).toFixed(0)}°, θ2 = ${deg(st.t2).toFixed(0)}°, det J = ${D.toFixed(2)}`, [
        link([[0, 0], elbow, tip]), joint(elbow), ground([0, 0]), trace(ell, "second"), arrow(tip, [tip[0] + k * v[0], tip[1] + k * v[1]], "speed"),
        label(tip, "v", 10, -10)]));
      mat.replaceChildren(h("p", { class: "hint" }, "J(q), rows ẋ and ẏ, columns θ̇1 and θ̇2:"), matrix(J, 3, "The Jacobian"));
      rV.set(`(${v.map(x => x.toFixed(2)).join("; ")}) per s`, "", `|v| = ${Math.hypot(...v).toFixed(2)}; the ellipse's half-axes are ${e.major.toFixed(2)} and ${e.minor.toFixed(2)}`);
      const sing = Math.abs(Math.sin(st.t2)) < 0.02;
      rD.set(D.toFixed(3), sing ? "warn" : "", sing ? "singular: stretched or folded, the tip cannot move along the arm" : "l1 l2 sin θ2: the area of the ellipse over π");
      const xs = Array.from({ length: 181 }, (_, i) => -180 + 2 * i);
      chart.replaceChildren(lineChart({ label: "det J over the elbow angle θ2", lines: [{ x: xs, y: xs.map(t => st.l1 * st.l2 * Math.sin(rad(t))), name: "det J" }],
        marks: [{ x: deg(st.t2), y: D, shape: "dot" }], xLabel: "Elbow angle θ2 [°]", yLabel: "det J [1]", xMin: -180, xMax: 180 }));
    };
    root.append(h("div", { class: "stage" }, h("div", {}, box, mat, chart), h("div", { class: "controls" },
      lengthSlider("Link l1", "", 5, 1, 8, 0.1, v => { st.l1 = v; update(); }).el,
      lengthSlider("Link l2", "", 3, 1, 8, 0.1, v => { st.l2 = v; update(); }).el,
      angleSlider("Joint θ1", 20, -180, 180, v => { st.t1 = v; update(); }).el,
      angleSlider("Joint θ2", 64, -180, 180, v => { st.t2 = v; update(); }).el,
      lengthSlider("Joint speed θ̇1", "rad/s", 1, -2, 2, 0.05, v => { st.w1 = v; update(); }).el,
      lengthSlider("Joint speed θ̇2", "rad/s", 0, -2, 2, 0.05, v => { st.w2 = v; update(); }).el,
      rV.el, rD.el,
      h("p", { class: "hint" }, "Each column of J is the tip's speed when only that joint turns at 1 rad/s. The ellipse is every tip speed that joint speeds of size 1 can give (drawn at a quarter): round means the arm moves as easily every way; flat means it hardly moves one way. Turn θ2 to 0°: the ellipse becomes a line."))));
    update();
  },
};
