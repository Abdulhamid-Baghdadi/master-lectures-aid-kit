// Orientation in space by three angles (Ajanović 2020, ch. 2, pp. 41–61): the elementary rotations about x, y and z,
// chained about the moving axes (Euler ZY′Z″, ZX′Z″; Cardan ZY′X″, which is roll-pitch-yaw about fixed axes). When the
// middle turn lines the third axis up with the first, one freedom is lost: gimbal lock.
import { euler, gimbalLocked, identity, hom, rad, deg } from "../core/index.js";
import { h, readout, choice } from "../../../kit/ui/kit.js";
import * as a from "../../../kit/ui/art.js";
import { view, frameAxes, angleSlider, matrix, project } from "./draw.js";

const SEQUENCES = {
  ZYX: "Z, Y′, X″ (roll-pitch-yaw)",
  ZYZ: "Z, Y′, Z″ (Euler)",
  ZXZ: "Z, X′, Z″ (Euler)",
  XYZ: "X, Y′, Z″ (Cardan)",
};

export default {
  id: "rotations",
  art: () => a.picture("A coordinate frame turned in space against a fixed one, three curved arrows for the three angles",
    a.arrow(70, 110, 140, 110, a.DIM, 2) + a.arrow(70, 110, 70, 40, a.DIM, 2) + a.arrow(70, 110, 35, 135, a.DIM, 2) +
      a.arrow(70, 110, 125, 70, a.INK, 3) + a.arrow(70, 110, 95, 45, a.INK, 3) + a.arrow(70, 110, 40, 85, a.ACC, 3) + a.path("M150 55 A20 20 0 1 1 130 35", a.ACC, 2)),
  mount(root) {
    const st = { seq: "ZYX", angles: [rad(30), rad(40), rad(20)], az: rad(30) };
    const box = h("div", {}), mat = h("div", {}), rL = readout("Gimbal lock"), rS = readout("Product");
    const sliders = [0, 1, 2].map(k => angleSlider(`Angle ${k + 1}`, deg(st.angles[k]), -180, 180, v => { st.angles[k] = v; update(); }));
    const update = () => {
      const R = euler(st.seq, st.angles), P = project(st.az, rad(20)), axes = [...st.seq].map((c, k) => c + ["", "′", "″"][k]);
      box.replaceChildren(view([-1.6, -1.4, 1.6, 1.4], `The frame turned ${axes.map((c, k) => `${deg(st.angles[k]).toFixed(0)}° about ${c}`).join(", then ")}`, [
        frameAxes(identity(4), 1, P, "0").map(f => at => { const g = f(at); g.classList.add("faint"); return g; }),
        frameAxes(hom(R, [0, 0, 0]), 1.15, P, "1")]));
      mat.replaceChildren(h("p", { class: "hint" }, "The rotation matrix; its columns are the turned axes in the fixed frame:"), matrix(R, 3, "The rotation matrix"));
      sliders.forEach((s, k) => s.el.querySelector("label").textContent = `Angle about ${axes[k]} [°]`);
      const locked = gimbalLocked(st.seq, st.angles, 0.02);
      rL.set(locked ? "Locked" : "Free", locked ? "warn" : "", locked
        ? "the first and third axes line up: turning either does the same, one freedom is lost"
        : st.seq[0] === st.seq[2] ? "an Euler sequence locks at a middle angle of 0° or 180°" : "a Cardan sequence locks at a middle angle of ±90°");
      rS.set(`R = R${axes[0]}·R${axes[1]}·R${axes[2]}`, "", "about the moving axes, the matrices multiply left to right; about the fixed axes the order turns round");
    };
    root.append(h("div", { class: "stage" }, h("div", {}, box, mat), h("div", { class: "controls" },
      choice("Sequence", Object.entries(SEQUENCES), st.seq, v => { st.seq = v; update(); }),
      ...sliders.map(s => s.el),
      angleSlider("View from", 30, -180, 180, v => { st.az = v; update(); }).el,
      rL.el, rS.el,
      h("p", { class: "hint" }, "Set Z, Y′, X″ to 0°, 90°, 0° and then to 90°, 90°, 90°: the slides (ch. 2, pp. 46 and 48) get the same matrix both times, so angles from a matrix are not unique. The faint frame stays fixed; the bold one is turned."))));
    update();
  },
};
