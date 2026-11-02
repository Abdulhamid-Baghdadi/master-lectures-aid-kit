// A mechanism drawn to scale: links as thick lines, joints as rings, frame pivots hatched below, paths as thin lines.
// Coordinates in mm with y up, as the lecture's drawings; the box [x0, y0, x1, y1] is fitted into the picture.
import { s } from "../../../kit/ui/kit.js";

const W = 520, H = 360, PAD = 24;

/** The picture of one state; parts are made by the functions below and get the mapping p => [x, y] on the page. */
export function view(box, label, parts) {
  const [x0, y0, x1, y1] = box, k = Math.min((W - 2 * PAD) / (x1 - x0), (H - 2 * PAD) / (y1 - y0));
  const ox = (W - k * (x1 - x0)) / 2, oy = (H - k * (y1 - y0)) / 2;
  const at = p => [ox + k * (p[0] - x0), H - oy - k * (p[1] - y0)];
  return s("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", class: "chart mech", "aria-label": label }, ...parts.flat().filter(Boolean).map(f => f(at, k)));
}

const pts = (at, list) => list.map(p => at(p).map(v => v.toFixed(1)).join(",")).join(" ");

export const link = (list, cls = "") => at => s("polyline", { points: pts(at, list), class: `link ${cls}`, fill: "none" });
export const trace = (list, cls = "") => at => s("polyline", { points: pts(at, list), class: `series ${cls}`, fill: "none" });
export const shape = (list, cls = "") => at => s("polygon", { points: pts(at, list), class: `body ${cls}` });
export const joint = (p, cls = "") => at => { const [x, y] = at(p); return s("circle", { cx: x, cy: y, r: 6, class: `joint ${cls}` }); };
export const dot = (p, cls = "") => at => { const [x, y] = at(p); return s("circle", { cx: x, cy: y, r: 5, class: `mark dot ${cls}` }); };
export const ring = (p, r, cls = "grid") => (at, k) => { const [x, y] = at(p); return s("circle", { cx: x, cy: y, r: r * k, class: cls, fill: "none" }); };
export const label = (p, text, dx = 8, dy = -8) => at => { const [x, y] = at(p); return s("text", { x: x + dx, y: y + dy, class: "tick" }, text); };
/** A frame pivot: a ring on a small hatched base. */
export const ground = p => at => {
  const [x, y] = at(p);
  return s("g", { class: "ground" }, s("path", { d: `M${x - 6},${y + 4} L${x},${y - 2} L${x + 6},${y + 4} Z M${x - 12},${y + 10} H${x + 12}`, class: "axis", fill: "none" }),
    s("circle", { cx: x, cy: y, r: 6, class: "joint" }));
};
/** A box that fits all the points given, with a margin. */
export function fit(list, margin = 0.12) {
  const xs = list.map(p => p[0]), ys = list.map(p => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const m = margin * Math.max(x1 - x0, y1 - y0, 1);
  return [x0 - m, y0 - m, x1 + m, y1 + m];
}
