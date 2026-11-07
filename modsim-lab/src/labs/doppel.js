// VO example 6, the Doppelpendel (pp. 32–40): K and V of two equal rods built term by term, two runs a thousandth of a
// radian apart parting into chaos, the energy the undamped run keeps, and the linear eigenmodes.
import { h } from "../../../kit/ui/kit.js";
import * as a from "../../../kit/ui/art.js";
import { stepper, fmt, mtx, grow } from "../../../kit/ui/steps.js";
import { doppel, run, VALUES } from "../core/index.js";
import { linkage, linkEnds, bars } from "./pics.js";
import { reveal, memo, sliders, caption, at, deg, rad } from "./view.js";
import { lagrange, eigKM, assign, num, vec } from "./matlab.js";
import * as Py from "./python.js";
const pyOde = ["kap = 2*k_D/(m*L_1**2)", "gam = 2*c_D/(m*L_1**2)",
  "f = lambda t, x: [x[2], x[3], *np.linalg.solve(np.array([[8/3, np.cos(x[1]-x[0])], [np.cos(x[1]-x[0]), 2/3]]),   # MATLAB's \\ is np.linalg.solve",
  "    [x[3]**2*np.sin(x[1]-x[0]) - 3*g/L_1*np.sin(x[0]) + kap*(x[1]-x[0]) + gam*(x[3]-x[2]),",
  "     -x[2]**2*np.sin(x[1]-x[0]) - g/L_1*np.sin(x[1]) - kap*(x[1]-x[0]) - gam*(x[3]-x[2])])]"].join("\n");

const T = 15, N = 7500; // RK4 at 2 ms
const runs = memo(v => {
  const d = doppel(v), x0 = [rad(v.phi1), rad(v.phi2), 0, 0];
  return { a: run(d, x0, T, N), b: run(d, [x0[0] + 1e-3, x0[1], 0, 0], T, N) };
});
const LINKS = [{ len: 70, kind: "rod" }, { len: 70, kind: "rod", bob: 0 }];
const PIVOT = [260, 150]; // the middle: the rods can swing over the top
const odeRows = "f = @(t,x) [x(3:4); [8/3 cos(x(2)-x(1)); cos(x(2)-x(1)) 2/3] \\ ...\n    [x(4)^2*sin(x(2)-x(1)) - 3*g/L_1*sin(x(1)) + kap*(x(2)-x(1)) + gam*(x(4)-x(3)); ...\n     -x(3)^2*sin(x(2)-x(1)) - g/L_1*sin(x(2)) - kap*(x(2)-x(1)) - gam*(x(4)-x(3))]];";

export default {
  id: "doppel",
  art: () => a.picture("A double pendulum: two rods hinged end to end, the second bent against the first, with a looping trace",
    a.line([[60, 20], [140, 20]], a.INK, 3) + a.line([[100, 20], [140, 70]], a.INK, 4) + a.line([[140, 70], [110, 120]], a.INK, 4)
    + a.path("M110 120 C60 140 40 90 80 100 S170 140 150 90", a.ACC, 2)),
  mount(root) {
    const st = { ...VALUES.doppel };
    const ui = { refresh: () => {} };
    const controls = sliders(st, [["phi1", "Start angle φ₁(0)", 0, 179, 1, "°"], ["phi2", "Start angle φ₂(0)", -179, 179, 1, "°"],
      ["L1", "Rod length L₁", 0.3, 2, 0.05, "m"], ["kD", "Torsion spring k_D at A", 0, 20, 0.5, "N·m/rad"], ["cD", "Torsion damper c_D at A", 0, 2, 0.05, "N·m·s/rad"]], () => ui.refresh());
    const steps = [
      { name: "Lagrange: K and V term by term", draw: p => ({
        figure: [linkage({ pivot: PIVOT, links: LINKS.map((l, i) => ({ ...l, angle: [0.6, 1.1][i] * Math.sin(2 * Math.PI * p) })), label: "Two equal rods m, L₁ hinged at O and at A, angles φ₁ and φ₂ from the vertical" }),
          reveal(["r_S2 = (L₁ sin φ₁ + ½L₁ sin φ₂, L₁ cos φ₁ + ½L₁ cos φ₂)", "v_S2² = L₁²[φ̇₁² + ¼φ̇₂² + φ̇₁φ̇₂ cos(φ₂ − φ₁)]",
            "K = ½[(mL₁²/3)φ̇₁² + m v_S2² + (mL₁²/12)φ̇₂²] = (mL₁²/6)[4φ̇₁² + φ̇₂² + 3φ̇₁φ̇₂ cos(φ₂ − φ₁)]",
            "V_g = −(mgL₁/2) cos φ₁ − mgL₁[cos φ₁ + ½ cos φ₂]", "V_F = ½k_D(φ₂ − φ₁)²,  D = ½c_D(φ̇₂ − φ̇₁)²",
            "(8/3)φ̈₁ + φ̈₂ cos(φ₂−φ₁) − φ̇₂² sin(φ₂−φ₁) + 3(g/L₁) sin φ₁ − κ(φ₂−φ₁) − γ(φ̇₂−φ̇₁) = 0",
            "(2/3)φ̈₂ + φ̈₁ cos(φ₂−φ₁) + φ̇₁² sin(φ₂−φ₁) + (g/L₁) sin φ₂ + κ(φ₂−φ₁) + γ(φ̇₂−φ̇₁) = 0,  κ = 2k_D/(mL₁²), γ = 2c_D/(mL₁²)"], p)],
        sheet: [{ source: "VO p. 33 and p. 38", sheet: "(8/3)φ̈₁ + φ̈₂ cos(φ₂−φ₁) − φ̇₂² sin(φ₂−φ₁) + 3(g/L₁) sin φ₁ = 0 (and the second)", lab: "the same without spring and damper", agree: true },
          { source: "VO p. 37", sheet: "L = … + ½k_D(φ₂ − φ₁)²", lab: "L = K − (V_g + V_F): −½k_D(φ₂ − φ₁)²", agree: false },
          { source: "VO p. 38", sheet: "k_D, c_D added unscaled to equations divided by mL₁²/2", lab: "κ = 2k_D/(mL₁²), γ = 2c_D/(mL₁²)", agree: false }],
        code: lagrange({ q: ["phi1", "phi2"], names: ["m", "L_1", "g", "k_D", "c_D"],
          T: "m*L_1^2/6*(4*diff(phi1,t)^2 + diff(phi2,t)^2 + 3*diff(phi1,t)*diff(phi2,t)*cos(phi2-phi1))",
          V: "-m*g*L_1/2*cos(phi1) - m*g*L_1*(cos(phi1) + cos(phi2)/2) + 1/2*k_D*(phi2-phi1)^2",
          D: "1/2*c_D*(diff(phi2,t)-diff(phi1,t))^2", Q: ["0", "0"] }),
        ...(() => { const st0 = [0.3, -0.2, 0.5, 0.1], L = Py.lagrange({ q: ["phi1", "phi2"], names: ["m", "L_1", "g", "k_D", "c_D"], T: "m*L_1^2/6*(4*diff(phi1,t)^2 + diff(phi2,t)^2 + 3*diff(phi1,t)*diff(phi2,t)*cos(phi2-phi1))", V: "-m*g*L_1/2*cos(phi1) - m*g*L_1*(cos(phi1) + cos(phi2)/2) + 1/2*k_D*(phi2-phi1)^2", D: "1/2*c_D*(diff(phi2,t)-diff(phi1,t))^2", Q: ["0", "0"], check: { values: { m: st.m, L_1: st.L1, g: 9.80665, k_D: st.kD, c_D: st.cD }, state: st0 } }), n = st0.length / 2; return { python: L.code, pyCheck: [L.expr, doppel(st).f(0, st0).slice(n), 1e-9] }; })(),
      }) },
      { name: "Chaos: two runs 0.001 rad apart", draw: p => {
        const r = runs(st), k = at(r.a, p), from = Math.max(0, k - 400);
        const trail = r.a.x.slice(from, k + 1).map(x => linkEnds(LINKS, [x[0], x[1]], [0, 0], PIVOT)[1]);
        const gap = r.a.x.map((x, i) => deg(Math.abs(x[1] - r.b.x[i][1])));
        const split = r.a.t[gap.findIndex(v => v > 10)] ?? NaN;
        return {
          figure: [linkage({ pivot: PIVOT, links: LINKS.map((l, i) => ({ ...l, angle: r.a.x[k][i] })), ghost: [r.b.x[k][0], r.b.x[k][1]], trail, label: "The double pendulum and its twin started 0.001 rad away, faint; the tip's recent path" }),
            grow({ p, label: "Angle φ₂ of both runs", xLabel: "t [s]", yLabel: "φ₂ [°]",
              lines: [{ x: r.a.t, y: r.a.x.map(x => deg(x[1])), name: "run" }, { x: r.b.t, y: r.b.x.map(x => deg(x[1])), name: "+0.001 rad", cls: "second" }] }),
            caption("Example values. Fixed-step Runge–Kutta (2 ms): the same runs on every visit.")],
          notes: [["Runs part by 10°", Number.isFinite(split) ? `after ${fmt(split, 3)} s` : `not within ${T} s`, "", "a thousandth of a radian grows until the runs have nothing in common"]],
          code: [assign([["m", st.m, "kg"], ["L_1", st.L1, "m"], ["g", 9.80665], ["k_D", st.kD], ["c_D", st.cD]]), "kap = 2*k_D/(m*L_1^2); gam = 2*c_D/(m*L_1^2);",
            odeRows,
            `[t,x] = ode45(f,[0 ${T}],${vec([rad(st.phi1), rad(st.phi2), 0, 0])});`,
            `[t2,x2] = ode45(f,[0 ${T}],${vec([rad(st.phi1) + 1e-3, rad(st.phi2), 0, 0])});`, "plot(t,x(:,2)*180/pi, t2,x2(:,2)*180/pi)"].join("\n"),
          // Plots only: in a chaotic run no final state can be compared (python-defined.test.js scans it).
          python: [Py.HEAD, "", Py.assign([["m", st.m, "kg"], ["L_1", st.L1, "m"], ["g", 9.80665], ["k_D", st.kD], ["c_D", st.cD]]), pyOde,
            `sol = solve_ivp(f, [0, ${T}], ${Py.list([rad(st.phi1), rad(st.phi2), 0, 0])})   # RK45, rtol 1e-3 and atol 1e-6 as ode45's defaults: it parts from ode45 too after a while`,
            `sol2 = solve_ivp(f, [0, ${T}], ${Py.list([rad(st.phi1) + 1e-3, rad(st.phi2), 0, 0])})`, "plt.plot(sol.t, np.rad2deg(sol.y[1]), sol2.t, np.rad2deg(sol2.y[1]))", "plt.show()"].join("\n"),
          hint: "MATLAB's ode45 and this lab's fixed-step integrator part from each other too after a while: in a chaotic system every rounding grows.",
        };
      } },
      { name: "The energy it keeps", draw: p => {
        const r = runs(st), d = doppel(st), k = at(r.a, p), x = r.a.x[k];
        const Tk = st.m * st.L1 ** 2 / 6 * (4 * x[2] ** 2 + x[3] ** 2 + 3 * x[2] * x[3] * Math.cos(x[1] - x[0]));
        const E = r.a.E, drift = Math.max(...E.map(e => Math.abs(e - E[0])));
        return {
          figure: [bars([{ name: "kinetic K", value: Tk, cls: "store" }, { name: "potential V", value: E[k] - Tk }, { name: "total K + V", value: E[k] }], { label: "Kinetic, potential and total energy now", unit: "J", max: Math.max(...E.map(Math.abs), 1e-9) * 2 }),
            grow({ p, label: "Total energy K + V over time", xLabel: "t [s]", yLabel: "E [J]", lines: [{ x: r.a.t, y: E, name: "K + V" }] })],
          notes: [["Largest drift of K + V", `${fmt(drift, 2)} J`, st.cD > 0 ? "" : drift > 1e-4 ? "warn" : "", st.cD > 0 ? "the damper takes energy out: K + V falls" : "undamped: K + V stays, a check on the equations and the integrator"]],
          code: [assign([["m", st.m, "kg"], ["L_1", st.L1, "m"], ["g", 9.80665], ["k_D", st.kD], ["c_D", st.cD]]), "kap = 2*k_D/(m*L_1^2); gam = 2*c_D/(m*L_1^2);", odeRows,
            `[t,x] = ode45(f,[0 ${T}],${vec([rad(st.phi1), rad(st.phi2), 0, 0])});`,
            "E = m*L_1^2/6*(4*x(:,3).^2 + x(:,4).^2 + 3*x(:,3).*x(:,4).*cos(x(:,2)-x(:,1))) ...",
            "    - m*g*L_1*(1.5*cos(x(:,1)) + 0.5*cos(x(:,2))) + 1/2*k_D*(x(:,2)-x(:,1)).^2;",
            "plot(t,E-E(1))   % how far K + V drifts in ode45's run",
            "% At the default RelTol 1e-3 the drift is the integrator's, not the model's; it shrinks with",
            "% ode45(f,tspan,x0,odeset('RelTol',1e-8,'AbsTol',1e-10))"].join("\n"),
          python: [Py.HEAD, "", Py.assign([["m", st.m, "kg"], ["L_1", st.L1, "m"], ["g", 9.80665], ["k_D", st.kD], ["c_D", st.cD]]), pyOde,
            `sol = solve_ivp(f, [0, ${T}], ${Py.list([rad(st.phi1), rad(st.phi2), 0, 0])})`, "x = sol.y   # one row per state",
            "E = (m*L_1**2/6*(4*x[2]**2 + x[3]**2 + 3*x[2]*x[3]*np.cos(x[1]-x[0]))", "     - m*g*L_1*(1.5*np.cos(x[0]) + 0.5*np.cos(x[1])) + 1/2*k_D*(x[1]-x[0])**2)",
            "plt.plot(sol.t, E - E[0])   # how far K + V drifts in solve_ivp's run",
            "# At the default rtol 1e-3 the drift is the integrator's, not the model's; it shrinks with",
            "# solve_ivp(f, t_span, x0, rtol=1e-8, atol=1e-10)", "plt.show()"].join("\n"),
          pyCheck: ["E[0]", E[0], 1e-4],   // the start angles printed to six figures
        };
      } },
      { name: "Linear: the two eigenmodes", draw: p => {
        const d = doppel(st), j = p < 0.5 ? 0 : 1, md = d.modes[j], ph = Math.sin(2 * Math.PI * 3 * (p < 0.5 ? p : p - 0.5) * 2);
        const amp = 0.35 / Math.max(...md.v.map(Math.abs));
        return {
          figure: [linkage({ pivot: PIVOT, links: LINKS.map((l, i) => ({ ...l, angle: amp * md.v[i] * ph })), label: `Eigenmode ${j + 1}: the rods swing ${md.v[1] > 0 ? "together" : "against each other"}` }),
            h("div", { class: "mtx-row" }, mtx("M̃", d.Ml), mtx("K̃", d.Kl))],
          notes: d.modes.map((m, i) => [`Mode ${i + 1}`, `ω = ${fmt(m.omega)} rad/s, f = ${fmt(m.f)} Hz`, i === j ? "" : "", `shape φ₂/φ₁ = ${fmt(m.v[1])}`]),
          sheet: [{ source: "VO pp. 34, 39", sheet: "K = [3gmL₁² 0; 0 gmL₁²] after multiplying by mL₁²", lab: "g/L₁ · mL₁² = gmL₁: K = [3gmL₁ 0; 0 gmL₁]", agree: false }],
          code: eigKM({ params: [["g", 9.80665], ["L_1", st.L1], ["kap", 2 * st.kD / (st.m * st.L1 ** 2)]], K: "[3*g/L_1+kap -kap; -kap g/L_1+kap]", M: "[8/3 1; 1 2/3]" }),
          python: Py.eigKM({ params: [["g", 9.80665], ["L_1", st.L1], ["kap", 2 * st.kD / (st.m * st.L1 ** 2)]], K: "[3*g/L_1+kap -kap; -kap g/L_1+kap]", M: "[8/3 1; 1 2/3]" }), pyCheck: ["f0", d.modes.map(m => m.f)],
          hint: "Linearised at φ₁ = φ₂ = 0: cos(φ₂ − φ₁) → 1, the φ̇² terms drop, sin φ → φ.",
        };
      } },
    ];
    Object.assign(ui, stepper(root, steps, { controls }));
  },
};
