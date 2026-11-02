// Odometry of a differential drive (Wöber, MuS 1 EKF, p. 3; MR_Kinematik, pp. 3–24): the wheels' turns give the
// distance and the turn of each step; repeated, they draw an arc about the instantaneous centre of rotation.
import { odometry, move, icr } from "../core/index.js";
import { h, slider, readout } from "../../../kit/ui/kit.js";
import * as a from "../../../kit/ui/art.js";
import { plane, polyline, dot, robot, text } from "./draw.js";

export default {
  id: "odometry",
  art: () => a.picture("A two-wheeled robot driving along an arc around a marked centre of rotation",
    a.path("M40 120 A70 70 0 0 1 150 60", a.ACC, 3) + a.circle(110, 120, 4, a.HOT, 0, a.HOT) + a.line([[110, 120], [150, 60]], a.DIM, 1.5, "4 4") +
      a.rect(138, 48, 26, 18, a.INK, 3) + a.line([[136, 44], [166, 44]], a.INK, 4) + a.line([[136, 70], [166, 70]], a.INK, 4)),
  mount(root) {
    let dl = 4, dr = 5, r = 0.05, b = 0.3, n = 12;
    const box = h("div", {}), rD = readout("Distance per step δd"), rT = readout("Turn per step δθ"), rC = readout("Turning radius");
    const update = () => {
      const { dd, dth } = odometry(dl, dr, r, b), path = [[0, 0, 0]];
      for (let k = 0; k < n; k++) path.push(move(path[k], dd, dth));
      const L = Math.abs(dth) > 1e-9 ? dd / dth : Infinity, end = path[n], all = path.map(p => [p[0], p[1]]);
      const c = Number.isFinite(L) ? icr([0, 0, 0], L) : null;
      const box_ = [...all, ...(c && Math.abs(L) < 5 ? [c] : [])];
      const xs = box_.map(p => p[0]), ys = box_.map(p => p[1]), m = 0.3;
      box.replaceChildren(plane([Math.min(...xs) - m, Math.min(...ys) - m, Math.max(...xs) + m, Math.max(...ys) + m],
        `The robot's path over ${n} steps, from the origin, with its centre of rotation`, [
          polyline(all, "second"), ...path.map(p => dot([p[0], p[1]], "", 2.5)), robot(end, 0.12),
          c && Math.abs(L) < 5 ? [dot(c, "hot", 4), text(c, "ICR")] : null, text([0, 0], "start", 6, 16)]));
      rD.set(`${(dd * 100).toFixed(1)} cm`, "", "δd = (Δφl + Δφr)·r/2");
      rT.set(`${(dth * 180 / Math.PI).toFixed(2)}°`, "", `δθ = (Δφr − Δφl)·r/b = ${dth.toFixed(4)} rad`);
      rC.set(Number.isFinite(L) ? `${Math.abs(L).toFixed(3)} m` : "straight on", "", Number.isFinite(L) ? `δd/δθ: the ICR lies ${L > 0 ? "left" : "right"} of the robot (MR_Kinematik, eq. 15)` : "equal wheel turns: no turn, the ICR is at infinity");
    };
    const sl = (label, unit, min, max, v, step, set, f) => slider({ label, unit, min, max, value: v, step, format: f, onInput: x => { set(x); update(); } }).el;
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      sl("Left wheel's turn per step Δφl", "rad", -10, 10, dl, 0.1, v => dl = v, v => `${v.toFixed(1)} rad`),
      sl("Right wheel's turn per step Δφr", "rad", -10, 10, dr, 0.1, v => dr = v, v => `${v.toFixed(1)} rad`),
      sl("Wheel radius r", "m", 0.02, 0.15, r, 0.005, v => r = v, v => `${v.toFixed(3)} m`),
      sl("Track width b", "m", 0.1, 0.8, b, 0.01, v => b = v, v => `${v.toFixed(2)} m`),
      sl("Steps", "", 1, 40, n, 1, v => n = v, v => String(v)),
      rD.el, rT.el, rC.el,
      h("p", { class: "hint" }, "Each step adds δd along the heading θ + δθ and turns by δθ (EKF, p. 3, eq. 1). Equal turns drive straight; opposite turns spin on the spot. This is pure kinematics, without slip or noise: Basics, p. 3 lists why it drifts on a real robot (inexact CAD data, noisy sensors, slip), and the next labs put that noise in. The ICR is drawn with eq. 15 of MR_Kinematik, p. 24, at the distance L = δd/δθ (worked here: speed over turn rate); the steps of eq. 1 move along the heading after each turn, so for large turns per step the path's own centre sits a little off it."))));
    update();
  },
};
