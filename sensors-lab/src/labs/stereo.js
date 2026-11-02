// Depth from disparity (Kubinger 2020, Modul 3, pp. 84–87): z = b·f/d, so the depth a pixel of disparity spans grows
// with the square of the distance. The baseline b sets the working range; the disparities searched set its ends.
import { depth, disparity, depthStep, range, fov, si } from "../core/index.js";
import { h, slider, readout } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

export default {
  id: "stereo",
  art: () => a.picture("Two cameras a baseline apart, their rays meeting at a point",
    a.rect(30, 115, 30, 20, a.INK, 3) + a.rect(140, 115, 30, 20, a.INK, 3) + a.line([[45, 115], [100, 30], [155, 115]], a.ACC, 2) +
      a.circle(100, 30, 5, a.ACC, 2, a.ACC) + a.line([[45, 142], [155, 142]], a.COOL, 2)),
  mount(root) {
    let b = 0.45, fmm = 4, pitch = 6, z = 5, dMin = 11, dMax = 200;
    const box = h("div", {}), rD = readout("Disparity at z"), rS = readout("Depth step of one pixel"), rR = readout("Working range"), rF = readout("Field of view, 1024 px across");
    const update = () => {
      const fPx = fmm * 1e-3 / (pitch * 1e-6), ds = Array.from({ length: 200 }, (_, i) => 1 + i * (dMax - 1) / 199);
      const r = range(b, fPx, dMin, dMax);
      box.replaceChildren(lineChart({ label: "Depth over disparity: z = b·f/d", xLabel: "Disparity d [px]", yLabel: "Depth z [m]", xMin: 0, xMax: dMax, yMin: 0, yMax: Math.min(depth(b, fPx, 1), 4 * r.zMax),
        lines: [{ x: ds, y: ds.map(d => depth(b, fPx, d)) }], marks: [{ x: disparity(b, fPx, z), y: z, shape: "dot" }] }));
      rD.set(`${disparity(b, fPx, z).toFixed(1)} px`, "", `b·f/z with f = ${fPx.toFixed(0)} px`);
      const st = depthStep(b, fPx, z);
      rS.set(si(st, "m"), st > 0.1 * z ? "warn" : "", "from d to d − 1; it grows with z², so stereo sees coarser the farther it looks");
      rR.set(`${r.zMin.toFixed(2)} m to ${r.zMax.toFixed(2)} m`, "", `disparities ${dMin} to ${dMax} px`);
      rF.set(`${(fov(1024, pitch * 1e-6, fmm * 1e-3) * 180 / Math.PI).toFixed(1)}° × ${(fov(768, pitch * 1e-6, fmm * 1e-3) * 180 / Math.PI).toFixed(1)}°`, "", "1024 × 768 pixels");
    };
    const sl = (label, unit, min, max, v, step, set, fmt) => slider({ label, unit, min, max, value: v, step, format: fmt, onInput: q => { set(q); update(); } });
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      sl("Baseline b", "m", 0.05, 2, b, 0.01, q => b = q, q => `${q.toFixed(2)} m`), sl("Focal length f", "mm", 2, 16, fmm, 0.1, q => fmm = q, q => `${q.toFixed(1)} mm`),
      sl("Pixel pitch", "µm", 2, 10, pitch, 0.01, q => pitch = q, q => `${q.toFixed(2)} µm`), sl("Point at depth z", "m", 0.3, 100, z, 0.1, q => z = q, q => `${q.toFixed(1)} m`),
      sl("Smallest disparity searched", "px", 1, 50, dMin, 1, q => dMin = q, q => `${q} px`), sl("Largest disparity searched", "px", 60, 600, dMax, 1, q => dMax = q, q => `${q} px`),
      rD.el, rS.el, rR.el, rF.el,
      h("p", { class: "hint" }, "The slides' table (p. 87) gives, for f = 4 mm, b = 0.45 m and disparities 11 to 200 on 1024 × 768 pixels of 6 µm, a range of 1.17 m to 21.31 m. With 6 µm, z = b·f/d gives 1.50 m to 27.27 m; the table's numbers come out exactly with a pitch of 7.68 µm, for all four rows. Set the pitch to 7.68 µm to see them; the fields of view in the same table fit 6 µm."),
      h("p", { class: "hint" }, "A wider baseline reaches farther (p. 84). Stereo is passive and can resolve finely, but the correspondence search costs much computing, calibration is hard and must be repeated, and it fails on plain, shiny, transparent or repeating surfaces and where one camera's view is hidden (p. 91)."))));
    update();
  },
};
