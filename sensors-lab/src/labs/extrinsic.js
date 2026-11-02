// Extrinsic parameters (Kubinger 2020, Modul 3, pp. 45–46): where the camera stands and how it is turned, R and t,
// carry a world point into the camera, xc = R·xw + t; with K the whole chain is P = K·(R|t). A box in the world seen
// through a 1024 × 768 camera: pan it, move it, and the box's image moves while K stays the same.
import { projectWorld, rotY, rotX, mulM } from "../core/index.js";
import { h, s, slider, readout } from "../../../kit/ui/kit.js";
import * as a from "../../../kit/ui/art.js";

const CAM = { fx: 700, fy: 700, cx: 512, cy: 384 };
const BOX = [[-0.5, 0, 4], [0.5, 0, 4], [0.5, 0, 5], [-0.5, 0, 5], [-0.5, -1, 4], [0.5, -1, 4], [0.5, -1, 5], [-0.5, -1, 5]];
const EDGES = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];

export default {
  id: "extrinsic",
  art: () => a.picture("A camera turned towards a box, with the world and camera axes drawn",
    a.rect(110, 60, 50, 45, a.INK, 3) + a.rect(25, 85, 35, 25, a.ACC, 3) + a.line([[60, 92], [110, 75]], a.DIM, 2, "5 4") +
      a.arrow(25, 130, 70, 130, a.COOL, 2) + a.arrow(25, 130, 25, 95, a.COOL, 2)),
  mount(root) {
    let pan = 0, tilt = 0, tx = 0, ty = 0.5, tz = 0;
    const box = h("div", {}), rC = readout("Corner nearest the camera, left top"), rR = readout("R and t");
    const update = () => {
      const R = mulM(rotX(tilt * Math.PI / 180), rotY(pan * Math.PI / 180)), t = [tx, ty, tz];
      const pts = BOX.map(X => projectWorld(CAM, R, t, X));
      const k = 0.5, at = ([u, v]) => [u * k, v * k];
      box.replaceChildren(s("svg", { viewBox: "-20 -20 552 424", role: "img", class: "chart", "aria-label": "The camera's image, 1024 by 768 pixels, with the box's twelve edges projected" },
        s("rect", { x: 0, y: 0, width: 1024 * k, height: 768 * k, class: "grid", fill: "none" }),
        s("circle", { cx: CAM.cx * k, cy: CAM.cy * k, r: 4, class: "mark" }),
        s("text", { x: 6, y: 16, class: "tick" }, "image, 1024 × 768 px; the ring is the principal point"),
        ...EDGES.filter(([i, j]) => pts[i] && pts[j]).map(([i, j]) => s("line", { x1: at(pts[i])[0], y1: at(pts[i])[1], x2: at(pts[j])[0], y2: at(pts[j])[1], class: "series" }))));
      const p = pts[4];
      rC.set(p ? `(${p[0].toFixed(0)}, ${p[1].toFixed(0)}) px` : "behind the camera", p ? "" : "warn", "world point (−0.5, −1, 4) m");
      rR.set(`pan ${pan}°, tilt ${tilt}°`, "", `t = (${t.map(v => v.toFixed(2)).join(", ")}) m; K unchanged: fx = fy = 700 px`);
    };
    const sl = (label, unit, min, max, v, step, set) => slider({ label, unit, min, max, value: v, step, format: q => `${Number(q.toFixed(2))} ${unit}`, onInput: q => { set(q); update(); } });
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      sl("Pan about y", "°", -40, 40, pan, 1, q => pan = q), sl("Tilt about x", "°", -30, 30, tilt, 1, q => tilt = q),
      sl("Translation tx", "m", -1.5, 1.5, tx, 0.01, q => tx = q), sl("Translation ty", "m", -1, 1.5, ty, 0.01, q => ty = q),
      sl("Translation tz", "m", -3, 3, tz, 0.01, q => tz = q),
      rC.el, rR.el,
      h("p", { class: "hint" }, "The world here has y pointing down, as the camera's does (p. 42). Intrinsic parameters (fx, fy, cx, cy and the distortion) belong to the camera and stay when it is moved; extrinsic ones (R, t) must be found again after every change of pose (p. 42). Calibration finds both from a known pattern in several poses: six or more point pairs, not all in one plane, solved by least squares (pp. 51–52)."))));
    update();
  },
};
