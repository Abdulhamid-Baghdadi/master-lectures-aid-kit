// A robot drawn to scale: links as thick lines, joints as rings, the base hatched below, paths as thin lines, frames as
// three arrows. Coordinates with y up, as the lecture's drawings; the box [x0, y0, x1, y1] is fitted into the picture.
// Spatial points are first projected onto the page by project(); copied from the handling lab's draw.js and extended.
import { h, s, slider } from "../../../kit/ui/kit.js";

const W = 520, H = 360, PAD = 24;

/** The picture of one state; parts are made by the functions below and get the mapping p => [x, y] on the page. Parts
 *  may nest in lists to any depth: a chain of frames is a list of frames, each a list of axes. */
export function view(box, label, parts) {
  const [x0, y0, x1, y1] = box, k = Math.min((W - 2 * PAD) / (x1 - x0), (H - 2 * PAD) / (y1 - y0));
  const ox = (W - k * (x1 - x0)) / 2, oy = (H - k * (y1 - y0)) / 2;
  const at = p => [ox + k * (p[0] - x0), H - oy - k * (p[1] - y0)];
  return s("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", class: "chart mech", "aria-label": label }, ...parts.flat(Infinity).filter(Boolean).map(f => f(at, k)));
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

/** An arrow from p to q, its head drawn on the page so it keeps its size at any scale. */
export const arrow = (p, q, cls = "") => at => {
  const [x1, y1] = at(p), [x2, y2] = at(q), a = Math.atan2(y2 - y1, x2 - x1), k = 9;
  const head = [[x2 - k * Math.cos(a - 0.45), y2 - k * Math.sin(a - 0.45)], [x2, y2], [x2 - k * Math.cos(a + 0.45), y2 - k * Math.sin(a + 0.45)]];
  return s("g", { class: `frame-axis ${cls}` }, s("line", { x1, y1, x2, y2 }),
    s("polygon", { points: head.map(v => v.map(n => n.toFixed(1)).join(",")).join(" ") }));
};

/**
 * A view of space on the page: turned by the azimuth about the vertical z, then tilted by the elevation so the reader
 * looks down a little. At azimuth 0 x points right and y into the page; z stays vertical. Returns p => [u, v], v up.
 */
export function project(az, el) {
  const ca = Math.cos(az), sa = Math.sin(az), ce = Math.cos(el), se = Math.sin(el);
  return ([x, y, z]) => [x * ca - y * sa, z * ce + (x * sa + y * ca) * se];
}

/** A number to the digits given, with −0 shown as 0. */
export const num = (v, digits = 2) => { const t = v.toFixed(digits); return Number(t) === 0 ? (0).toFixed(digits) : t; };

/** A frame's three axes from its 4 × 4 transform, x, y and z told apart by name as well as colour. */
export function frameAxes(T, len, P, name = "") {
  const o = [T[0][3], T[1][3], T[2][3]];
  const tip = j => [o[0] + len * T[0][j], o[1] + len * T[1][j], o[2] + len * T[2][j]];
  return ["x", "y", "z"].flatMap((axis, j) => [arrow(P(o), P(tip(j)), `axis-${axis}`), label(P(tip(j)), `${axis}${name}`, 4, -4)]);
}

/** A matrix as a small table, each entry to the digits given; −0 is shown as 0. */
export function matrix(M, digits = 3, label = "matrix") {
  return h("table", { class: "matrix", "aria-label": label }, h("tbody", {}, M.map(row => h("tr", {}, row.map(v => h("td", {}, num(v, digits)))))));
}

/** A joint-angle slider in whole degrees; onInput gets radians, as the core takes them. */
export const angleSlider = (label, value, min, max, onInput) => slider({ label, unit: "°", min, max, value, step: 1,
  format: v => `${v.toFixed(0)}°`, onInput: v => onInput(v * Math.PI / 180) });

/** A length slider without a unit prefix: the course's lengths are plain numbers or mm. */
export const lengthSlider = (label, unit, value, min, max, step, onInput) => slider({ label, unit, min, max, value, step,
  format: v => `${Number(v.toFixed(2))}${unit ? ` ${unit}` : ""}`, onInput });
