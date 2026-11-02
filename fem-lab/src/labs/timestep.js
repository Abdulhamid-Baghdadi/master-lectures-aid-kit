// Explicit against implicit time integration (Krach 2020a, pp. 23 and 27; Krach 2018, p. 45): the equation of motion
// Mü + Ku = F(t) stepped through time. An implicit solver solves an equation each step and may take large steps; an
// explicit one only evaluates, cheaply, but needs many small steps: above Δt = 2/ω the central difference blows up.
// One mass on a spring, released from u = 1, against its exact cos ωt.
import { integrate, criticalStep, sdof } from "../core/index.js";
import { h, slider, readout } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

export default {
  id: "timestep",
  art: () => a.picture("A smooth cosine with a growing zigzag beside it, the unstable explicit steps",
    a.path("M15 75 Q40 20 65 75 T115 75 T165 75", a.DIM, 2) + a.line([[15, 75], [35, 45], [55, 100], [75, 30], [95, 120], [115, 20], [135, 135]], a.HOT, 2.5) +
      a.line([[15, 75], [40, 33], [65, 75], [90, 117], [115, 75], [140, 33], [165, 75]], a.ACC, 2.5)),
  mount(root) {
    const p = { m: 1, k: 400, ratio: 0.8, periods: 3 };
    const chart = h("div", {}), rW = readout("Natural frequency and critical step"), rE = readout("Explicit central difference"), rI = readout("Implicit average acceleration");
    const update = () => {
      const { omega, T } = sdof(p.k, p.m), dtc = criticalStep(omega), dt = p.ratio * dtc;
      const steps = Math.ceil(p.periods * T / dt), ts = Array.from({ length: steps + 1 }, (_, k) => k * dt);
      const ex = integrate({ omega, dt, steps, method: "explicit" }), im = integrate({ omega, dt, steps, method: "implicit" });
      const fine = Array.from({ length: 301 }, (_, k) => k * p.periods * T / 300);
      chart.replaceChildren(lineChart({ label: "Displacement over time: exact, explicit and implicit steps", xLabel: "Time t [s]", yLabel: "Displacement u", xMin: 0, xMax: p.periods * T, yMin: -2, yMax: 2,
        xFormat: v => v.toFixed(2), lines: [{ x: fine, y: fine.map(t => Math.cos(omega * t)), name: "exact" },
          { x: ts, y: ex, name: "explicit", cls: "third" }, { x: ts, y: im, name: "implicit", cls: "second" }] }));
      const grow = Math.max(...ex.map(Math.abs)), shrinkI = Math.max(...im.slice(-Math.ceil(T / dt)).map(Math.abs));
      rW.set(`ω = ${omega.toFixed(2)} s⁻¹, Δt crit = ${(dtc * 1000).toFixed(2)} ms`, "", `Δt = ${(dt * 1000).toFixed(2)} ms, ${steps} steps for ${p.periods} periods`);
      rE.set(grow > 1.5 ? `Unstable: grows to ${grow.toExponential(1)}` : `Stable, largest |u| ${grow.toFixed(3)}`, grow > 1.5 ? "danger" : "", "one evaluation per step, no equation to solve");
      rI.set(`Stable, last period's largest |u| ${shrinkI.toFixed(3)}`, "", "keeps the amplitude at any step, but the period stretches as Δt grows");
    };
    const sl = (name, key, min, max, step, unit, fmt) => slider({ label: name, unit, min, max, value: p[key], step, format: fmt ?? (v => unit ? `${v} ${unit}` : String(v)), onInput: v => { p[key] = v; update(); } }).el;
    root.append(h("div", { class: "stage" }, chart, h("div", { class: "controls" },
      sl("Time step Δt / Δt crit", "ratio", 0.1, 1.3, 0.01, "", v => v.toFixed(2)),
      sl("Stiffness k", "k", 50, 2000, 50, "N/m"), sl("Mass m", "m", 0.1, 5, 0.1, "kg"), sl("Periods shown", "periods", 1, 6, 1, ""),
      rW.el, rE.el, rI.el,
      h("p", { class: "hint" }, "Move the step past 1.00 and the explicit answer explodes within a few periods; the implicit one stays bounded at any step. That is why explicit solvers need a high number of time increments, and implicit ones solve with the stiffness matrix at each step (Krach 2020a, p. 23). A finer mesh has stiffer, lighter elements and so a higher highest ω: its explicit step must shrink too. The rules and their stability limit Δt = 2/ω are worked here by hand; the course names the two kinds of solver."))));
    update();
  },
};
