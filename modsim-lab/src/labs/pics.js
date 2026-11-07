// The drawings of this lab: masses on springs and dampers (lying or hanging), pendulums and linkages, the Simulink
// integrator chain as blocks, a circuit loop with its current, and energy bars. Draws only what it is given; the
// matrices, lit terms and growing charts are the kit's (../../../kit/ui/steps.js).
import { s } from "../../../kit/ui/kit.js";
import { fmt } from "../../../kit/ui/steps.js";

export const W = 520, H = 300;
const svg = (label, cls, ...body) => s("svg", { viewBox: `0 0 ${W} ${H}`, class: `chart ${cls}`, role: "img", "aria-label": label }, ...body);

/** A zigzag spring from (x1, y1) to (x2, y2), drawn with n coils. */
function spring(x1, y1, x2, y2, n = 7, w = 9) {
  const L = Math.hypot(x2 - x1, y2 - y1) || 1, ux = (x2 - x1) / L, uy = (y2 - y1) / L, px = -uy, py = ux;
  const pts = [[x1, y1], [x1 + ux * 8, y1 + uy * 8]];
  for (let i = 0; i < 2 * n; i++) {
    const a = 8 + (L - 16) * (i + 0.5) / (2 * n), side = i % 2 ? -w : w;
    pts.push([x1 + ux * a + px * side, y1 + uy * a + py * side]);
  }
  pts.push([x2 - ux * 8, y2 - uy * 8], [x2, y2]);
  return s("polyline", { class: "spring", points: pts.map(p => p.map(v => v.toFixed(1)).join(",")).join(" ") });
}
/** A dashpot from (x1, y1) to (x2, y2): a cup and a piston. */
function damper(x1, y1, x2, y2) {
  const L = Math.hypot(x2 - x1, y2 - y1) || 1, ux = (x2 - x1) / L, uy = (y2 - y1) / L, px = -uy * 8, py = ux * 8;
  const m = Math.min(L * 0.55, L - 10), c = L * 0.35;
  const P = a => [x1 + ux * a, y1 + uy * a];
  const [cx, cy] = P(c), [mx, my] = P(m);
  return s("g", { class: "damper" },
    s("line", { x1, y1, x2: cx, y2: cy }),
    s("polyline", { points: [[mx + px * 1.3 + ux * 6, my + py * 1.3 + uy * 6], [cx + px * 1.3, cy + py * 1.3], [cx - px * 1.3, cy - py * 1.3], [mx - px * 1.3 + ux * 6, my - py * 1.3 + uy * 6]].map(p => p.join(",")).join(" "), fill: "none" }),
    s("line", { x1: mx + px, y1: my + py, x2: mx - px, y2: my - py }), s("line", { x1: mx, y1: my, x2, y2 }));
}
/** An arrow from (x1, y1) to (x2, y2) with its label. */
export function arrow(x1, y1, x2, y2, label = "", cls = "force") {
  const a = Math.atan2(y2 - y1, x2 - x1), hx = 10 * Math.cos(a), hy = 10 * Math.sin(a);
  return s("g", { class: cls }, s("line", { x1, y1, x2, y2 }),
    s("polygon", { points: `${x2},${y2} ${x2 - hx - hy * 0.5},${y2 - hy + hx * 0.5} ${x2 - hx + hy * 0.5},${y2 - hy - hx * 0.5}` }),
    label ? s("text", { x: x2 + (x2 >= x1 ? 6 : -6), y: y2 - 8, class: "tick", "text-anchor": x2 >= x1 ? "start" : "end" }, label) : null);
}

/** Masses in a chain: a wall (or a moving base w), then spring ∥ damper to mass 1, to mass 2, …. xs are the masses'
 *  displacements in metres, scale px per metre; vertical hangs the chain from the top (or stands it on the bottom with
 *  base). forces: [{ on, F, label }] arrows on masses (F in drawing px, signed). ghost: displacements drawn faint. */
export function massChain({ xs, labels, scale = 400, vertical = false, hang = false, base = null, forces = [], ghost = null, label, show = Infinity, springLabels = [] }) {
  const n = xs.length, gap = 120, box = 56;
  // Lying: along x from the wall at the left. Vertical: along −y from the ground (base) or +y from the ceiling (hang).
  const P = (u, v) => vertical ? (hang ? [W / 2 + v, 30 + u] : [W / 2 + v, H - 20 - u]) : [30 + u, H / 2 + 30 + v];
  const rest = i => 40 + gap * (i + 1) - box / 2 + (vertical ? -28 * (i + 1) : 0);
  const pos = (i, d) => rest(i) + d * scale;
  const wallU = (base ?? 0) * scale;
  const parts = [];
  const [ax, ay] = P(wallU, -40), [bx, by] = P(wallU, 40);
  parts.push(s("line", { x1: ax, y1: ay, x2: bx, y2: by, class: "wall" }));
  if (base !== null) parts.push(arrow(...P(wallU - 1, 50), ...P(wallU + 26, 50), "w(t)", "drive"));
  const body = (d, cls) => {
    const g = [];
    let prev = wallU;
    d.forEach((x, i) => {
      if (i >= show) return;
      const u0 = pos(i, x), [sx1, sy1] = P(prev, -14), [sx2, sy2] = P(u0, -14), [dx1, dy1] = P(prev, 14), [dx2, dy2] = P(u0, 14);
      g.push(spring(sx1, sy1, sx2, sy2), damper(dx1, dy1, dx2, dy2));
      if (springLabels[i]) { const [lx, ly] = P((prev + u0) / 2, -34); g.push(s("text", { x: lx, y: ly, class: "tick", "text-anchor": "middle" }, springLabels[i])); }
      const [x0, y0] = P(u0, -box / 2), [x1, y1] = P(u0 + box, box / 2);
      g.push(s("rect", { x: Math.min(x0, x1), y: Math.min(y0, y1), width: Math.abs(x1 - x0), height: Math.abs(y1 - y0), class: "mass" }));
      const [tx, ty] = P(u0 + box / 2, 0);
      g.push(s("text", { x: tx, y: ty + 5, class: "tick mass-label", "text-anchor": "middle" }, labels[i]));
      prev = u0 + box;
    });
    return s("g", { class: cls }, ...g);
  };
  if (ghost) parts.push(body(ghost, "ghost"));
  parts.push(body(xs, ""));
  for (const f of forces) {
    if (f.on >= show) continue;
    const u0 = pos(f.on, xs[f.on]) + (f.F > 0 ? 56 : 0), [x1, y1] = P(u0, f.off ?? 0), [x2, y2] = P(u0 + f.F, f.off ?? 0);
    parts.push(arrow(x1, y1, x2, y2, f.label, f.cls ?? "force"));
  }
  return svg(label, "mech", ...parts);
}

/** A linkage from a pivot: links [{ angle (from the downward vertical, rad, positive to the right), len (px), kind:
 *  "rod" | "string", bob, label }] each from the end of the one before. base: [dx, dy] px moves the pivot (a block is
 *  drawn there when block is set). ghost: the same links at other angles, faint. extra: more SVG nodes. */
export function linkage({ links, base = [0, 0], block = null, ghost = null, label, trail = null, extra = [], pivot = [W / 2, 40], guide = null }) {
  const [px, py] = [pivot[0] + base[0], pivot[1] + base[1]];
  const chain = (angles, cls) => {
    let x = px, y = py;
    const g = [];
    links.forEach((l, i) => {
      const a = angles[i], x2 = x + l.len * Math.sin(a), y2 = y + l.len * Math.cos(a);
      g.push(s("line", { x1: x, y1: y, x2, y2, class: l.kind === "string" ? "rope" : "rod" }));
      if (l.bob) g.push(s("circle", { cx: x2, cy: y2, r: l.bob, class: "load" }));
      g.push(s("circle", { cx: x, cy: y, r: 4, class: "joint" }));
      x = x2; y = y2;
    });
    return s("g", { class: cls }, ...g);
  };
  const parts = [];
  if (guide === "vertical") parts.push(s("line", { x1: pivot[0] - 40, y1: 10, x2: pivot[0] - 40, y2: H - 10, class: "wall" }), s("line", { x1: pivot[0] + 40, y1: 10, x2: pivot[0] + 40, y2: H - 10, class: "wall" }));
  if (guide === "horizontal") parts.push(s("line", { x1: 10, y1: pivot[1] + 22, x2: W - 10, y2: pivot[1] + 22, class: "wall" }));
  if (!block) parts.push(s("line", { x1: pivot[0] - 50, y1: pivot[1], x2: pivot[0] + 50, y2: pivot[1], class: "wall" }));
  if (trail) parts.push(s("polyline", { class: "trail", fill: "none", points: trail.map(p => p.map(v => v.toFixed(1)).join(",")).join(" ") }));
  parts.push(...extra);
  if (block) parts.push(s("rect", { x: px - 34, y: py - 20, width: 68, height: 40, class: "mass" }),
    s("text", { x: px, y: py - 26, class: "tick", "text-anchor": "middle" }, block));
  if (ghost) parts.push(chain(ghost, "ghost"));
  parts.push(chain(links.map(l => l.angle), ""));
  return svg(label, "mech", ...parts);
}
/** The end points of a linkage's links, px, for trails: same geometry as linkage(). */
export function linkEnds(links, angles, base = [0, 0], pivot = [W / 2, 40]) {
  let x = pivot[0] + base[0], y = pivot[1] + base[1];
  return links.map((l, i) => { x += l.len * Math.sin(angles[i]); y += l.len * Math.cos(angles[i]); return [x, y]; });
}

/** The Simulink model as blocks: per row (one degree of freedom) input → Sum → Gain → Integrator → Integrator → output,
 *  each state fed back through a gain (or an Fcn) to the Sum. rows: [{ input, signs, gain, states: [a, v, x],
 *  ics: [v0, x0], feedback: [{ from: 1 | 2, gain }] }]. show: how many blocks of each row are drawn so far. */
export function blocks(rows, { show = Infinity, label = "The Simulink model as blocks" } = {}) {
  const rowH = rows.length > 1 ? 140 : 200, top = rows.length > 1 ? 18 : 40, parts = [];
  rows.forEach((r, j) => {
    const y = top + j * rowH + 30;
    const items = [
      { x: 6, w: 92, text: r.input, cls: "src" }, { x: 122, w: 40, text: r.signs, cls: "sum" },
      { x: 186, w: 78, text: r.gain, cls: "gain" }, { x: 290, w: 54, text: "1/s", cls: "int", note: `IC ${r.ics[0]}` },
      { x: 386, w: 54, text: "1/s", cls: "int", note: `IC ${r.ics[1]}` }];
    let k = 0;
    const visible = n => k++ < show && n;
    items.forEach((it, i) => {
      if (!visible(true)) return;
      parts.push(s("rect", { x: it.x, y: y - 16, width: it.w, height: 32, rx: it.cls === "sum" ? 16 : 3, class: `blk ${it.cls}` }),
        s("text", { x: it.x + it.w / 2, y: y + 5, class: "tick", "text-anchor": "middle" }, it.text));
      if (it.note) parts.push(s("text", { x: it.x + it.w / 2, y: y - 22, class: "tick small", "text-anchor": "middle" }, it.note));
      if (i > 0) parts.push(arrow(items[i - 1].x + items[i - 1].w, y, it.x, y, "", "wire"));
      if (i >= 2) parts.push(s("text", { x: it.x - 12, y: y - 6, class: "tick small sig", "text-anchor": "middle" }, r.states[i - 2] ?? ""));
    });
    if (k < show) parts.push(arrow(440, y, 500, y, "", "wire"), s("text", { x: 504, y: y - 6, class: "tick small sig", "text-anchor": "end" }, r.states[2]));
    k++;
    r.feedback.forEach((fb, i) => {
      if (k++ >= show) return;
      const fromX = fb.from === 2 ? 470 : 366, yy = y + 34 + i * 26;
      parts.push(s("polyline", { class: "wire-line", fill: "none", points: `${fromX},${y} ${fromX},${yy} ${300},${yy}` }),
        s("rect", { x: 200, y: yy - 11, width: 100, height: 22, rx: 3, class: "blk gain" }),
        s("text", { x: 250, y: yy + 5, class: "tick small", "text-anchor": "middle" }, fb.gain),
        s("polyline", { class: "wire-line", fill: "none", points: `200,${yy} ${142},${yy} ${142},${y + 16}` }));
    });
  });
  return svg(label, "blocks", ...parts);
}
/** How many blocks blocks() can show for these rows, so p in [0, 1] maps onto them. */
export const blockCount = rows => Math.max(...rows.map(r => 6 + r.feedback.length));

/** A series loop: a source and parts [{ kind: "R" | "L" | "C" | "M", name }] round a rectangle, a dot running with the
 *  charge so its speed shows the current. M is a machine (motor or shaker coil) drawn as a circle. */
export function loop({ parts, source = "u", flow = 0, label, values = [] }) {
  const x0 = 70, x1 = W - 70, y0 = 50, y1 = H - 50;
  const path = [[x0, y1], [x0, y0], [x1, y0], [x1, y1], [x0, y1]];
  const seg = path.slice(1).map((q, i) => Math.hypot(q[0] - path[i][0], q[1] - path[i][1])), total = seg.reduce((a, b) => a + b);
  const at = d => { d = ((d % total) + total) % total; let i = 0; while (d > seg[i]) { d -= seg[i]; i++; } const f = d / seg[i]; return [path[i][0] + f * (path[i + 1][0] - path[i][0]), path[i][1] + f * (path[i + 1][1] - path[i][1])]; };
  const out = [s("polyline", { points: path.map(p => p.join(",")).join(" "), class: "wire-line", fill: "none" })];
  out.push(s("circle", { cx: x0, cy: (y0 + y1) / 2, r: 18, class: "src-circle" }), s("text", { x: x0 - 26, y: (y0 + y1) / 2 + 5, class: "tick", "text-anchor": "end" }, source));
  parts.forEach((p, i) => {
    const [x, y] = i < 2 ? [x0 + (x1 - x0) * (i + 1) / 3, y0] : i === 2 ? [x1, (y0 + y1) / 2] : [(x0 + x1) / 2, y1];
    const vert = i === 2;
    const shape = p.kind === "C" ? (vert ? [s("rect", { x: x - 18, y: y - 6, width: 36, height: 12, class: "gapfill" }), s("line", { x1: x - 18, y1: y - 6, x2: x + 18, y2: y - 6 }), s("line", { x1: x - 18, y1: y + 6, x2: x + 18, y2: y + 6 })]
      : [s("rect", { x: x - 6, y: y - 18, width: 12, height: 36, class: "gapfill" }), s("line", { x1: x - 6, y1: y - 18, x2: x - 6, y2: y + 18 }), s("line", { x1: x + 6, y1: y - 18, x2: x + 6, y2: y + 18 })])
      : p.kind === "M" ? [s("circle", { cx: x, cy: y, r: 22, class: "part" })]
      : [s("rect", vert ? { x: x - 10, y: y - 24, width: 20, height: 48, class: p.kind === "L" ? "part filled" : "part" } : { x: x - 24, y: y - 10, width: 48, height: 20, class: p.kind === "L" ? "part filled" : "part" })];
    out.push(s("g", { class: "cpart" }, ...shape), s("text", { x: vert ? x + 30 : x, y: vert ? y + 5 : y - 26, class: "tick", "text-anchor": vert ? "start" : "middle" }, p.name));
    if (values[i] !== undefined) out.push(s("text", { x: vert ? x + 30 : x, y: vert ? y + 24 : y + 36, class: "tick small", "text-anchor": vert ? "start" : "middle" }, values[i]));
  });
  for (let k = 0; k < 6; k++) { const [x, y] = at(flow * 60 + k * total / 6); out.push(s("circle", { cx: x, cy: y, r: 5, class: "electron" })); }
  return svg(label, "schematic", ...out);
}

/** Horizontal bars: [{ name, value, cls }], scaled to the largest |value| (or to max). */
export function bars(items, { label, unit = "", max } = {}) {
  const top = Math.max(1e-12, max ?? Math.max(...items.map(i => Math.abs(i.value)))), rowH = Math.min(46, (H - 20) / items.length);
  return svg(label, "bars", ...items.flatMap((it, i) => {
    const y = 14 + i * rowH, w = Math.min(1, Math.abs(it.value) / top) * (W - 230);
    return [s("text", { x: 150, y: y + rowH / 2 + 4, class: "tick", "text-anchor": "end" }, it.name),
      s("rect", { x: 160, y: y + 6, width: Math.max(1, w), height: rowH - 14, class: `bar ${it.cls ?? ""}` }),
      s("text", { x: 166 + w, y: y + rowH / 2 + 4, class: "tick small" }, `${fmt(it.value, 3)} ${unit}`)];
  }));
}
