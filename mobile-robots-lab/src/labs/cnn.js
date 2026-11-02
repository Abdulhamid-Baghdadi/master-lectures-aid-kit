// A convolution layer by hand (Thalhammer, MuS 2 CNN, pp. 6–10): one kernel slid over the example scene, a bias, ReLU
// and max pooling make a feature map; the counting rule for weights and output sizes, checked against the network
// summary the slides print.
import { scene, featureMap, SOBEL_X, SOBEL_Y, boxKernel, convParams, outSize, resnetStem } from "../core/index.js";
import { h, slider, readout, choice } from "../../../kit/ui/kit.js";
import * as a from "../../../kit/ui/art.js";
import { picture } from "./draw.js";

const KERNELS = { sx: ["Vertical edges (Sobel x)", SOBEL_X], sy: ["Horizontal edges (Sobel y)", SOBEL_Y], box: ["Blur (box 3 × 3)", boxKernel(3)],
  corner: ["Top-left corners", [[-1, -1, -1], [-1, 2, 2], [-1, 2, 2]]] };
// CNN, p. 10: the parameter counts the summary prints, row by row, beside the ones worked out.
const PRINTED = [0, 9472, 256, 0, 0, 4160, 36928, 16640];

export default {
  id: "cnn",
  art: () => a.picture("A small grid with a 3 by 3 window sliding over it into a smaller feature map",
    a.rect(15, 30, 80, 80, a.DIM, 2) + [1, 2, 3].map(k => a.line([[15 + 20 * k, 30], [15 + 20 * k, 110]], a.DIM, 1) + a.line([[15, 30 + 20 * k], [95, 30 + 20 * k]], a.DIM, 1)).join("") +
      a.rect(15, 30, 60, 60, a.ACC, 3) + a.arrow(100, 70, 125, 70, a.INK, 2) + a.rect(135, 45, 50, 50, a.INK, 3) + a.rect(135, 45, 25, 25, a.ACC, 0, a.ACC)),
  mount(root) {
    let key = "sx", bias = 0, stride = 1, m = 3, d = 3, k = 16, n = 64, s = 1, p = 1;
    const img = scene(24, 18), pics = h("div", { class: "pics" }), rP = readout("Weights of a convolution layer"), rO = readout("Output size");
    const table = h("table", { class: "eqs net" });
    table.append(h("thead", {}, h("tr", {}, h("th", {}, "Layer"), h("th", {}, "Output shape"), h("th", {}, "Weights, worked"), h("th", {}, "Printed (p. 10)"))),
      h("tbody", {}, resnetStem().map((r, i) => h("tr", {}, h("td", {}, r.name), h("td", {}, r.shape.join(" × ")), h("td", {}, String(r.params)),
        h("td", {}, `${PRINTED[i]}${PRINTED[i] === r.params ? " ✓" : " ✗"}`)))));
    const update = () => {
      const f = featureMap(img, KERNELS[key][1], { stride, bias });
      const lo = Math.min(...f.conv.px), hi = Math.max(...f.conv.px);
      pics.replaceChildren(picture(img, "Input: example scene, synthetic, 24 × 18", { cell: 8 }),
        picture(f.conv, `Kernel ∗ input + bias, ${f.conv.w} × ${f.conv.h}`, { cell: 8 * stride, lo, hi: hi > lo ? hi : lo + 1 }),
        picture(f.act, "After ReLU, max(0, x)", { cell: 8 * stride, lo: 0, hi: Math.max(1, ...f.act.px) }),
        picture(f.pooled, `After 2 × 2 max pooling, ${f.pooled.w} × ${f.pooled.h}`, { cell: 16 * stride, lo: 0, hi: Math.max(1, ...f.pooled.px) }));
      rP.set(String(convParams(m, m, d, k)), "", `((m·n·d) + 1)·k = ((${m}·${m}·${d}) + 1)·${k}: each of k kernels has m·n·d weights and one bias`);
      const o = outSize(n, m, s, p);
      rO.set(o > 0 ? `${o} × ${o} × ${k}` : "the kernel does not fit", o > 0 ? "" : "warn", `⌊(${n} + 2·${p} − ${m})/${s}⌋ + 1 per side, one channel per kernel`);
    };
    const sl = (label, min, max, v, step, set, f = String) => slider({ label, min, max, value: v, step, format: f, onInput: x => { set(x); update(); } }).el;
    root.append(h("div", { class: "stage wide" }, h("div", {}, pics, h("h3", {}, "The first layers of the network on p. 10, recomputed"), table), h("div", { class: "controls" },
      choice("Kernel", Object.entries(KERNELS).map(([v, [t]]) => [v, t]), key, v => { key = v; update(); }),
      sl("Bias", -200, 200, bias, 5, v => bias = v), sl("Stride", 1, 2, stride, 1, v => stride = v),
      h("h3", {}, "Count a layer"),
      sl("Kernel size m = n", 1, 9, m, 2, v => m = v), sl("Depth of the layer before d", 1, 512, d, 1, v => d = v),
      sl("Kernels k", 1, 512, k, 1, v => k = v), sl("Input size", 8, 640, n, 1, v => n = v),
      sl("Stride s", 1, 4, s, 1, v => s = v), sl("Padding p", 0, 5, p, 1, v => p = v),
      rP.el, rO.el,
      h("p", { class: "hint" }, "A trained network learns its kernels; here four are fixed by hand so the feature maps can be read. The same kernel at every place (weight sharing, p. 7) is why a convolution needs so few weights: the 7 × 7 layer of the summary has 9472 for 64 kernels. The table's kernel sizes and strides are not printed on the slide; they are the ones that give the printed counts and shapes. The slide counts a dense layer as nL−1·nL + 1; with one bias per node it is (nL−1 + 1)·nL, which is also what the slide's own convolution count gives for a 1 × 1 kernel."))));
    update();
  },
};
