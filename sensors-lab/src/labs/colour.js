// Colour space models (Kubinger 2020, Modul 3, pp. 54–65): every model starts from RGB, pixel by pixel. HSI and HSV
// split the colour (H, S) from the brightness (I or V), so a shadow changes I but hardly H; grey drops the colour.
import { hsi, hsv, luma, meanGrey, bayerComplementary, complementaryCell } from "../core/index.js";
import { h, s, slider, readout } from "../../../kit/ui/kit.js";
import * as a from "../../../kit/ui/art.js";

const hue = H => H === null ? "undefined" : `${(H * 360).toFixed(1)}°`;
const num = v => v === null ? "undefined" : v.toFixed(3);

export default {
  id: "colour",
  art: () => a.picture("A colour cube on its corner, the grey diagonal from black to white",
    a.path("M100 20 L155 50 L155 110 L100 140 L45 110 L45 50 Z", a.INK, 3) + a.line([[100, 20], [100, 80], [155, 110]], a.DIM, 2) +
      a.line([[100, 80], [45, 110]], a.DIM, 2) + a.line([[100, 140], [100, 20]], a.ACC, 3, "5 4") +
      a.circle(155, 50, 6, a.HOT, 2, a.HOT) + a.circle(45, 50, 6, a.COOL, 2, a.COOL)),
  mount(root) {
    const c = { R: 0.85, G: 0.45, B: 0.2 };
    const box = h("div", {}), rI = readout("HSI"), rV = readout("HSV"), rY = readout("Grey"), rB = readout("Complementary Bayer cell, back to RGB");
    const update = () => {
      const { R, G, B } = c, i = hsi(R, G, B), v = hsv(R, G, B), Y = luma(R, G, B);
      const css = (r, g, b) => `rgb(${[r, g, b].map(x => Math.round(255 * x)).join(",")})`;
      box.replaceChildren(s("svg", { viewBox: "0 0 520 200", role: "img", class: "chart", "aria-label": "The colour, its grey with green weighted more, and its grey with all three alike" },
        s("rect", { x: 20, y: 20, width: 150, height: 140, fill: css(R, G, B), class: "axis" }),
        s("rect", { x: 185, y: 20, width: 150, height: 140, fill: css(Y, Y, Y), class: "axis" }),
        s("rect", { x: 350, y: 20, width: 150, height: 140, fill: css(i.I, i.I, i.I), class: "axis" }),
        s("text", { x: 20, y: 185, class: "tick" }, "colour"), s("text", { x: 185, y: 185, class: "tick" }, "grey Y, green weighted"),
        s("text", { x: 350, y: 185, class: "tick" }, "grey I, all alike")));
      rI.set(`H ${hue(i.H)}, S ${num(i.S)}, I ${num(i.I)}`, i.H === null ? "warn" : "", "H by arccos, turned to 1 − H when B > G (p. 63)");
      rV.set(`H ${hue(v.H)}, S ${num(v.S)}, V ${num(v.V)}`, v.H === null ? "warn" : "", "by cases on the largest channel, much faster than HSI (p. 64)");
      rY.set(`Y ${Y.toFixed(3)}, I ${meanGrey(R, G, B).toFixed(3)}`, "", "Y = 0.299R + 0.587G + 0.114B; I = (R + G + B)/3 (p. 65)");
      const back = bayerComplementary(complementaryCell(R, G, B));
      rB.set(back.map(x => x.toFixed(3)).join(", "), "", "CY = G + B, YE = R + G and two G pixels give RGB back (p. 59)");
    };
    const sl = (key, label) => slider({ label, unit: "", min: 0, max: 1, value: c[key], step: 0.005, format: q => q.toFixed(3), onInput: q => { c[key] = q; update(); } });
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      sl("R", "Red R"), sl("G", "Green G"), sl("B", "Blue B"), rI.el, rV.el, rY.el, rB.el,
      h("p", { class: "hint" }, "Set R = G = B: the point lies on the cube's grey diagonal, S = 0 and the hue is undefined (pp. 55, 63). Halve all three: H and S stay, I and V halve. Separating colour from brightness is what the models are for (p. 62); classifying traffic lights, signs and tail lights by colour is one use the slides name (p. 24)."),
      h("p", { class: "hint" }, "A one-chip camera puts one filter on each pixel (the Bayer pattern) and interpolates the other colours from the neighbours: cheap, but with artefacts at edges and more noise than a monochrome camera (p. 59). A three-chip camera splits the light by prism onto three sensors (p. 55)."))));
    update();
  },
};
