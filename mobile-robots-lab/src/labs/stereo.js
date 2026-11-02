// Depth from a stereo pair and the pinhole camera (Wöber, MuS 2 Pose estimation, pp. 6–28): a point seen by two
// cameras a baseline apart lands at different columns; the difference, the disparity, gives its depth Z = B·f/D.
import { project, stereoDepth } from "../core/index.js";
import { h, slider, readout } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";
import { plane, polyline, dot, text } from "./draw.js";

export default {
  id: "stereo",
  art: () => a.picture("Two cameras side by side with rays meeting at a point in front of them",
    a.rect(45, 115, 24, 16, a.INK, 3) + a.rect(130, 115, 24, 16, a.INK, 3) + a.line([[57, 115], [100, 30]], a.ACC, 2) + a.line([[142, 115], [100, 30]], a.ACC, 2) +
      a.circle(100, 30, 5, a.HOT, 0, a.HOT) + a.line([[57, 140], [142, 140]], a.DIM, 2)),
  mount(root) {
    let B = 0.12, f = 700, X = 0.1, Z = 1.5, err = 1;
    const box = h("div", {}), chart = h("div", {}), rU = readout("Columns in the two images"), rD = readout("Disparity D and depth Z"), rE = readout("Depth error for 1 px of disparity error");
    const update = () => {
      const cam = { fx: f, fy: f }, uL = project([X, 0, Z], cam)[0], uR = project([X - B, 0, Z], cam)[0], D = uL - uR, z = stereoDepth(B, f, D);
      const zErr = stereoDepth(B, f, D - err) - z, s = 0.05 * Math.max(1, Z);
      box.replaceChildren(plane([-0.4, -0.15, Math.max(0.6, B + 0.4), Z + 0.2], "Seen from above: two cameras a baseline apart, the point, and the rays from the point to each camera", [
        polyline([[0, 0], [X, Z]], "second"), polyline([[B, 0], [X, Z]], "second"), polyline([[-s, 0], [B + s, 0]], "faint"),
        dot([0, 0], "", 5), dot([B, 0], "", 5), dot([X, Z], "hot", 5), text([0, 0], "left", -30, 18), text([B, 0], "right", 4, 18), text([X, Z], `Z = ${Z.toFixed(2)} m`)],
        { H: 300 }));
      const Ds = Array.from({ length: 120 }, (_, i) => 2 + i * 2);
      chart.replaceChildren(lineChart({ label: "Depth over disparity, Z = B·f/D, with the point now marked", xLabel: "Disparity D [px]", yLabel: "Depth Z [m]",
        xMin: 0, xMax: 240, yMin: 0, yMax: 10, lines: [{ x: Ds, y: Ds.map(d => stereoDepth(B, f, d)), name: "Z = B·f/D" }], marks: [{ x: D, y: z, shape: "dot" }], xFormat: v => v.toFixed(0) }));
      rU.set(`u = ${uL.toFixed(1)} px and u′ = ${uR.toFixed(1)} px`, "", "u = f·x/z from the chip's centre in each camera (eqs. 4–5, cx = 0)");
      rD.set(`D = ${D.toFixed(1)} px, Z = ${z.toFixed(3)} m`, "", "Z = B·f/D (eq. 3, p. 10); D measured from each chip's centre is u − u′");
      rE.set(`${(100 * zErr).toFixed(1)} cm`, zErr > 0.05 * Z ? "warn" : "", `D off by ${err} px: far points have small D, so the same pixel error costs more depth`);
    };
    const sl = (label, unit, min, max, v, step, set, fm) => slider({ label, unit, min, max, value: v, step, format: fm, onInput: x => { set(x); update(); } }).el;
    root.append(h("div", { class: "stage" }, h("div", {}, box, chart), h("div", { class: "controls" },
      sl("Baseline B", "m", 0.03, 0.5, B, 0.01, v => B = v, v => `${v.toFixed(2)} m`),
      sl("Focal length f", "px", 200, 1500, f, 10, v => f = v, v => `${v} px`),
      sl("Point's sideways position x", "m", -0.5, 0.6, X, 0.01, v => X = v, v => `${v.toFixed(2)} m`),
      sl("Point's depth Z", "m", 0.3, 8, Z, 0.05, v => Z = v, v => `${v.toFixed(2)} m`),
      sl("Disparity error", "px", 0.5, 5, err, 0.5, v => err = v, v => `${v} px`),
      rU.el, rD.el, rE.el,
      h("p", { class: "hint" }, "Near points shift a lot between the two images and far ones hardly, which is why near objects are bright in a disparity image (p. 11). The slide derives Z = B·f/(x + x′) with x and x′ measured outwards from each camera, and notes that from the chip's centre the disparity is x − x′ (p. 10); the lab uses the latter. Moving the point sideways leaves D unchanged: depth depends only on Z. The cameras are ideal: calibrated, rectified, no lens distortion (p. 4)."))));
    update();
  },
};
