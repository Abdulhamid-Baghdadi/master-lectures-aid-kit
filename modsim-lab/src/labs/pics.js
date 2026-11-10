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

// ---- The task-sheet drawings added on 10 Nov 2026 (tasks 1, 4, 8, 9–12): each draws its mechanism at a state.
/** A spring and a damper side by side from (x1, y1) to (x2, y2), off px either side of the line. */
function pair(x1, y1, x2, y2, off = 10) {
  const L = Math.hypot(x2 - x1, y2 - y1) || 1, nx = -(y2 - y1) / L * off, ny = (x2 - x1) / L * off;
  return [spring(x1 + nx, y1 + ny, x2 + nx, y2 + ny, 6, 6), damper(x1 - nx, y1 - ny, x2 - nx, y2 - ny)];
}
const text = (x, y, t, anchor = "middle") => s("text", { x, y, class: "tick", "text-anchor": anchor }, t);
const disc = (cx, cy, r, ang, name) => [s("circle", { cx, cy, r, class: "mass" }),
  s("line", { x1: cx, y1: cy, x2: cx + r * Math.sin(ang), y2: cy - r * Math.cos(ang), class: "rod" }), s("circle", { cx, cy, r: 3, class: "joint" }), text(cx, cy - r - 8, name)];

/** Task 1: the block at distance r (px) from the pivot on its spring and damper, turned with the rod by φ. */
export function elasticFig({ r, phi, label }) {
  const px = W / 2, py = 24, ex = px + r * Math.sin(phi), ey = py + r * Math.cos(phi), d = (phi * 180) / Math.PI;
  const tx = px + (r - 18) * Math.sin(phi), ty = py + (r - 18) * Math.cos(phi);
  return svg(label, "mech", s("line", { x1: px - 50, y1: py, x2: px + 50, y2: py, class: "wall" }), ...pair(px, py, tx, ty, 8),
    s("rect", { x: ex - 26, y: ey - 18, width: 52, height: 36, class: "mass", transform: `rotate(${(-d).toFixed(2)} ${ex.toFixed(1)} ${ey.toFixed(1)})` }),
    text(ex, ey + 5, "m₁"), s("circle", { cx: px, cy: py, r: 4, class: "joint" }));
}

/** Task 4: m1 and m2 in a vertical guide on two spring–damper pairs, the rod with m4 turning on m1 at angle β. */
export function unbalanceFig({ y1, y2, beta, scale = 2000, label }) {
  const cx = W / 2, ground = H - 14, u1 = ground - 70 - y1 * scale, u2 = u1 - 110 - (y2 - y1) * scale;
  const rx = cx + 46 * Math.sin(beta), ry = u1 + 46 * Math.cos(beta);
  return svg(label, "mech", s("line", { x1: cx - 90, y1: 10, x2: cx - 90, y2: ground, class: "wall" }), s("line", { x1: cx + 90, y1: 10, x2: cx + 90, y2: ground, class: "wall" }),
    s("line", { x1: cx - 90, y1: ground, x2: cx + 90, y2: ground, class: "wall" }), ...pair(cx, ground, cx, u1 + 22, 22), ...pair(cx, u1 - 22, cx, u2 + 22, 22),
    s("rect", { x: cx - 60, y: u1 - 22, width: 120, height: 44, class: "mass" }), text(cx - 70, u1 + 5, "m₁", "end"),
    s("rect", { x: cx - 50, y: u2 - 22, width: 100, height: 44, class: "mass" }), text(cx, u2 + 5, "m₂"),
    s("line", { x1: cx, y1: u1, x2: rx, y2: ry, class: "rod" }), s("circle", { cx: rx, cy: ry, r: 7, class: "load" }), s("circle", { cx, cy: u1, r: 3, class: "joint" }));
}

/** Task 8: two pendulums (rods of length 2l px) b px apart, the spring and damper between the points l down each rod. */
export function coupledFig({ p1, p2, l = 70, b = 150, label }) {
  const ax = W / 2 - b / 2, bx = W / 2 + b / 2, y = 24, P = (x, p, d) => [x + d * Math.sin(p), y + d * Math.cos(p)];
  const [s1x, s1y] = P(ax, p1, l), [s2x, s2y] = P(bx, p2, l), [e1x, e1y] = P(ax, p1, 2 * l), [e2x, e2y] = P(bx, p2, 2 * l);
  return svg(label, "mech", s("line", { x1: ax - 50, y1: y, x2: bx + 50, y2: y, class: "wall" }),
    s("line", { x1: ax, y1: y, x2: e1x, y2: e1y, class: "rod" }), s("line", { x1: bx, y1: y, x2: e2x, y2: e2y, class: "rod" }), ...pair(s1x, s1y, s2x, s2y, 7),
    s("circle", { cx: e1x, cy: e1y, r: 11, class: "load" }), s("circle", { cx: e2x, cy: e2y, r: 11, class: "load" }),
    text(e1x, e1y + 30, "m₃"), text(e2x, e2y + 30, "m₄"), s("circle", { cx: ax, cy: y, r: 4, class: "joint" }), s("circle", { cx: bx, cy: y, r: 4, class: "joint" }));
}

/** Tasks 9–12: discs rolling on the floor from a wall, the wall spring at the axle or the top of disc 1; xs in px;
 *  radii in px; pend: { l, phi } hangs a pendulum from disc 1's axle (tasks 11, 12). */
export function discsFig({ xs, radii, top = false, pend = null, label }) {
  const floor = pend ? 120 : H - 60, wall = 24, gap = 150;
  const cx = xs.map((x, i) => wall + 90 + gap * i + x), cy = radii.map(r => floor - r);
  const parts = [s("line", { x1: wall, y1: 10, x2: wall, y2: floor, class: "wall" }), s("line", { x1: wall, y1: floor, x2: W - 10, y2: floor, class: "wall" })];
  const ay = top ? cy[0] - radii[0] : cy[0], ax = cx[0];
  parts.push(...pair(wall, ay, ax, ay, 7));
  if (cx.length > 1) parts.push(...pair(cx[0] + radii[0], cy[0], cx[1] - radii[1], cy[1], 7));
  cx.forEach((x, i) => parts.push(...disc(x, cy[i], radii[i], xs[i] / radii[i], `m${"₁₂"[i]}`)));
  if (pend) {
    const ex = cx[0] + pend.l * Math.sin(pend.phi), ey = cy[0] + pend.l * Math.cos(pend.phi);
    parts.push(s("line", { x1: cx[0], y1: cy[0], x2: ex, y2: ey, class: "rod" }), s("circle", { cx: ex, cy: ey, r: 10, class: "load" }), text(ex + 18, ey + 5, "m₂", "start"));
  }
  return svg(label, "mech", ...parts);
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
