// Shared by the four-bar labs: the link-length sliders and the drawing of one state with the path of B. Each lab adds
// its own readouts and chart.
import { fourBar, deg, rad } from "../core/index.js";
import { slider } from "../../../kit/ui/kit.js";
import { view, link, ground, joint, trace, label, ring, dot } from "./draw.js";

/** Sliders for the frame a, crank r, coupler l and rocker c (mm) and the crank angle φ; onChange after each move. */
export function lengthSliders(dims, onChange, { angle = true } = {}) {
  const mm = (name, key, min, max) => slider({ label: name, unit: "mm", min, max, value: dims[key], step: 1, format: v => `${v.toFixed(0)} mm`, onInput: v => { dims[key] = v; onChange(); } });
  const list = [mm("Frame a = A0B0", "a", 40, 160), mm("Crank r = A0A", "r", 10, 120), mm("Coupler l = AB", "l", 10, 160), mm("Rocker c = B0B", "c", 10, 160)];
  if (angle) list.push(slider({ label: "Crank angle φ", unit: "°", min: 0, max: 360, value: deg(dims.phi), step: 1, format: v => `${v.toFixed(0)}°`, onInput: v => { dims.phi = rad(v); onChange(); } }));
  return list;
}

/** Where B travels over a whole turn of the crank, as runs of reachable positions. */
export function path(dims, branch = 1, point = "B") {
  const runs = [[]];
  for (let i = 0; i <= 360; i++) {
    const s = fourBar(dims, rad(i), branch);
    if (s) runs.at(-1).push(s[point]); else if (runs.at(-1).length) runs.push([]);
  }
  return runs.filter(r => r.length > 1);
}

/** The four-bar at its crank angle, or a note where it cannot close. */
export function drawing(dims, extra = [], branch = 1) {
  const s = fourBar(dims, dims.phi, branch), R = Math.max(dims.a, dims.r + dims.l, dims.c) + 20;
  const box = [-dims.r - 20, -R * 0.75, dims.a + dims.c + 20, R * 0.95];
  const common = [ring([0, 0], dims.r), path(dims, branch).map(run => trace(run, "faint"))];
  if (!s) return { s, svg: view(box, "The chain cannot close at this crank angle", [...common, ground([0, 0]), ground([dims.a, 0]),
    label([0, 0], "cannot close here: the crank cannot reach", 10, -14)]) };
  return { s, svg: view(box, `Four-bar at φ = ${deg(dims.phi).toFixed(0)}°: rocker at ${deg(s.psi).toFixed(0)}°, transmission angle ${deg(s.mu).toFixed(0)}°`, [
    ...common, link([[0, 0], [dims.a, 0]], "faint"), link([s.A0, s.A, s.B, s.B0]), ...extra.map(f => f(s)),
    joint(s.A), joint(s.B), ground(s.A0), ground(s.B0), label(s.A0, "A0", -26, 20), label(s.B0, "B0", 8, 20), label(s.A, "A"), label(s.B, "B"), dot(s.B, "second")]) };
}
