// Linear against nonlinear (Krach 2018, pp. 27–30): the linear spring keeps F = k·u, a nonlinear one does not, and an
// implicit solver then iterates. Here a spring F(u) = k·u + c·u³ is solved for a load by Newton–Raphson in load steps:
// each iteration follows the tangent, the residual shrinks fast near the answer, and a softening spring past its
// peak has no answer at all.
import { newton, springForce } from "../core/index.js";
import { h, slider, readout } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

export default {
  id: "nonlinear",
  art: () => a.picture("A curved force–displacement line with tangent steps of Newton's iteration climbing to the load",
    a.line([[20, 130], [180, 130]], a.DIM, 2) + a.line([[20, 130], [20, 20]], a.DIM, 2) + a.path("M20 130 Q90 110 175 25", a.INK, 3) +
      a.line([[20, 45], [180, 45]], a.ACC, 2, "5 4") + a.line([[20, 130], [128, 45], [128, 72], [158, 45]], a.COOL, 2)),
  mount(root) {
    const p = { k: 100, c: 10, P: 500, steps: 1 };
    const chart = h("div", {}), table = h("div", {}), rU = readout("Displacement u"), rL = readout("Linear answer P/k"), rI = readout("Iterations");
    const update = () => {
      const s = springForce(p.k, p.c), run = newton(p), umax = Math.max(4, Math.abs(run.u) * 1.3, p.P / p.k * 1.1);
      const us = Array.from({ length: 201 }, (_, k) => k * umax / 200);
      // Newton's path: from each iterate on the curve along its tangent to the load level, then up or down to the curve.
      const path = { x: [], y: [] };
      for (const st of run.history) st.iters.forEach((it, i) => {
        if (i > 0) { path.x.push(it.u); path.y.push(st.load); }
        path.x.push(it.u); path.y.push(s.F(it.u));
      });
      chart.replaceChildren(lineChart({ label: "Spring force against displacement with the load and Newton's steps", xLabel: "Displacement u [mm]", yLabel: "Force F [N]", xMin: 0, xMax: umax,
        xFormat: v => v.toFixed(1), yMin: Math.min(0, ...us.map(s.F)),
        lines: [{ x: us, y: us.map(s.F), name: "F(u)" }, { x: us, y: us.map(u => p.k * u), cls: "faint" },
          { x: [0, umax], y: [p.P, p.P], cls: "third", name: "load" },
          { x: path.x, y: path.y, cls: "second", name: "Newton" }],
        marks: run.converged ? [{ x: run.u, y: p.P, shape: "dot" }] : [] }));
      const rows = run.history.flatMap((st, j) => st.iters.map((it, i) => h("tr", {}, h("td", {}, String(j + 1)), h("td", {}, String(i)), h("td", {}, it.u.toFixed(6)), h("td", {}, it.residual.toExponential(2)))));
      table.replaceChildren(h("table", { class: "eqs" }, h("thead", {}, h("tr", {}, h("th", {}, "Step"), h("th", {}, "Iteration"), h("th", {}, "u [mm]"), h("th", {}, "Residual [N]"))), h("tbody", {}, rows)));
      rU.set(run.converged ? `${run.u.toFixed(4)} mm` : "No answer", run.converged ? "" : "danger",
        run.converged ? `F(u) = ${s.F(run.u).toFixed(3)} N` : `step ${run.failedAt} did not converge: a softening spring cannot carry more than its peak force`);
      rL.set(`${(p.P / p.k).toFixed(4)} mm`, "", run.converged ? `${(100 * (p.P / p.k / run.u - 1)).toFixed(1)} % off the nonlinear answer` : "the linear model would answer anyway");
      rI.set(String(run.history.reduce((n, st) => n + st.iters.length - 1, 0)), "", "solves of KT·Δu = P − F(u), over all steps");
    };
    const sl = (name, key, min, max, step, unit) => slider({ label: name, unit, min, max, value: p[key], step, format: v => unit ? `${v} ${unit}` : String(v), onInput: v => { p[key] = v; update(); } }).el;
    root.append(h("div", { class: "stage" }, h("div", {}, chart, table), h("div", { class: "controls" },
      sl("Linear stiffness k", "k", 20, 300, 10, "N/mm"), sl("Cubic term c (− softens, + stiffens)", "c", -2, 20, 0.5, "N/mm³"),
      sl("Load P", "P", 0, 1500, 10, "N"), sl("Load steps", "steps", 1, 10, 1, ""),
      rU.el, rL.el, rI.el,
      h("p", { class: "hint" }, "Nonlinearity comes from the material (plasticity, elastomers), the geometry (large deformations) or contact (p. 30); this spring stands for any of them. The linear answer P/k is a single solve, on the thin dotted line k·u. Newton's method is worked here by hand from its definition: watch the residual square at each iteration once it is close. With c negative the spring softens and has a peak force: ask for more and no load step can converge, the numerical side of a part that buckles or yields. More load steps keep each start close to the answer."))));
    update();
  },
};
