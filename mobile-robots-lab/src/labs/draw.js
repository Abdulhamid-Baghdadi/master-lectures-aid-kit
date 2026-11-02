// Drawings shared by the labs: an image as a grid of grey or colour cells (the kit's heatmap), and the corridor with
// its doors, the robot and a belief over the cells as bars. Neither is a lab.
import { s, h } from "../../../kit/ui/kit.js";
import { heatmap } from "../../../kit/ui/field.js";

const grey = v => { const g = Math.round(255 * Math.max(0, Math.min(1, v))); return `rgb(${g},${g},${g})`; };

/** An image on the page, `cell` px per pixel; values are shown from lo (black) to hi (white). Colour images pass
 *  colour(i) for pixel i instead. A caption under it says what it shows. */
export function picture(img, label, { cell = 7, lo = 0, hi = 255, colour = null } = {}) {
  const W = img.w * cell, H = img.h * cell;
  const value = (x, y) => Math.floor(y / cell) * img.w + Math.floor(x / cell);
  const map = colour ? heatmap(W, H, img.w, img.h, value, 1, colour)
                     : heatmap(W, H, img.w, img.h, (x, y) => img.px[value(x, y)] - lo, hi - lo, grey);
  return h("figure", { class: "pic" },
    s("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": label, class: "chart image" }, map),
    h("figcaption", {}, label));
}

/** A plane in metres, x right and y up, at one scale in both directions so circles stay round. parts are functions of
 *  the mapping p => [x, y] on the page and the scale k (px per m); box is [x0, y0, x1, y1]. */
export function plane(box, label, parts, { W = 520, H = 360 } = {}) {
  const [x0, y0, x1, y1] = box, pad = 20, k = Math.min((W - 2 * pad) / (x1 - x0), (H - 2 * pad) / (y1 - y0));
  const ox = (W - k * (x1 - x0)) / 2, oy = (H - k * (y1 - y0)) / 2;
  const at = p => [ox + k * (p[0] - x0), H - oy - k * (p[1] - y0)];
  return s("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", class: "chart plane", "aria-label": label }, ...parts.flat().filter(Boolean).map(f => f(at, k)));
}

const pts = (at, list) => list.map(p => at(p).map(v => v.toFixed(1)).join(",")).join(" ");
export const polyline = (list, cls = "") => at => s("polyline", { points: pts(at, list), class: `series ${cls}`, fill: "none" });
export const dot = (p, cls = "", r = 3) => at => { const [x, y] = at(p); return s("circle", { cx: x.toFixed(1), cy: y.toFixed(1), r, class: `pt ${cls}` }); };
export const text = (p, t, dx = 6, dy = -6) => at => { const [x, y] = at(p); return s("text", { x: x + dx, y: y + dy, class: "tick" }, t); };
/** The 2σ ellipse of a 2 × 2 covariance about a centre: its axes along the eigenvectors, 2√λ long. */
export const ellipse = (c, S, cls = "ellipse") => (at, k) => {
  const [a, b, d] = [S[0][0], S[0][1], S[1][1]], m = (a + d) / 2, r = Math.sqrt(((a - d) / 2) ** 2 + b * b);
  const l1 = m + r, l2 = Math.max(0, m - r), ang = Math.atan2(l1 - a, b || 1e-12);
  const [x, y] = at(c);
  return s("ellipse", { cx: x.toFixed(1), cy: y.toFixed(1), rx: (2 * Math.sqrt(l1) * k).toFixed(1), ry: (2 * Math.sqrt(l2) * k).toFixed(1),
    transform: `rotate(${(-ang * 180 / Math.PI).toFixed(2)} ${x.toFixed(1)} ${y.toFixed(1)})`, class: cls });
};
/** A robot as a triangle at (x, y) pointing along θ, size in m. */
export const robot = ([x, y, th], size, cls = "robot") => at => {
  const c = Math.cos(th), sn = Math.sin(th), p = [[x + size * c, y + size * sn], [x - size * 0.6 * c - size * 0.5 * sn, y - size * 0.6 * sn + size * 0.5 * c],
    [x - size * 0.6 * c + size * 0.5 * sn, y - size * 0.6 * sn - size * 0.5 * c]];
  return s("polygon", { points: pts(at, p), class: cls });
};

/** The corridor: cells along a line, doors as dark frames, a belief as bars over the cells, the true robot as a
 *  triangle. bars: [{ values, cls, name }], all scaled to the largest value shown. */
export function corridor({ cells, doors, bars = [], robot = null, particles = null, label, top = null }) {
  const W = 520, H = 230, L = 20, R = 20, base = 170, cw = (W - L - R) / cells;
  const max = top ?? Math.max(1e-9, ...bars.flatMap(b => b.values));
  const parts = [];
  for (let i = 0; i < cells; i++) {
    const x = L + i * cw;
    parts.push(s("rect", { x: x + 1, y: base + 6, width: cw - 2, height: 22, class: doors.includes(i) ? "door" : "wall" }));
  }
  bars.forEach((b, k) => b.values.forEach((v, i) => {
    const bh = (base - 30) * v / max, x = L + i * cw + 2 + k * (cw - 4) / bars.length;
    parts.push(s("rect", { x: x.toFixed(1), y: (base - bh).toFixed(1), width: ((cw - 4) / bars.length).toFixed(1), height: bh.toFixed(1), class: `belief ${b.cls ?? ""}` }));
  }));
  if (particles) particles.forEach((p, k) => parts.push(s("circle", { cx: (L + p / cells * (W - L - R) * 1).toFixed(1), cy: (base - 4 - (k % 12) * 3).toFixed(1), r: 1.8, class: "particle" })));
  parts.push(s("line", { x1: L, y1: base, x2: W - R, y2: base, class: "axis" }));
  if (robot !== null) {
    const x = L + robot * cw;
    parts.push(s("polygon", { points: `${x},${base + 30} ${x - 7},${base + 44} ${x + 7},${base + 44}`, class: "robot" }));
  }
  const legend = bars.filter(b => b.name).map((b, k) => s("g", {}, s("rect", { x: L + k * 170, y: 6, width: 14, height: 10, class: `belief ${b.cls ?? ""}` }),
    s("text", { x: L + 20 + k * 170, y: 15, class: "tick" }, b.name)));
  // The kit's s() would print a null child as text, so the optional caption is left out, not passed as null.
  const caption = robot !== null ? [s("text", { x: W / 2, y: H - 4, class: "tick", "text-anchor": "middle" }, "▲ the robot, which the filter cannot see")] : [];
  return s("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", class: "chart corridor", "aria-label": label }, ...parts, ...legend,
    s("text", { x: L, y: H - 4, class: "tick" }, "0 m"), s("text", { x: W - R, y: H - 4, class: "tick", "text-anchor": "end" }, `${cells} m`), ...caption);
}
