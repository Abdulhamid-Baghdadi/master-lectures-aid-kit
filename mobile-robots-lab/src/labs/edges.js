// Edges (Wöber, MuS 2 Edges, pp. 5–15): the Sobel gradient in x and y, its size, and Canny's steps, smoothing,
// thinning by non-maximum suppression and the two thresholds, on the example scene with noise.
import { scene, noisy, sobel, canny } from "../core/index.js";
import { h, slider, readout } from "../../../kit/ui/kit.js";
import * as a from "../../../kit/ui/art.js";
import { picture } from "./draw.js";

/** Edges, p. 9, eq. 6: a gradient image scaled to 0–255 between its own minimum and maximum, for showing it. */
const stretch = img => { const lo = Math.min(...img.px), hi = Math.max(...img.px); return { ...img, px: img.px.map(v => 255 * (v - lo) / (hi - lo || 1)) }; };

export default {
  id: "edges",
  art: () => a.picture("A box and a disc reduced to their thin white outlines",
    a.rect(25, 40, 60, 75, a.INK, 3) + a.circle(140, 77, 32, a.INK, 3) + a.line([[10, 20], [190, 20]], a.DIM, 1)),
  mount(root) {
    let sd = 10, sigma = 1.2, minVal = 100, maxVal = 250;
    const clean = scene(), pics = h("div", { class: "pics" }), rG = readout("Largest gradient |∇f|"), rE = readout("Edge pixels");
    const update = () => {
      const img = noisy(clean, { sd }), s = sobel(img), c = canny(img, { size: 5, sigma, minVal, maxVal });
      pics.replaceChildren(picture(img, "Example scene, synthetic, with noise", { cell: 5 }),
        picture(stretch(s.gx), "Gx = Kx ∗ I, scaled: 0 shows as mid grey", { cell: 5 }), picture(stretch(s.gy), "Gy = Ky ∗ I, scaled", { cell: 5 }),
        picture(stretch(s.mag), "Sobel |∇f| without smoothing", { cell: 5 }), picture(stretch(c.thin), "Canny: smoothed, thinned", { cell: 5 }),
        picture(c.edges, `Canny edges: minVal ${minVal}, maxVal ${maxVal}`, { cell: 5 }));
      rG.set(Math.max(...c.mag.px).toFixed(0), "", "after Gaussian smoothing; a step of 150 grey values gives up to 4·150 = 600 with these kernels");
      rE.set(String(c.edges.px.filter(v => v).length), "", "above maxVal always, between the thresholds only if joined to a sure edge");
    };
    const sl = (label, min, max, v, step, set, f) => slider({ label, min, max, value: v, step, format: f, onInput: x => { set(x); update(); } }).el;
    root.append(h("div", { class: "stage wide" }, pics, h("div", { class: "controls" },
      sl("Noise σ [grey values]", 0, 40, sd, 1, v => sd = v, String),
      sl("Smoothing σ [px]", 0.5, 3, sigma, 0.1, v => sigma = v, v => v.toFixed(1)),
      sl("minVal", 0, 600, minVal, 10, v => minVal = v, String), sl("maxVal", 0, 900, maxVal, 10, v => maxVal = v, String),
      rG.el, rE.el,
      h("p", { class: "hint" }, "Sobel takes the central difference across a row and weights the middle row twice (eq. 5, p. 9). Without smoothing, noise makes edges everywhere; Canny smooths first, keeps only the pixel with the largest gradient across an edge (p. 13), and accepts weak edge pixels only if they connect to strong ones (p. 14). The slide writes the direction as atan2(fx, fy); the lab takes atan2(fy, fx), so a gradient along +x has direction 0 and the angle is measured from the x axis."))));
    update();
  },
};
