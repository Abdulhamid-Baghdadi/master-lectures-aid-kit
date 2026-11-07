// The drawings the labs share: matrices whose cells fill in as the coefficients arrive, a chart whose curves grow over
// time, the s-plane, vectors in the state plane, and the crane, motor, pendulum and circuits drawn to scale. Draws
// only what it is given.
import { h, s } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import { fmt, upTo } from "./view.js";

/** A matrix or vector as a bracketed grid. cells counts how many cells (row by row) have arrived; hot is the one
 *  arriving now, drawn larger; the rest wait as dots. */
export function mtx(name, M, { cells = Infinity, hot = -1, row = false } = {}) {
  const rows = Array.isArray(M[0]) ? M : row ? [M] : M.map(v => [v]);
  let k = 0;
  return h("div", { class: "mtx" }, h("span", { class: "mtx-name" }, `${name} =`),
    h("table", { class: "mtx-grid" }, h("tbody", {}, rows.map(r => h("tr", {}, r.map(v => {
      const i = k++;
      return h("td", { class: i === hot ? "hot" : i < cells ? "" : "wait" }, i < cells || i === hot ? fmt(v) : "·");
    }))))));
}

/** Equations as lines of terms; the term whose key is hot is marked, so the eye can follow it into the matrix. */
export const terms = (lines, hot) => h("div", { class: "ode" }, lines.map(line => h("p", {},
  line.map(([text, key]) => h("span", { class: key !== undefined && key === hot ? "term hot" : "term" }, text)))));

/** A line chart whose lines are drawn up to the share p of their time, a dot on each tip. */
export function grow({ lines, p = 1, ...rest }) {
  const cut = lines.map(l => ({ ...l, x: upTo(l.x, p), y: upTo(l.y, p) }));
  const xs = lines.flatMap(l => l.x), ys = lines.flatMap(l => l.y).filter(Number.isFinite);
  return lineChart({ xMin: Math.min(...xs), xMax: Math.max(...xs), yMin: Math.min(0, ...ys), yMax: Math.max(...ys, 1e-9), ...rest,
    lines: cut, marks: [...(rest.marks ?? []), ...cut.filter(l => !l.noTip).map(l => ({ x: l.x.at(-1), y: l.y.at(-1), shape: "dot", cls: l.cls }))] });
}

const W = 520, H = 320;

/** The s-plane with the poles as crosses (and a second set, e.g. the observer's, as rings), axes through 0. */
export function splane(poles, { second = [], zeros = [], label = "Poles in the s-plane", R } = {}) {
  const all = [...poles, ...second, ...zeros];
  const r = R ?? Math.max(1, ...all.map(([a, b]) => Math.max(Math.abs(a), Math.abs(b)))) * 1.25;
  const X = x => W / 2 + x / r * (W / 2 - 30), Y = y => H / 2 - y / r * (H / 2 - 24);
  const cross = ([a, b], cls) => s("g", { class: `pole ${cls}` },
    s("line", { x1: X(a) - 7, y1: Y(b) - 7, x2: X(a) + 7, y2: Y(b) + 7 }), s("line", { x1: X(a) - 7, y1: Y(b) + 7, x2: X(a) + 7, y2: Y(b) - 7 }));
  return s("svg", { viewBox: `0 0 ${W} ${H}`, class: "chart", role: "img", "aria-label": label },
    s("rect", { x: 0, y: 0, width: X(0), height: H, class: "lhp" }),
    s("line", { x1: 10, y1: Y(0), x2: W - 10, y2: Y(0), class: "axis" }), s("line", { x1: X(0), y1: 10, x2: X(0), y2: H - 10, class: "axis" }),
    s("text", { x: W - 14, y: Y(0) - 8, class: "tick", "text-anchor": "end" }, "Re"), s("text", { x: X(0) + 8, y: 22, class: "tick" }, "Im"),
    s("text", { x: 16, y: H - 12, class: "tick" }, `−${fmt(r, 3)}`), s("text", { x: 16, y: 22, class: "tick" }, "stable: left half"),
    ...poles.map(p => cross(p, "")), ...second.map(([a, b]) => s("circle", { cx: X(a), cy: Y(b), r: 7, class: "pole ring" })),
    ...zeros.map(([a, b]) => s("circle", { cx: X(a), cy: Y(b), r: 6, class: "pole zero" })));
}

/** Vectors from the origin of the state plane; with span, the parallelogram they enclose (its area is the
 *  determinant). grow scales the second vector in, so it is seen to come out of the first. */
export function plane(vectors, { span = false, label, grow: g = 1, trail = null } = {}) {
  const pts = [...vectors.map(v => v.v), ...(trail ?? [])];
  const r = Math.max(1, ...pts.flat().map(Math.abs)) * 1.2;
  const k = (H / 2 - 20) / r, X = x => W / 2 + x * k, Y = y => H / 2 - y * k;
  const vs = vectors.map((v, i) => (i === vectors.length - 1 ? { ...v, v: v.v.map(c => c * g) } : v));
  const arrow = ({ v, name, cls = "" }) => {
    const a = Math.atan2(-v[1], v[0]), x2 = X(v[0]), y2 = Y(v[1]);
    return s("g", { class: `vec ${cls}` }, s("line", { x1: X(0), y1: Y(0), x2, y2 }),
      s("polygon", { points: [[x2, y2], [x2 - 12 * Math.cos(a - 0.4), y2 - 12 * Math.sin(a - 0.4)], [x2 - 12 * Math.cos(a + 0.4), y2 - 12 * Math.sin(a + 0.4)]].map(q => q.join(",")).join(" ") }),
      s("text", { x: x2 + 8, y: y2 - 8, class: "tick" }, name));
  };
  const par = span && vs.length === 2 ? s("polygon", { class: "span", points: [[0, 0], vs[0].v, [vs[0].v[0] + vs[1].v[0], vs[0].v[1] + vs[1].v[1]], vs[1].v].map(([x, y]) => `${X(x)},${Y(y)}`).join(" ") }) : null;
  return s("svg", { viewBox: `0 0 ${W} ${H}`, class: "chart", role: "img", "aria-label": label },
    s("line", { x1: 10, y1: Y(0), x2: W - 10, y2: Y(0), class: "grid zero" }), s("line", { x1: X(0), y1: 10, x2: X(0), y2: H - 10, class: "grid zero" }),
    s("text", { x: W - 14, y: Y(0) - 8, class: "tick", "text-anchor": "end" }, "x1"), s("text", { x: X(0) + 8, y: 22, class: "tick" }, "x2"),
    ...(par ? [par] : []),
    ...(trail ? [s("polyline", { class: "series", fill: "none", points: trail.map(([x, y]) => `${X(x).toFixed(1)},${Y(y).toFixed(1)}`).join(" ") })] : []),
    ...vs.map(arrow));
}

/** The crane trolley to scale: rail, trolley at x, rope of length l at angle φ, the load. track = [x0, x1] in m. */
export function craneSvg({ x, phi, l, track = [-1, 4], label, ghost = null, force = 0 }) {
  const span = track[1] - track[0], k = Math.min((W - 40) / span, (H - 70) / (l * 1.05));
  const X = v => 20 + (v - track[0]) * k, top = 40;
  const body = (xx, ph, cls) => {
    const lx = X(xx) + l * k * Math.sin(ph), ly = top + 14 + l * k * Math.cos(ph);
    const half = Math.max(8, 0.4 * k); // a trolley 0.8 m wide, drawn to the same scale as the rope
    return s("g", { class: cls }, s("rect", { x: X(xx) - half, y: top - 6, width: 2 * half, height: 20, class: "trolley" }),
      s("line", { x1: X(xx), y1: top + 14, x2: lx, y2: ly, class: "rope" }), s("circle", { cx: lx, cy: ly, r: 10, class: "load" }));
  };
  const fx = force ? s("line", { x1: X(x) - 22, y1: top + 4, x2: X(x) - 22 - Math.sign(force) * Math.min(60, 10 + Math.abs(force) / 20), y2: top + 4, class: "force" }) : null;
  return s("svg", { viewBox: `0 0 ${W} ${H}`, class: "chart mech", role: "img", "aria-label": label },
    s("line", { x1: 10, y1: top + 16, x2: W - 10, y2: top + 16, class: "axis" }),
    ...[0, 1, 2, 3, 4].filter(v => v >= track[0] && v <= track[1]).map(v => s("text", { x: X(v), y: top + 32, class: "tick", "text-anchor": "middle" }, `${v} m`)),
    ...(ghost ? [body(ghost.x, ghost.phi, "ghost")] : []), body(x, phi, "crane"), ...(fx ? [fx] : []));
}

/** A motor shaft seen end on, turned by angle (rad), with a speed label. */
export function motorSvg(angle, label, text) {
  const cx = W / 2, cy = H / 2, r = 100;
  return s("svg", { viewBox: `0 0 ${W} ${H}`, class: "chart mech", role: "img", "aria-label": label },
    s("circle", { cx, cy, r: r + 16, class: "housing" }), s("circle", { cx, cy, r, class: "rotor" }),
    ...[0, 1, 2].map(i => s("line", { class: "spoke", x1: cx, y1: cy, x2: cx + r * Math.cos(angle + i * 2.094), y2: cy + r * Math.sin(angle + i * 2.094) })),
    s("circle", { cx, cy, r: 12, class: "hub-dot" }), s("text", { x: cx, y: H - 8, class: "tick", "text-anchor": "middle" }, text));
}

/** A pendulum at angle y (rad), and a second, dashed, at y2 (the linear model's), from a common pivot. */
export function pendulumSvg(y, y2, label) {
  const cx = W / 2, cy = 30, L = 240;
  const bob = (a, cls) => s("g", { class: cls }, s("line", { x1: cx, y1: cy, x2: cx + L * Math.sin(a), y2: cy + L * Math.cos(a), class: "rope" }),
    s("circle", { cx: cx + L * Math.sin(a), cy: cy + L * Math.cos(a), r: 14, class: "load" }));
  return s("svg", { viewBox: `0 0 ${W} ${H}`, class: "chart mech", role: "img", "aria-label": label },
    s("line", { x1: cx - 60, y1: cy, x2: cx + 60, y2: cy, class: "axis" }), s("line", { x1: cx, y1: cy, x2: cx, y2: cy + L + 20, class: "grid" }),
    bob(y2, "ghost"), bob(y, "crane"));
}

/** A ladder circuit drawn from its parts: series parts along the top rail, then, if any, a shunt branch down to the
 *  bottom rail at the right, and series parts along the bottom rail. A dot runs round the loop with the current. */
export function circuitSvg({ top, shunt = [], bottom = [], label, flow = 0, inLabel = "u", outs = [] }) {
  const x0 = 60, x1 = W - 100, yT = 60, yB = H - 50;
  const part = (kind, name, x, y, vertical = false) => {
    const g = [];
    if (kind === "R") g.push(s("rect", vertical ? { x: x - 10, y: y - 24, width: 20, height: 48 } : { x: x - 24, y: y - 10, width: 48, height: 20 }));
    else if (kind === "L") g.push(s("rect", vertical ? { x: x - 10, y: y - 24, width: 20, height: 48, class: "filled" } : { x: x - 24, y: y - 10, width: 48, height: 20, class: "filled" }));
    else g.push(...(vertical ? [s("line", { x1: x - 16, y1: y - 5, x2: x + 16, y2: y - 5 }), s("line", { x1: x - 16, y1: y + 5, x2: x + 16, y2: y + 5 })]
      : [s("line", { x1: x - 5, y1: y - 16, x2: x - 5, y2: y + 16 }), s("line", { x1: x + 5, y1: y - 16, x2: x + 5, y2: y + 16 })]));
    return s("g", { class: "cpart" }, ...g, s("text", { x: vertical ? x + 18 : x, y: vertical ? y + 4 : y - 18, class: "tick", "text-anchor": vertical ? "start" : "middle" }, name));
  };
  const spread = (list, a, b) => list.map((p, i) => [p, a + (b - a) * (i + 1) / (list.length + 1)]);
  // The loop for the moving dot: along the top, down the shunt, back along the bottom.
  const loop = [[x0, yT], [x1, yT], [x1, yB], [x0, yB], [x0, yT]];
  const segs = loop.slice(1).map((q, i) => Math.hypot(q[0] - loop[i][0], q[1] - loop[i][1])), total = segs.reduce((a, b) => a + b);
  let d = ((flow % 1) + 1) % 1 * total, i = 0;
  while (d > segs[i]) { d -= segs[i]; i++; }
  const f = d / segs[i], dot = [loop[i][0] + f * (loop[i + 1][0] - loop[i][0]), loop[i][1] + f * (loop[i + 1][1] - loop[i][1])];
  return s("svg", { viewBox: `0 0 ${W} ${H}`, class: "chart schematic", role: "img", "aria-label": label },
    s("polyline", { points: loop.map(q => q.join(",")).join(" "), class: "wire", fill: "none" }),
    s("line", { x1: x1, y1: yT, x2: W - 30, y2: yT, class: "wire" }), s("line", { x1: x1, y1: yB, x2: W - 30, y2: yB, class: "wire" }),
    ...[[x0 - 30, yT], [x0 - 30, yB], [W - 30, yT], [W - 30, yB]].map(([x, y]) => s("circle", { cx: x, cy: y, r: 4, class: "term" })),
    s("line", { x1: x0 - 30, y1: yT, x2: x0, y2: yT, class: "wire" }), s("line", { x1: x0 - 30, y1: yB, x2: x0, y2: yB, class: "wire" }),
    s("text", { x: x0 - 40, y: (yT + yB) / 2, class: "tick", "text-anchor": "middle" }, inLabel),
    ...outs.map((o, j) => s("text", { x: W - 18, y: (yT + yB) / 2 + 18 * j, class: "tick", "text-anchor": "end" }, o)),
    ...spread(top, x0, x1).map(([[k, n], x]) => part(k, n, x, yT)),
    ...spread(shunt, yT, yB).map(([[k, n], y]) => part(k, n, x1, y, true)),
    ...spread(bottom, x0, x1).map(([[k, n], x]) => part(k, n, x, yB)),
    s("circle", { cx: dot[0], cy: dot[1], r: 6, class: "electron" }));
}
