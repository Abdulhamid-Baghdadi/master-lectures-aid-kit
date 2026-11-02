// Robot vision on small grey and colour images (Wöber 2019–2021, MuS 2): synthetic example scenes made from a seed,
// noise, the discrete convolution with box, Gaussian and Sobel kernels, the median filter, Canny's steps, thresholds,
// the excess colour index, the threshold by Otsu's idea, RGB and HSV. An image is { w, h, px } with px row by row,
// grey values 0..255; a colour image has r, g and b arrays instead of px.
import { uniform, normal } from "./random.js";

const clamp = v => Math.max(0, Math.min(255, v));
export const blank = (w, h, v = 0) => ({ w, h, px: new Array(w * h).fill(v) });
const at = (img, x, y) => img.px[Math.min(img.h - 1, Math.max(0, y)) * img.w + Math.min(img.w - 1, Math.max(0, x))];

/** The example scene, labelled as such on the page: a dark floor (50), a bright box (200) and a grey disc (130). */
export function scene(w = 48, h = 36) {
  const img = blank(w, h, 50);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (x >= 0.12 * w && x < 0.42 * w && y >= 0.18 * h && y < 0.75 * h) img.px[y * w + x] = 200;
    if ((x - 0.7 * w) ** 2 + (y - 0.5 * h) ** 2 <= (0.24 * h) ** 2) img.px[y * w + x] = 130;
  }
  return img;
}

/** The scene with sensor noise (Entrauschen, p. 5): Gaussian of standard deviation sd, and a share `salt` of pixels
 *  stuck at 0 or 255. The same seed gives the same noise. */
export function noisy(img, { sd = 0, salt = 0 }, seed = 7) {
  const u = uniform(seed), g = normal(uniform(seed + 1));
  return { ...img, px: img.px.map(v => {
    const n = clamp(Math.round(v + sd * g()));
    return u() < salt ? (u() < 0.5 ? 0 : 255) : n;
  }) };
}

/** Entrauschen, p. 6, eq. 1: g(i, j) = Σk,l I(i + k, j + l)·h(k, l), the kernel's centre on the pixel. The sum as
 *  printed adds I(i + k, …), which is a correlation; for the symmetric box and Gaussian kernels it is the same as a
 *  convolution, and for Sobel it is the sign the slides show (Edges, p. 9). Pixels beyond the edge repeat the edge. */
export function convolve(img, kernel) {
  const kh = kernel.length, kw = kernel[0].length, oy = (kh - 1) >> 1, ox = (kw - 1) >> 1, out = blank(img.w, img.h);
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) {
    let s = 0;
    for (let k = 0; k < kh; k++) for (let l = 0; l < kw; l++) s += at(img, x + l - ox, y + k - oy) * kernel[k][l];
    out.px[y * img.w + x] = s;
  }
  return out;
}

/** Entrauschen, p. 7, eq. 2: the normalised box filter, every weight 1/(Kw·Kh). */
export const boxKernel = (kw, kh = kw) => Array.from({ length: kh }, () => new Array(kw).fill(1 / (kw * kh)));

/** Entrauschen, p. 9: a box filter weighted by the Gauss bell (Basics, p. 14, eq. 9, in each direction), normalised
 *  so the weights sum to one. */
export function gaussKernel(size, sigma) {
  const c = (size - 1) / 2, k = Array.from({ length: size }, (_, y) => Array.from({ length: size }, (_, x) =>
    Math.exp(-((x - c) ** 2 + (y - c) ** 2) / (2 * sigma * sigma))));
  const s = k.flat().reduce((a, b) => a + b, 0);
  return k.map(row => row.map(v => v / s));
}

/** Entrauschen, p. 8, eq. 3: the median of a sorted set, the middle value for n odd, the mean of the two middle ones
 *  for n even. */
export function median(values) {
  const p = [...values].sort((a, b) => a - b), n = p.length;
  return n % 2 ? p[(n - 1) / 2] : (p[n / 2 - 1] + p[n / 2]) / 2;
}

export function medianFilter(img, size) {
  const o = (size - 1) >> 1, out = blank(img.w, img.h);
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) {
    const win = [];
    for (let k = -o; k <= o; k++) for (let l = -o; l <= o; l++) win.push(at(img, x + l, y + k));
    out.px[y * img.w + x] = median(win);
  }
  return out;
}

/** The mean absolute difference from the clean scene: how much noise a filter leaves, by definition. */
export const meanError = (a, b) => a.px.reduce((s, v, i) => s + Math.abs(v - b.px[i]), 0) / a.px.length;

/** Edges, p. 9, eq. 5: the Sobel kernels. */
export const SOBEL_X = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
export const SOBEL_Y = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];

/** Edges, p. 7, eqs. 2–3: the gradient's size √(fx² + fy²) and direction. The slide writes atan2(fx, fy); the lab
 *  uses atan2(fy, fx), so a gradient along +x has direction 0: the angle is measured from the x axis. */
export function sobel(img) {
  const gx = convolve(img, SOBEL_X), gy = convolve(img, SOBEL_Y);
  return { gx, gy, mag: { ...gx, px: gx.px.map((v, i) => Math.hypot(v, gy.px[i])) }, dir: { ...gx, px: gx.px.map((v, i) => Math.atan2(gy.px[i], v)) } };
}

/** Edges, p. 13: non-maximum suppression; a pixel keeps its gradient only if neither neighbour along the gradient's
 *  direction (rounded to 0°, 45°, 90° or 135°) is larger. */
export function nonMax({ mag, dir }) {
  const out = blank(mag.w, mag.h), steps = [[1, 0], [1, 1], [0, 1], [-1, 1]];
  for (let y = 0; y < mag.h; y++) for (let x = 0; x < mag.w; x++) {
    const i = y * mag.w + x, a = ((dir.px[i] * 180 / Math.PI) % 180 + 180) % 180;
    const [dx, dy] = steps[Math.round(a / 45) % 4], m = mag.px[i];
    out.px[i] = m >= at(mag, x + dx, y + dy) && m >= at(mag, x - dx, y - dy) ? m : 0;
  }
  return out;
}

/** Edges, p. 14: two thresholds. Above maxVal an edge; below minVal none; between, an edge only if it touches one
 *  that is (followed through its eight neighbours). Returns 255 for edges, 0 elsewhere. */
export function hysteresis(img, minVal, maxVal) {
  const out = blank(img.w, img.h), stack = [];
  img.px.forEach((v, i) => { if (v >= maxVal) { out.px[i] = 255; stack.push(i); } });
  while (stack.length) {
    const i = stack.pop(), x = i % img.w, y = (i - x) / img.w;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const X = x + dx, Y = y + dy, j = Y * img.w + X;
      if (X >= 0 && Y >= 0 && X < img.w && Y < img.h && !out.px[j] && img.px[j] >= minVal) { out.px[j] = 255; stack.push(j); }
    }
  }
  return out;
}

/** Edges, pp. 11–14: Canny's steps, Gaussian smoothing, Sobel, thinning and the two thresholds. */
export function canny(img, { size = 5, sigma = 1.2, minVal, maxVal }) {
  const g = sobel(convolve(img, gaussKernel(size, sigma))), thin = nonMax(g);
  return { ...g, thin, edges: hysteresis(thin, minVal, maxVal) };
}

/** Segmentation, p. 12, eq. 4: 255 where p ≥ TH, else 0. */
export const threshold = (img, th) => ({ ...img, px: img.px.map(v => v >= th ? 255 : 0) });

/** A 256-bin histogram of an image's values, rounded and clamped to 0..255. */
export function histogramOf(img) {
  const h = new Array(256).fill(0);
  for (const v of img.px) h[clamp(Math.round(v))]++;
  return h;
}

/** Segmentation, p. 14, eq. 5, with the classes of p. 15, eq. 6 (C1: p ≤ TH, C2: p > TH): J(TH) = (μ1 − μ2)²/(σ1² + σ2²).
 *  Null when a class holds fewer than `min` pixels, where the variances say nothing. */
export function fisherJ(hist, th, min = 1) {
  const stats = (lo, hi) => {
    let n = 0, s = 0, q = 0;
    for (let v = lo; v <= hi; v++) { n += hist[v]; s += v * hist[v]; q += v * v * hist[v]; }
    const m = n ? s / n : 0;
    return { n, m, v: n ? q / n - m * m : 0 };
  };
  const a = stats(0, th), b = stats(th + 1, 255);
  if (a.n < min || b.n < min || a.v + b.v <= 0) return null;
  return { J: (a.m - b.m) ** 2 / (a.v + b.v), mu1: a.m, mu2: b.m, var1: a.v, var2: b.v };
}

/** Segmentation, p. 15: try every TH in 0..255 and keep the one where J is largest. A class must hold at least `share`
 *  of the pixels: a class of one or two values has nearly no variance and would win for no reason. */
export function otsu(hist, share = 0.02) {
  const total = hist.reduce((s, v) => s + v, 0);
  let best = null;
  const J = [];
  for (let th = 0; th < 255; th++) {
    const f = fisherJ(hist, th, Math.max(1, share * total));
    J.push(f ? f.J : null);
    if (f && (!best || f.J > best.J)) best = { th, ...f };
  }
  return { ...best, curve: J };
}

/** The colour example scene: a lit table with a light gradient, a blue box, a green plant and a white sheet. */
export function colourScene(w = 48, h = 36, seed = 11) {
  const g = normal(uniform(seed)), n = w * h, img = { w, h, r: new Array(n), g: new Array(n), b: new Array(n) };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x, light = 0.8 + 0.3 * x / w;
    let c = [150, 140, 125];
    if (x >= 0.08 * w && x < 0.36 * w && y >= 0.2 * h && y < 0.7 * h) c = [40, 70, 190];
    else if ((x - 0.62 * w) ** 2 + (y - 0.35 * h) ** 2 <= (0.2 * h) ** 2) c = [60, 150, 55];
    else if (x >= 0.55 * w && x < 0.9 * w && y >= 0.68 * h && y < 0.92 * h) c = [235, 235, 240];
    img.r[i] = clamp(Math.round(c[0] * light + 8 * g()));
    img.g[i] = clamp(Math.round(c[1] * light + 8 * g()));
    img.b[i] = clamp(Math.round(c[2] * light + 8 * g()));
  }
  return img;
}

/** Segmentation, p. 10, eq. 3, and p. 11: the excess colour index, 2·(wanted channel) minus the two others. */
export const excess = (main, o1, o2) => 2 * main - o1 - o2;

/** Segmentation, pp. 24–26, eqs. 8–13: hue in degrees, saturation and value from R, G, B in 0..1. Hue is 0 for Δ = 0
 *  (the slide says black; every grey has Δ = 0). */
export function rgbToHsv(r, g, b) {
  const cmax = Math.max(r, g, b), cmin = Math.min(r, g, b), d = cmax - cmin;
  let H = 0;
  if (d > 0) H = cmax === r ? 60 * ((g - b) / d) : cmax === g ? 60 * (2 + (b - r) / d) : 60 * (4 + (r - g) / d);
  H = ((H % 360) + 360) % 360;
  return { H, S: cmax === 0 ? 0 : d / cmax, V: cmax };
}

/** Segmentation, pp. 29–31, eqs. 14–19, back from HSV to RGB. The slide's case h = 2 prints (q, V, t); it has to be
 *  (p, V, t), or green-to-cyan hues come back with red at full strength: the round trip in the tests fails with q. */
export function hsvToRgb(H, S, V) {
  const h = Math.floor(H / 60), f = H / 60 - h, p = V * (1 - S), q = V * (1 - S * f), t = V * (1 - S * (1 - f));
  return [[V, t, p], [q, V, p], [p, V, t], [p, q, V], [t, p, V], [V, p, q], [V, t, p]][h];
}
