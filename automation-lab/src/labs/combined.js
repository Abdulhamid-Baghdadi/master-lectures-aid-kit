// Beispiel 19: controller, prefilter and Luenberger observer for System A. Step 1 places the controller poles in the
// RNF, step 2 the observer poles in the BNF, step 3 closes the loop of order 2n and shows the separation of the poles,
// step 4 runs it from a wrong first estimate.
import { h, slider } from "../../../kit/ui/kit.js";
import * as a from "../../../kit/ui/art.js";
import { poles, placeByRnf, observeByBnf, prefilter, withObserver, closedLoop, runLoop, stepinfo } from "../core/index.js";
import { stepper, fmt, fmtC, fmtVec, same } from "./view.js";
import { splane, grow, mtx } from "./pics.js";
import { SISO } from "./systems.js";
import { model, placement, observer, placementRnf, observerBnf } from "./matlab.js";
import * as Py from "./python.js";

const S = SISO.A, SRC = "S1, pp. 24–25";

export default {
  id: "combined",
  art: () => a.picture("Controller poles as crosses and faster observer poles as rings further left in the s-plane",
    a.line([[150, 10], [150, 140]], a.DIM, 1) + a.line([[10, 75], [190, 75]], a.DIM, 1) + a.text(120, 62, "×", 18, a.ACC) + a.text(120, 98, "×", 18, a.ACC) +
    a.circle(55, 50, 7, a.COOL, 2) + a.circle(55, 100, 7, a.COOL, 2)),
  mount(root) {
    const c = { s: -3, w: 1 }, o = { s: -6, w: 2 };
    const ctl = () => [[c.s, c.w], [c.s, -c.w]], obs = () => [[o.s, o.w], [o.s, -o.w]];
    const sl = (label, obj, k, min, max) => slider({ label, min, max, step: 0.1, value: obj[k], format: v => fmt(v), onInput: v => { obj[k] = v; ui.refresh(); } });
    const design = () => {
      const pr = placeByRnf(S.A, S.b, S.c, ctl()), ob = observeByBnf(S.A, S.b, S.c, obs()), Kf = prefilter(S.A, S.b, S.c, pr.r);
      return { pr, ob, Kf };
    };
    const code = () => `${model(S)}\n${placement(ctl())}\n${observer(obs(), 2)}`;
    const pyCode = () => `${Py.model(S)}\n${Py.placement(ctl())}\n${Py.observer(obs(), 2)}`;
    const steps = [
      { name: "Controller in the RNF", draw: p => {
        const { pr, Kf } = design(), k = Math.floor(p * 3);
        return {
          figure: [splane(poles(closedLoop(S.A, S.b, pr.r)), { label: "The controller's poles" }),
            h("div", { class: "mtx-row" }, mtx("a", pr.a, { row: true, cells: k >= 0 ? 9 : 0 }), mtx("p", pr.p, { row: true, cells: k >= 1 ? 9 : 0 }), mtx("rᵀ_RNF", pr.rRnf, { row: true, cells: k >= 2 ? 9 : 0 }))],
          notes: [["rᵀ in the plant's states", fmtVec(pr.r)], ["Kf", fmt(Kf)]],
          sheet: [{ source: SRC, sheet: "rᵀ_RNF = (39 14)", lab: fmtVec(pr.rRnf), agree: same(pr.rRnf, [39, 14]) },
            { source: SRC, sheet: "Gf = −10/13", lab: fmt(Kf), agree: Math.abs(Kf + 10 / 13) < 1e-9 }],
          code: `${model(S)}\n${placementRnf(pr.a, pr.p)}\nKf = inv(cT*inv(-A+b*rT)*b);`,
          python: `${Py.model(S)}\n${Py.placementRnf(pr.a, pr.p)}\n${Py.prefilterOnly}\nprint(rT, Kf)`, pyCheck: [["rT", [pr.r]], ["Kf", [[Kf]]]],
        };
      } },
      { name: "Observer in the BNF", draw: p => {
        const { ob } = design(), k = Math.floor(p * 3);
        return {
          figure: [splane(poles(closedLoop(S.A, S.b, design().pr.r)), { second: obs(), label: "Controller poles (crosses) and observer poles (rings)" }),
            h("div", { class: "mtx-row" }, mtx("a", ob.a, { row: true, cells: k >= 0 ? 9 : 0 }), mtx("p", ob.p, { row: true, cells: k >= 1 ? 9 : 0 }), mtx("ℓ_BNF", ob.lBnf, { cells: k >= 2 ? 9 : 0 }))],
          notes: [["ℓ in the plant's states", fmtVec(ob.l)], ["Observer faster?", o.s < c.s ? "yes" : "no", o.s < c.s ? "" : "warn", "its poles should lie left of the controller's, but not too far (slides p. 26)"]],
          sheet: [{ source: SRC, sheet: "ℓ_BNF = (69; 20)", lab: fmtVec(ob.lBnf), agree: same(ob.lBnf, [69, 20]) }],
          code: `${model(S)}\n${observerBnf(ob.a, ob.p)}`, python: `${Py.model(S)}\n${Py.observerBnf(ob.a, ob.p)}\nprint(l)`, pyCheck: ["l", ob.l.map(v => [v])],
        };
      } },
      { name: "Close the loop", draw: p => {
        const { pr, ob, Kf } = design(), M = withObserver(S, pr.r, ob.l, Kf), all = poles(M.A);
        const run = runLoop(S, { r: pr.r, Kf, l: ob.l, T: 4, n: 400 }), info = stepinfo(run.t, run.v, 1);
        return {
          figure: [splane(all, { label: "The poles of the loop of order 4: the controller's and the observer's together" }),
            grow({ p, label: "Step response of the loop with observer", xLabel: "t [s]", yLabel: "v", lines: [{ x: run.t, y: run.v, name: "v" }] })],
          notes: [["Poles of the 4 × 4 loop", all.map(fmtC).join(", "), "", "the separation theorem: controller and observer poles side by side (slides p. 25)"],
            ["Settling time (2 %)", `${fmt(info.SettlingTime, 3)} s`]],
          code: code(), python: `${pyCode()}\nprint(np.linalg.eigvals(Arb))`, pyCheck: [Py.PY_POLES("Arb"), Py.polesKey(all), 1e-5], hint: "From rest, x̂ = x all the time: the observer is not seen in the step response.",
        };
      } },
      { name: "Start with a wrong estimate", draw: p => {
        const { pr, ob, Kf } = design(), run = runLoop(S, { r: pr.r, Kf, l: ob.l, T: 4, n: 400, x0: [0.3, -0.2] });
        return {
          figure: grow({ p, label: "x1 and its estimate in the closed loop, the plant starting at x0 = (0.3, −0.2), the observer at 0", xLabel: "t [s]", yLabel: "x1, x̂1",
            lines: [{ x: run.t, y: run.x.map(x => x[0]), name: "x1" }, { x: run.t, y: run.xhat.map(x => x[0]), name: "x̂1", cls: "second" }] }),
          notes: [["Error poles", obs().map(fmtC).join(", ")]],
          python: `${pyCode()}\nt = np.linspace(0, 4, 401)\ny, t, x = lsim(SYSrb, np.ones(len(t)), t, [0.3, -0.2, 0, 0])   # X0: x first, then the estimate`,
          pyCheck: ["x[-1, [0, 2]]", [run.x.at(-1)[0], run.xhat.at(-1)[0]], 1e-4],
          code: `${code()}\nt = linspace(0,4,401);\n[y,t,x] = lsim(SYSrb, ones(size(t)), t, [0.3; -0.2; 0; 0]);\nplot(t, x(:,1), t, x(:,3))`,
          hint: "lsim's fourth argument is the start state of all four states: x first, then x̂.",
        };
      } },
    ];
    const ui = stepper(root, steps, { controls: [sl("Controller σ", c, "s", -10, -0.5), sl("Controller ω", c, "w", 0, 6), sl("Observer σ", o, "s", -20, -0.5), sl("Observer ω", o, "w", 0, 8)] });
  },
};
