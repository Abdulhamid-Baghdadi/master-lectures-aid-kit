// Denoising by a sliding kernel (Wöber, MuS 2 Entrauschen, pp. 5–10): the normalised box, the median and the Gaussian
// filter on the example scene with Gaussian and salt-and-pepper noise, and a cut through the image to see the edges blur.
import { scene, noisy, convolve, boxKernel, gaussKernel, medianFilter, meanError } from "../core/index.js";
import { h, slider, readout, choice } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";
import { picture } from "./draw.js";

export default {
  id: "denoise",
  art: () => a.picture("A speckled square beside the same square smoothed clean, a 3 by 3 window between them",
    a.rect(15, 35, 70, 70, a.INK, 2) + Array.from({ length: 40 }, (_, i) => a.circle(20 + (i * 29) % 62, 40 + (i * 17) % 62, 1.6, i % 2 ? a.INK : a.DIM, 0, i % 2 ? a.INK : a.DIM)).join("") +
      a.rect(115, 35, 70, 70, a.ACC, 3, "rgba(252,211,77,.25)") + [0, 1, 2, 3].map(k => a.line([[88 + k * 6, 60], [88 + k * 6, 80]], a.DIM, 1)).join("") + a.arrow(88, 70, 110, 70, a.INK, 2)),
  mount(root) {
    let sd = 20, salt = 0.05, kind = "median", size = 3, sigma = 1;
    const clean = scene(), boxPics = h("div", { class: "pics" }), chart = h("div", {}), rE = readout("Mean error against the clean scene");
    const update = () => {
      const dirty = noisy(clean, { sd, salt }), k = size;
      const out = kind === "box" ? convolve(dirty, boxKernel(k)) : kind === "gauss" ? convolve(dirty, gaussKernel(k, sigma)) : medianFilter(dirty, k);
      boxPics.replaceChildren(picture(clean, "Example scene, synthetic: floor, box and disc", { cell: 5 }), picture(dirty, "With noise", { cell: 5 }),
        picture(out, `${kind === "box" ? "Box" : kind === "gauss" ? "Gaussian" : "Median"} filter, ${k} × ${k}`, { cell: 5 }));
      const row = Math.floor(clean.h / 2), xs = Array.from({ length: clean.w }, (_, i) => i), cut = img => xs.map(x => img.px[row * img.w + x]);
      chart.replaceChildren(lineChart({ label: "One row through the middle of the image: clean, noisy and filtered grey values", xLabel: "Column [px]", yLabel: "Grey value [0–255]",
        xMin: 0, xMax: clean.w - 1, yMin: 0, yMax: 255, lines: [{ x: xs, y: cut(clean), name: "clean", cls: "faint" }, { x: xs, y: cut(dirty), name: "noisy", cls: "third" }, { x: xs, y: cut(out), name: "filtered", cls: "second" }] }));
      const e0 = meanError(dirty, clean), e1 = meanError(out, clean);
      rE.set(`${e1.toFixed(1)} grey values`, e1 < e0 ? "" : "warn", `${e0.toFixed(1)} before filtering: ${e1 < e0 ? "less noise left" : "the filter made it worse"}`);
    };
    const sl = (label, min, max, v, step, set, f) => slider({ label, min, max, value: v, step, format: f, onInput: x => { set(x); update(); } }).el;
    root.append(h("div", { class: "stage wide" }, h("div", {}, boxPics, chart), h("div", { class: "controls" },
      choice("Filter", [["box", "Normalised box"], ["median", "Median"], ["gauss", "Gaussian"]], kind, v => { kind = v; update(); }),
      sl("Kernel size Kw = Kh [px]", 3, 7, size, 2, v => size = v, v => `${v} × ${v}`),
      sl("Gaussian σ [px]", 0.5, 3, sigma, 0.1, v => sigma = v, v => v.toFixed(1)),
      sl("Gaussian noise σ [grey values]", 0, 50, sd, 1, v => sd = v, v => String(v)),
      sl("Salt-and-pepper share", 0, 0.3, salt, 0.01, v => salt = v, v => `${Math.round(v * 100)} %`),
      rE.el,
      h("p", { class: "hint" }, "Every filter slides a window over the image and puts one number in its centre (eq. 1, p. 6). The box averages: fast, but a stuck pixel of 255 still raises its whole window. The median sorts the window and takes the middle (eq. 3, p. 8), so a few stuck pixels never reach the output, and edges stay sharp. The Gaussian weights near pixels more (p. 9). The cut shows the price: the bigger the kernel, the softer the box's edges. The scene and its noise are synthetic and seeded; pixels beyond the border repeat the border."))));
    update();
  },
};
