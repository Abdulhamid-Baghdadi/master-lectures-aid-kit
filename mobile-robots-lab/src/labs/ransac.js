// RANSAC against least squares (Wöber, MuS 2 Pose estimation, pp. 34–39): a line through points of which a share are
// outliers; least squares over all of them is pulled away, RANSAC fits two points at a time and keeps the line most
// points agree with, then refits it with its inliers.
import { linePoints, fitLine, ransac } from "../core/index.js";
import { h, slider, readout } from "../../../kit/ui/kit.js";
import * as a from "../../../kit/ui/art.js";
import { plane, polyline, dot } from "./draw.js";

export default {
  id: "ransac",
  art: () => a.picture("Points along a line with a few strays, a tilted wrong line and the right line through most points",
    Array.from({ length: 14 }, (_, i) => a.circle(20 + i * 12, 120 - i * 6 + ((i * 7) % 5) - 2, 3, a.INK, 0, a.INK)).join("") +
      [[40, 30], [150, 130], [90, 25], [170, 30]].map(([x, y]) => a.circle(x, y, 3, a.HOT, 0, a.HOT)).join("") +
      a.line([[15, 122], [185, 38]], a.ACC, 3) + a.line([[15, 100], [185, 62]], a.DIM, 2, "5 4")),
  mount(root) {
    let outliers = 0.3, noise = 0.15, tol = 0.3, tau = 0.6, N = 50, seed = 3;
    const box = h("div", {}), rL = readout("Least squares over all points"), rR = readout("RANSAC, refitted on its inliers"), rC = readout("Cycles and inliers");
    const update = () => {
      const pts = linePoints({ n: 40, k: 0.6, d: 1, noise, outliers, seed }), ls = fitLine(pts), r = ransac(pts, { tol, tau, N, seed: seed + 100 });
      const inl = new Set(r.inliers), line = ({ k, d }) => [[0, d], [10, k * 10 + d]];
      box.replaceChildren(plane([-0.3, -1.5, 10.3, 10], "The example points, synthetic: the true line y = 0.6x + 1 with noise and outliers, the least-squares line and the RANSAC line", [
        polyline(line({ k: 0.6, d: 1 }), "faint"), polyline(line(ls), "third"), r.refit ? polyline(line(r.refit), "second") : null,
        ...pts.map(p => dot([p[0], p[1]], inl.has(p) ? "inlier" : "outlier", 3.5))]));
      rL.set(`y = ${ls.k.toFixed(3)}x + ${ls.d.toFixed(3)}`, Math.abs(ls.k - 0.6) > 0.05 ? "warn" : "", "Θ = (XᵀX)⁻¹XᵀY over every point (eq. 15, p. 34); the true line is y = 0.6x + 1");
      rR.set(r.refit ? `y = ${r.refit.k.toFixed(3)}x + ${r.refit.d.toFixed(3)}` : "—", "", "the two-point line with the most points within the tolerance, then least squares on those");
      rC.set(`${r.cycles} of ${N}, ${r.inliers.length} of ${pts.length} points in`, "", r.inliers.length / pts.length > tau ? `stopped early: more than τ = ${tau} of the points agree` : "ran all N cycles: no line reached τ");
    };
    const sl = (label, min, max, v, step, set, f) => slider({ label, min, max, value: v, step, format: f, onInput: x => { set(x); update(); } }).el;
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      sl("Share of outliers", 0, 0.7, outliers, 0.01, v => outliers = v, v => `${Math.round(v * 100)} %`),
      sl("Noise on the inliers σ", 0, 0.5, noise, 0.01, v => noise = v, v => v.toFixed(2)),
      sl("Tolerance ε", 0.05, 1, tol, 0.01, v => tol = v, v => v.toFixed(2)),
      sl("Stop when the inlier share passes τ", 0.3, 0.95, tau, 0.01, v => tau = v, v => v.toFixed(2)),
      sl("Cycles N at most", 1, 200, N, 1, v => N = v, String),
      sl("Data seed", 1, 50, seed, 1, v => seed = v, String),
      rL.el, rR.el, rC.el,
      h("p", { class: "hint" }, "Each cycle draws the fewest points a line needs, two (p. 36), fits them, and counts the points within ε. In pose estimation the same loop draws a few 2D–3D pairs and fits the camera's pose (p. 37). With few cycles or many outliers RANSAC can miss: it need not find a good answer (p. 39). The points and the draws are seeded."))));
    update();
  },
};
