// A structure drawn to scale: bars and beams as thick lines, nodes as rings, springs as zigzags, walls hatched, loads
// as arrows. Coordinates in mm with y up; the box [x0, y0, x1, y1] is fitted into the picture.
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

/** A spring from p to q drawn as a zigzag of six teeth, with straight leads at both ends, so it reads as a spring at
 *  any length. */
export const spring = (p, q, cls = "") => at => {
  const [x1, y1] = at(p), [x2, y2] = at(q), L = Math.hypot(x2 - x1, y2 - y1) || 1, ux = (x2 - x1) / L, uy = (y2 - y1) / L;
  const lead = Math.min(14, L / 5), teeth = 6, amp = 7, pts = [[x1, y1], [x1 + ux * lead, y1 + uy * lead]];
  for (let k = 1; k <= 2 * teeth; k++) {
    const t = lead + (L - 2 * lead) * (k - 0.5) / (2 * teeth), side = k % 2 ? amp : -amp;
    pts.push([x1 + ux * t - uy * side, y1 + uy * t + ux * side]);
  }
  pts.push([x2 - ux * lead, y2 - uy * lead], [x2, y2]);
  return s("polyline", { points: pts.map(v => v.map(c => c.toFixed(1)).join(",")).join(" "), class: `spring ${cls}`, fill: "none" });
};
/** A force: an arrow of fixed length on the page from p in the direction (dx, dy), with its name at the tail. */
export const force = (p, [dx, dy], text = "") => at => {
  const [x, y] = at(p), L = Math.hypot(dx, dy) || 1, ex = x + 46 * dx / L, ey = y - 46 * dy / L, a = Math.atan2(ey - y, ex - x);
  const head = [[ex - 10 * Math.cos(a - 0.45), ey - 10 * Math.sin(a - 0.45)], [ex, ey], [ex - 10 * Math.cos(a + 0.45), ey - 10 * Math.sin(a + 0.45)]];
  return s("g", { class: "force" }, s("line", { x1: x, y1: y, x2: ex, y2: ey }),
    s("polygon", { points: head.map(v => v.map(c => c.toFixed(1)).join(",")).join(" ") }),
    text ? s("text", { x: ex + 6 * Math.sign(dx || 1), y: ey - 6, class: "tick", "text-anchor": dx < 0 ? "end" : "start" }, text) : null);
};
/** A wall: a short thick line across the direction (dx, dy) with hatching behind it. */
export const wall = (p, [dx, dy] = [-1, 0]) => at => {
  const [x, y] = at(p), nx = -dy, ny = dx, d = 22;
  const hatch = [-2, -1, 0, 1, 2].map(k => `M${(x + nx * k * 9).toFixed(1)},${(y - ny * k * 9).toFixed(1)} l${(dx * 9 - nx * 6).toFixed(1)},${(-dy * 9 + ny * 6).toFixed(1)}`).join(" ");
  return s("g", { class: "ground" }, s("line", { x1: x - nx * d, y1: y + ny * d, x2: x + nx * d, y2: y - ny * d, class: "axis" }),
    s("path", { d: hatch, class: "axis", fill: "none" }));
};
