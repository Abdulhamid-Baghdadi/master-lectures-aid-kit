// A task-sheet lab from a spec (tasks 1, 4, 8–13, added 10 Nov 2026): three steps on the lecture's recipe, since the
// sheet gives a figure only. (1) The reading of the figure and T, V, D term by term to the equations, with the Lagrange
// recipe in MATLAB and sympy; (2) the mechanism moving beside its time plot, with the energy it keeps; (3) linearised at
// rest: M, K and the eigenfrequencies. The specs (tasks.js) hold each task's words, symbols and drawing; the models are
// the core's. Every number is an example value, labelled so.
import { h } from "../../../kit/ui/kit.js";
import { stepper, fmt, mtx, grow } from "../../../kit/ui/steps.js";
import { run } from "../core/index.js";
import { reveal, memo, sliders, caption, at } from "./view.js";
import { lagrange, ode, eigKM, assign } from "./matlab.js";
import * as Py from "./python.js";

export const NOTE = "No solution sheet; worked here.";
export const EXAMPLE = "example value — not given on the sheet";

/** A MATLAB statement of a spec's set-up as Python: f = @(x) … becomes a lambda, the rest numpy. */
const toPy = stmt => Py.pyExpr(stmt.replace(/^(\w+) = @\(x\) /, "$1 = lambda x: "));

export function sheetLab(spec) {
  const { id, q } = spec, Tend = spec.T ?? 4;
  const sim = memo(st => run(spec.model(st), spec.x0(st), Tend, Tend * 1500));
  const odeCode = st => {
    const params = spec.params(st), pre = spec.pre ?? [];
    return {
      matlab: [assign(params), ...pre.map(s => `${s};`), `Ms = @(x) ${spec.Ms};   % the mass matrix`,
        ode({ params: [], rows: ["x(3)", "x(4)", `Ms(x) \\ [${spec.rhs.join("; ")}]`], x0: spec.x0(st), T: Tend, plot: `plot(t,x(:,1), t,x(:,2))   % ${q.join(" and ")}` }).replace(/^\n/, "")].join("\n"),
      python: Py.ode({ params, pre: [...pre.map(toPy), `Ms = lambda x: ${Py.pyMatStr(spec.Ms)}   # MATLAB's Ms(x) \\ [...] is np.linalg.solve(Ms(x), [...])`],
        rows: ["x(3)", "x(4)", `*np.linalg.solve(Ms(x), [${spec.rhs.join(", ")}])`], x0: spec.x0(st), T: Tend, plot: `plt.plot(sol.t, sol.y[0], sol.t, sol.y[1])   # ${q.join(" and ")}` }),
    };
  };
  return {
    id,
    art: spec.art,
    mount(root) {
      const st = { ...spec.values };
      const ui = { refresh: () => {} };
      const controls = sliders(st, spec.sliders.map(s => [...s.slice(0, 6), s[6] ?? EXAMPLE]), () => ui.refresh());
      const steps = [
        { name: "Reading the figure, then T, V and D term by term", draw: p => {
          const m = spec.model(st), r0 = spec.rest(st, m), ph = Math.sin(2 * Math.PI * p);
          const s0 = spec.testState(st), L = Py.lagrange({ q, names: spec.names, T: spec.Tq, V: spec.Vq, D: spec.Dq, Q: spec.Qq, check: { values: spec.symValues(st), state: s0 }, simplify: spec.simplify ?? true });
          return {
            figure: [spec.figure(st, [r0[0] + spec.wiggle[0] * ph, r0[1] + spec.wiggle[1] * ph], 0, spec.figLabel), reveal(spec.lines, p)],
            notes: [["Source", NOTE, "", `task sheet p. ${spec.page}: the figure only; coordinates, symbols and numbers chosen here`],
              ["Degrees of freedom", spec.dof[0], "", spec.dof[1]], ...spec.assume.map(a => ["Assumed", a[0], "", a[1]])],
            code: lagrange({ q, names: spec.names, T: spec.Tq, V: spec.Vq, D: spec.Dq, Q: spec.Qq }),
            python: L.code, pyCheck: [L.expr, m.f(0, s0).slice(2), 1e-6],
          };
        } },
        { name: "The motion beside its time plot", draw: p => {
          const m = spec.model(st), r = sim(st), k = at(r, p), r0 = spec.rest(st, m), x = r.x[k];
          const E = r.E ?? [], drift = E.length ? Math.max(...E.map(e => Math.abs(e - E[0]))) : NaN, c = odeCode(st);
          return {
            figure: [spec.figure(st, [x[0], x[1]], r.t[k], spec.runLabel),
              grow({ p, label: `${spec.show[0][1]} and ${spec.show[1][1]}`, xLabel: "t [s]", yLabel: `${spec.show[0][1]}, ${spec.show[1][1]}`,
                lines: spec.show.map(([sc, name], i) => ({ x: r.t, y: r.x.map(v => sc * (v[i] - r0[i])), name, cls: i ? "second" : undefined })) }),
              caption(`Values: ${spec.values.source}. ${NOTE}`)],
            notes: [["Largest change of K + V", Number.isFinite(drift) ? `${fmt(drift, 2)} J` : "—", "", spec.energyNote]],
            code: c.matlab, python: c.python, pyCheck: Py.odeCheck(r),
          };
        } },
        { name: spec.linName ?? "Linearise at rest: M, K and the eigenfrequencies", draw: p => {
          const m = spec.model(st), j = p < 0.5 ? 0 : 1, md = m.modes[j], ph = Math.sin(2 * Math.PI * 3 * ((p % 0.5) * 2)), r0 = spec.rest(st, m);
          const amp = 1 / Math.max(...md.v.map((v, i) => Math.abs(v) * spec.modeW[i]));
          const lp = (spec.linParams ?? spec.params)(st);
          return {
            figure: [spec.figure(st, [r0[0] + amp * md.v[0] * ph, r0[1] + amp * md.v[1] * ph], 0, `Eigenmode ${j + 1} of the linear model`),
              h("div", { class: "mtx-row" }, mtx("M", m.Ml ?? m.M), mtx("K", m.Kl ?? m.K))],
            notes: m.modes.map((d, i) => [`Mode ${i + 1}`, `ω = ${fmt(d.omega)} rad/s, f = ${fmt(d.f)} Hz`, "", `shape ${spec.qNames[1]}/${spec.qNames[0]} = ${d.v[0] === 0 ? "∞ (only " + spec.qNames[1] + " moves)" : fmt(d.v[1])}`]),
            code: eigKM({ params: lp, K: spec.K, M: spec.M }), python: Py.eigKM({ params: lp, K: spec.K, M: spec.M }), pyCheck: ["f0", m.modes.map(d => d.f)],
            hint: spec.linHint,
          };
        } },
      ];
      Object.assign(ui, stepper(root, steps, { controls }));
    },
  };
}
