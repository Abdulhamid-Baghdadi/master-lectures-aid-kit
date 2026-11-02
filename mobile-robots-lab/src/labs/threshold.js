// Segmentation by threshold (Wöber, MuS 2 Segmentation, pp. 5–16): find the blue box in the colour example scene by
// the blue channel alone, which also picks the white sheet, or by the excess blue index 2B − R − G; then let the image
// choose its own threshold by Otsu's idea, the largest J(TH).
import { colourScene, excess, threshold, histogramOf, fisherJ, otsu } from "../core/index.js";
import { h, slider, readout, choice } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";
import { picture } from "./draw.js";

export default {
  id: "threshold",
  art: () => a.picture("A blue box on a table turned into a white shape on black by a threshold",
    a.rect(15, 40, 75, 70, a.DIM, 2) + a.rect(25, 55, 35, 40, a.COOL, 2, a.COOL) + a.arrow(95, 75, 112, 75, a.INK, 2) +
      a.rect(115, 40, 75, 70, a.INK, 2, "#000") + a.rect(125, 55, 35, 40, a.INK, 2, a.INK)),
  mount(root) {
    const img = colourScene(), n = img.w * img.h;
    let channel = "excess", th = 128;
    const pics = h("div", { class: "pics" }), chart = h("div", {}), rT = readout("Threshold TH"), rO = readout("Otsu's threshold"), rJ = readout("J(TH) here");
    const colour = i => `rgb(${img.r[i]},${img.g[i]},${img.b[i]})`;
    // The excess index runs from −510 to 510; it is clamped to 0..255 to threshold it as an 8-bit image, as OpenCV needs
    // (p. 13, footnote 4).
    const grey = () => ({ w: img.w, h: img.h, px: Array.from({ length: n }, (_, i) =>
      channel === "blue" ? img.b[i] : Math.max(0, Math.min(255, excess(img.b[i], img.r[i], img.g[i])))) });
    let otsuButton;
    const update = () => {
      const g = grey(), hist = histogramOf(g), o = otsu(hist), mask = threshold(g, th), f = fisherJ(hist, th - 1);
      pics.replaceChildren(picture({ w: img.w, h: img.h }, "Example scene, synthetic: table, blue box, green plant, white sheet", { cell: 5, colour }),
        picture(g, channel === "blue" ? "Blue channel B" : "Excess blue 2B − R − G, clamped to 0–255", { cell: 5 }), picture(mask, `Mask: 255 where the value ≥ ${th}`, { cell: 5 }));
      const xs = Array.from({ length: 255 }, (_, i) => i), J = o.curve, top = Math.max(...J.filter(v => v !== null));
      chart.replaceChildren(lineChart({ label: "The histogram of the grey values and the criterion J over the threshold", xLabel: "Grey value or threshold TH [0–255]", yLabel: "Share (scaled)",
        xMin: 0, xMax: 255, yMin: 0, yMax: 1, yFormat: () => "",
        lines: [{ x: xs, y: xs.map(v => hist[v] / Math.max(...hist)), name: "histogram", cls: "faint" }, { x: xs, y: J.map(v => v === null ? NaN : v / top), name: "J(TH)", cls: "second" }],
        marks: [{ x: th, y: 0, shape: "x" }, { x: o.th, y: 1, shape: "o" }] }));
      rT.set(String(th), "", `${(100 * mask.px.filter(v => v).length / n).toFixed(1)} % of the pixels in the mask`);
      rO.set(o.th === undefined ? "—" : String(o.th + 1), "", `the TH that maximises J; class 1 holds p ≤ ${o.th}, mean ${o.mu1?.toFixed(0)}, class 2 mean ${o.mu2?.toFixed(0)}`);
      rJ.set(f ? f.J.toFixed(2) : "—", "", "(μ1 − μ2)²/(σ1² + σ2²), eq. 5: far-apart class means, narrow classes");
      otsuButton.onclick = () => { th = o.th + 1; thSlider.set(th); update(); };
    };
    otsuButton = h("button", { type: "button", class: "press" }, "Use Otsu's threshold");
    const thSlider = slider({ label: "Threshold TH", min: 0, max: 255, value: th, step: 1, format: v => String(v), onInput: v => { th = v; update(); } });
    root.append(h("div", { class: "stage wide" }, h("div", {}, pics, chart), h("div", { class: "controls" },
      choice("Channel", [["blue", "Blue channel B"], ["excess", "Excess blue 2B − R − G"]], channel, v => { channel = v; update(); }),
      thSlider.el, otsuButton, rT.el, rO.el, rJ.el,
      h("p", { class: "hint" }, "On the blue channel the white sheet is as blue as the box (255, 255, 255 is very blue too, p. 9), so no threshold separates them. The excess index asks for blue and little red and green (eq. 3, p. 10, with blue in the place of green as on p. 11), and the sheet drops out. Otsu's idea assumes two classes of grey values and picks the TH that separates them best (eq. 5); the course warns that the two classes it finds need not be the ones the task needs (p. 16). Classes holding under 2 % of the pixels are skipped, as their variance says nothing. The mask keeps p ≥ TH (eq. 4), the classes split at p ≤ TH (eq. 6), hence Otsu's TH plus one."))));
    update();
  },
};
