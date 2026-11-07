// Beispiel 22: the crane trolley. Step 1 linearises the swing at φ = 0 into A, b, cᵀ; step 2 pushes the trolley and
// runs the nonlinear and the linear model side by side, drawn to scale.
import { h, slider } from "../../../kit/ui/kit.js";
import * as a from "../../../kit/ui/art.js";
import { crane, simulate, matVec, poles } from "../core/index.js";
import { stepper, fmt, fmtC } from "./view.js";
import { craneSvg, grow, mtx } from "./pics.js";
import { num } from "./matlab.js";

/** The trolley pushed by Fa for the first second, then left to roll: the nonlinear and the linear model. */
function push(cr, F, T = 8) {
  const u = t => (t < 1 ? F : 0);
  const nl = simulate((t, x) => cr.f(x, u(t)), [0, 0, 0, 0], T, 400);
  const li = simulate((t, x) => matVec(cr.A, x).map((v, i) => v + cr.b[i] * u(t)), [0, 0, 0, 0], T, 400);
  return { t: nl.t, nl: nl.x, li: li.x };
}
const code = (mL, F) => `mK = 20; mL = ${num(mL)}; l = 4.0; g = 9.8065;   % mL is not given in Beispiel 22\nA = [0 1 0 0; -g*(mK+mL)/(mK*l) 0 0 0; 0 0 0 1; mL*g/mK 0 0 0];\nb = [0; -1/(mK*l); 0; 1/mK];\ncT = [0 0 1 0];   % x = [phi; omega; x; v]\nd = 0;\nSYS = ss(A,b,cT,d);\nt = linspace(0,8,401)';\nFa = ${num(F)}*(t < 1);\n[y,t,x] = lsim(SYS, Fa, t);`;

export default {
  id: "crane",
  art: () => a.picture("A trolley on a rail with a load hanging from a rope, swung out to one side",
    a.line([[10, 40], [190, 40]], a.INK, 2) + a.rect(70, 25, 40, 18, a.INK, 3) + a.line([[90, 43], [120, 120]], a.ACC, 2) + a.circle(120, 125, 8, a.ACC, 3, a.ACC)),
  mount(root) {
    let mL = 100, F = 200;
    const sm = slider({ label: "Load mass mL (not given: example value)", unit: "kg", min: 10, max: 300, step: 5, value: mL, format: v => `${fmt(v)} kg`, onInput: v => { mL = v; ui.refresh(); } });
    const sf = slider({ label: "Push Fa for 1 s", unit: "N", min: 20, max: 1000, step: 10, value: F, format: v => `${fmt(v)} N`, onInput: v => { F = v; ui.refresh(); } });
    const steps = [
      { name: "Linearise at φ = 0", draw: p => {
        const cr = crane({ mK: 20, mL, l: 4.0 });
        return {
          figure: [craneSvg({ x: 1.5, phi: 0.35 * Math.sin(p * 2 * Math.PI) * (1 - p), l: 4, track: [0, 4], label: "The trolley and its load swinging about φ = 0" }),
            h("div", { class: "mtx-row" }, mtx("A", cr.A, { cells: Math.floor(p * 17) }), mtx("b", cr.b, { cells: p >= 1 ? 4 : 0 }), mtx("cᵀ", cr.c, { row: true, cells: p >= 1 ? 4 : 0 }))],
          notes: [["Nonlinear", "ω̇ = −(g/l)·sin φ − (v̇/l)·cos φ", "", "v̇ = [Fa + mL·g·sin φ·cos φ + mL·l·ω²·sin φ]/(mK + mL·sin² φ), by Lagrange (worked here)"],
            ["At φ = 0", "sin φ → φ, cos φ → 1, ω² → 0", "", "v̇ = (mL·g·φ + Fa)/mK, ω̇ = −g(mK + mL)/(mK·l)·φ − Fa/(mK·l)"], ["Open-loop poles", poles(cr.A).map(fmtC).join(", "), "warn", "a free swing and a double pole at 0: the trolley rolls on"]],
          sheet: [{ source: "M, pp. 53–54", sheet: "a21 = −g(mK + mL)/(mK·l), a41 = mL·g/mK, b = [0; −1/(mK·l); 0; 1/mK]", lab: `a21 = ${fmt(cr.A[1][0])}, a41 = ${fmt(cr.A[3][0])}`, agree: true },
            { source: "M, p. 53", sheet: "v̇ with −mL·ω²·l·sin φ", lab: "+mL·l·ω²·sin φ by Lagrange; the term drops out at φ = 0", agree: false }],
          code: code(mL, F), hint: "Beispiel 22 gives mK = 20 kg and l = 4.0 m but no load mass: the lab lets you choose one.",
        };
      } },
      { name: "Push the trolley", draw: p => {
        const cr = crane({ mK: 20, mL, l: 4.0 }), r = push(cr, F), k = Math.min(400, Math.floor(p * 400));
        const xs = [...r.nl, ...r.li].map(x => x[2]), track = [Math.min(0, ...xs) - 0.5, Math.max(4, ...xs) + 0.5];
        return {
          figure: [craneSvg({ x: r.nl[k][2], phi: r.nl[k][0], ghost: { x: r.li[k][2], phi: r.li[k][0] }, l: 4, track, force: r.t[k] < 1 ? F : 0,
            label: "Trolley and load by the nonlinear model, the linear model's faint behind it" }),
            grow({ p, label: "Swing angle φ of both models", xLabel: "t [s]", yLabel: "φ [°]",
              lines: [{ x: r.t, y: r.nl.map(x => x[0] * 180 / Math.PI), name: "nonlinear" }, { x: r.t, y: r.li.map(x => x[0] * 180 / Math.PI), name: "linear", cls: "second" }] })],
          notes: [["Largest swing", `${fmt(Math.max(...r.nl.map(x => Math.abs(x[0]))) * 180 / Math.PI, 3)}°`, "", "the models part when the swing is no longer small"]],
          code: `${code(mL, F)}\nplot(t, x(:,1)*180/pi)`,
        };
      } },
    ];
    const ui = stepper(root, steps, { controls: [sm, sf] });
  },
};
