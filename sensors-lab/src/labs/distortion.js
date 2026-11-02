// Lens distortion (Kubinger 2020, Modul 3, pp. 46–50): a short lens bends straight lines, most of all far from the
// principal point. A grid of straight lines drawn through the radial (k1, k2) and tangential (p1, p2) model.
import { distortedPixel } from "../core/index.js";
import { h, s, slider, readout } from "../../../kit/ui/kit.js";
import * as a from "../../../kit/ui/art.js";

const CAM = { fx: 500, fy: 500, cx: 512, cy: 384 };

export default {
  id: "distortion",
  art: () => a.picture("A square grid bulging outwards like a barrel",
    [-2, -1, 0, 1, 2].map(i => a.path(`M${100 + i * 25 - i * 6} 25 Q${100 + i * 25 + i * 4} 75 ${100 + i * 25 - i * 6} 125`, i ? a.INK : a.ACC, 2) +
      a.path(`M${40} ${75 + i * 22 - i * 5} Q100 ${75 + i * 22 + i * 4} 160 ${75 + i * 22 - i * 5}`, i ? a.INK : a.ACC, 2)).join("")),
  mount(root) {
    const c = { k1: -0.25, k2: 0, k3: 0, p1: 0, p2: 0 };
    const box = h("div", {}), rE = readout("The image corner moves by"), rK = readout("Kind");
    const update = () => {
      const k = 0.5, lines = [];
      // Each straight line of the ideal image, 9 across and 7 down, sampled finely and sent through the model.
      for (let i = 0; i <= 8; i++) lines.push(Array.from({ length: 41 }, (_, j) => [i * 128, j * 768 / 40]));
      for (let i = 0; i <= 6; i++) lines.push(Array.from({ length: 41 }, (_, j) => [j * 1024 / 40, i * 128]));
      const pl = pts => pts.map(p => distortedPixel(CAM, p, c)).map(([u, v]) => `${(u * k).toFixed(1)},${(v * k).toFixed(1)}`).join(" ");
      box.replaceChildren(s("svg", { viewBox: "-60 -50 632 484", role: "img", class: "chart", "aria-label": "A grid of straight lines and the same grid after the lens distortion" },
        s("rect", { x: 0, y: 0, width: 1024 * k, height: 768 * k, class: "grid", fill: "none" }),
        ...lines.map(pts => s("polyline", { points: pl(pts), class: "series", fill: "none" })),
        s("circle", { cx: CAM.cx * k, cy: CAM.cy * k, r: 4, class: "mark" })));
      const [u, v] = distortedPixel(CAM, [0, 0], c);
      rE.set(`${Math.hypot(u, v).toFixed(1)} px`, "", `(0, 0) is drawn at (${u.toFixed(1)}, ${v.toFixed(1)}); the principal point never moves`);
      const r = c.k1 + c.k2;
      rK.set(Math.abs(r) < 1e-9 ? "No radial distortion" : r < 0 ? "Barrel" : "Pincushion", "", "the sign of k1 + k2 at the edge (r ≈ 1) says which");
    };
    const sl = (key, label, min, max) => slider({ label, unit: "", min, max, value: c[key], step: (max - min) / 200, format: q => q.toFixed(3), onInput: q => { c[key] = q; update(); } });
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      sl("k1", "Radial k1", -0.5, 0.5), sl("k2", "Radial k2", -0.2, 0.2), sl("p1", "Tangential p1", -0.03, 0.03), sl("p2", "Tangential p2", -0.03, 0.03),
      rE.el, rK.el,
      h("p", { class: "hint" }, "Radial distortion matters, above all for short lenses (f < 5 mm); tangential distortion is usually negligibly small, but is modelled as well (p. 46). Both are intrinsic parameters, found by calibration (p. 51)."),
      h("p", { class: "hint" }, "To correct an image the program starts from each pixel (u, v) of the corrected image and looks up where it lies in the distorted one, (ud, vd), in a look-up table; going the other way would leave gaps. Those positions fall between pixels, so the value is interpolated, often bilinearly, and the corners with no source stay black (p. 50)."))));
    update();
  },
};
