// RGB and HSV (Wöber, MuS 2 Segmentation, pp. 20–31): a colour as hue, saturation and value, worked by the slide's
// equations both ways, and a mask by hue on the colour example scene, which no RGB threshold gives as easily.
import { rgbToHsv, hsvToRgb, colourScene } from "../core/index.js";
import { h, slider, readout } from "../../../kit/ui/kit.js";
import * as a from "../../../kit/ui/art.js";
import { picture } from "./draw.js";

/** The slide's own eq. 19, with (q, V, t) for h = 2, to show what that case would do. */
const slide = (H, S, V) => {
  const h = Math.floor(H / 60), f = H / 60 - h, p = V * (1 - S), q = V * (1 - S * f), t = V * (1 - S * (1 - f));
  return [[V, t, p], [q, V, p], [q, V, t], [p, q, V], [t, p, V], [V, p, q], [V, t, p]][h];
};
const rgb = c => `rgb(${c.map(v => Math.round(255 * v)).join(",")})`;

export default {
  id: "hsv",
  art: () => a.picture("A colour wheel seen from above with a pointer at blue",
    Array.from({ length: 12 }, (_, i) => { const t = i * Math.PI / 6, c = ["#f00", "#f80", "#ff0", "#8f0", "#0f0", "#0f8", "#0ff", "#08f", "#00f", "#80f", "#f0f", "#f08"][i];
      return a.line([[100, 75], [100 + 55 * Math.cos(t), 75 - 55 * Math.sin(t)]], c, 9); }).join("") + a.circle(100, 75, 18, a.INK, 3, "#0F172A") + a.arrow(100, 75, 72, 123, a.INK, 3)),
  mount(root) {
    let R = 60, G = 100, B = 200, hue = 225, width = 25, sMin = 0.4, vMin = 0.2;
    const img = colourScene(), n = img.w * img.h;
    const swatch = h("div", { class: "swatch big", role: "img" }), pics = h("div", { class: "pics" });
    const rH = readout("Hue H"), rS = readout("Saturation S and value V"), rB = readout("Back to RGB"), rM = readout("Pixels in the hue mask");
    const update = () => {
      const { H, S, V } = rgbToHsv(R / 255, G / 255, B / 255), back = hsvToRgb(H, S, V), wrong = slide(H, S, V);
      swatch.style.background = rgb([R / 255, G / 255, B / 255]);
      swatch.setAttribute("aria-label", `The colour R ${R}, G ${G}, B ${B}`);
      const max = Math.max(R, G, B), which = max === 0 || max === Math.min(R, G, B) ? "Δ = 0: a grey, hue set to 0" : max === R ? "Cmax is red: 60°·(G − B)/Δ" : max === G ? "Cmax is green: 60°·(2 + (B − R)/Δ)" : "Cmax is blue: 60°·(4 + (R − G)/Δ)";
      rH.set(`${H.toFixed(1)}°`, "", which);
      rS.set(`S = ${S.toFixed(3)}, V = ${V.toFixed(3)}`, "", "S = Δ/Cmax (0 when Cmax = 0), V = Cmax, from R, G, B scaled to 0–1");
      const differs = wrong.some((v, i) => Math.abs(v - back[i]) > 1e-9);
      rB.set(back.map(v => Math.round(255 * v)).join(", "), differs ? "warn" : "",
        differs ? `the slide's case h = 2, (q, V, t), gives ${wrong.map(v => Math.round(255 * v)).join(", ")}: R must be p, not q` : `h = ${Math.floor(H / 60)}, by eq. 19`);
      const inBand = Array.from({ length: n }, (_, i) => {
        const c = rgbToHsv(img.r[i] / 255, img.g[i] / 255, img.b[i] / 255), d = Math.abs(((c.H - hue + 540) % 360) - 180);
        return d <= width && c.S >= sMin && c.V >= vMin ? 255 : 0;
      });
      pics.replaceChildren(picture({ w: img.w, h: img.h }, "Example scene, synthetic", { cell: 5, colour: i => `rgb(${img.r[i]},${img.g[i]},${img.b[i]})` }),
        picture({ w: img.w, h: img.h, px: inBand }, `Mask: hue ${hue}° ± ${width}°, S ≥ ${sMin}, V ≥ ${vMin}`, { cell: 5 }));
      rM.set(`${(100 * inBand.filter(v => v).length / n).toFixed(1)} %`, "", "hue picks the colour, saturation keeps out greys and whites, value keeps out the dark");
    };
    const sl = (label, min, max, v, step, set, f) => slider({ label, min, max, value: v, step, format: f, onInput: x => { set(x); update(); } }).el;
    root.append(h("div", { class: "stage" }, h("div", {}, swatch, pics), h("div", { class: "controls" },
      sl("Red R", 0, 255, R, 1, v => R = v, String), sl("Green G", 0, 255, G, 1, v => G = v, String), sl("Blue B", 0, 255, B, 1, v => B = v, String),
      rH.el, rS.el, rB.el,
      h("h3", {}, "Mask by hue"),
      sl("Hue wanted [°]", 0, 359, hue, 1, v => hue = v, v => `${v}°`), sl("Hue band ± [°]", 5, 90, width, 1, v => width = v, v => `${v}°`),
      sl("Saturation at least", 0, 1, sMin, 0.01, v => sMin = v, v => v.toFixed(2)), sl("Value at least", 0, 1, vMin, 0.01, v => vMin = v, v => v.toFixed(2)),
      rM.el,
      h("p", { class: "hint" }, "Set G above R and B, then B a little higher (a green turning cyan, hue 120° to 180°): this is the case h = 2 of eq. 19 (p. 31), which the slide prints as (q, V, t). Going back that way gives red at nearly full strength, so the colour does not come back; (p, V, t), which this lab uses, returns it. In the mask, try 120° for the plant and 225° for the box. The slide scales each channel by its own minimum and maximum over the image (eq. 7, p. 23); this lab divides by 255, so one pixel's colour does not depend on the others."))));
    update();
  },
};
