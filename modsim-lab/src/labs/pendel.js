// VO example 2, the Pendel (pp. 10–18): Lagrange's T, V and D built term by term, the nonlinear swing against the
// linear one, the rest angles and their stability from the Jacobian, and the Simulink chain with the state space.
import { h } from "../../../kit/ui/kit.js";
import * as a from "../../../kit/ui/art.js";
import { stepper, fmt, fmtC, mtx, grow } from "../../../kit/ui/steps.js";
import { pendel, pendelRest, run, eig2, classify, VALUES } from "../core/index.js";
import { linkage, blocks, blockCount } from "./pics.js";
import { reveal, memo, sliders, caption, at, deg, rad } from "./view.js";
import { lagrange, ode, stateSpace, simulink, assign, num } from "./matlab.js";
import * as Py from "./python.js";

const swing = memo((v, lin) => run(pendel({ ...v, linear: lin }), [rad(v.phi0), 0], 8, 1600));
const P = v => [["m", v.m, "kg"], ["L_1", v.L1, "m"], ["g", 9.80665, "m/s^2"], ["k_D", v.kD, "N*m/rad"], ["c_D", v.cD, "N*m*s/rad"]];
const rod = (phi, len = 220) => [{ angle: phi, len, kind: "string", bob: 13 }];

export default {
  id: "pendel",
  art: () => a.picture("A pendulum: a point mass on a rod swung out from its pivot, a dashed copy at a smaller angle",
    a.line([[60, 20], [140, 20]], a.INK, 3) + a.line([[100, 20], [150, 115]], a.INK, 3) + a.circle(150, 118, 10, a.ACC, 3, a.ACC)
    + a.line([[100, 20], [125, 125]], a.DIM, 2, "5 4") + a.circle(125, 128, 8, a.DIM, 2)),
  mount(root) {
    const st = { ...VALUES.pendel };
    const ui = { refresh: () => {} };
    const controls = sliders(st, [["phi0", "Start angle φ(0)", 5, 175, 1, "°"], ["L1", "Rod length L₁", 0.2, 2, 0.05, "m"],
      ["cD", "Torsion damper c_D", 0, 3, 0.05, "N·m·s/rad"], ["kD", "Torsion spring k_D", 0, 30, 0.5, "N·m/rad"]], () => ui.refresh());
    const steps = [
      { name: "Lagrange: T, V, D term by term", draw: p => ({
        figure: [linkage({ links: rod(0.5 * Math.sin(6 * p) * (1 - p) + 0.3), label: "The pendulum: point mass m on a massless rod L₁ at angle φ from the vertical" }),
          reveal(["T = ½ m L₁² φ̇²", "V_G = m g L₁ (1 − cos φ)   (zero at the bottom)", "V_F = ½ k_D φ²   (torsion spring, relaxed at φ = 0)",
            "D = ½ c_D φ̇²   (torsion damper)", "Q = −M₁(t)   (the moment acts against φ)",
            "d/dt ∂L/∂φ̇ − ∂L/∂φ + ∂D/∂φ̇ = Q,  L = T − V",
            "m L₁² φ̈ + c_D φ̇ + k_D φ + m g L₁ sin φ = −M₁(t)"], p)],
        notes: [["ω₀ (no spring)", `√(g/L₁) = ${fmt(Math.sqrt(9.80665 / st.L1))} rad/s`]],
        sheet: [{ source: "VO p. 12", sheet: "V_G = −m₁ g L₁ sin φ₁ and ∂L/∂φ₁ = −m₁ g L₁ cos φ₁ − k_D φ₁", lab: "V_G = m g L₁(1 − cos φ) for φ from the vertical; ∂L/∂φ = −m g L₁ sin φ − k_D φ", agree: false },
          { source: "VO p. 13", sheet: "φ̈ = [−M₁ − m g L₁ sin φ − k_D(φ − φ₀) − c_D(φ̇ − φ̇₀)]/(m L₁²)", lab: "the same (φ₀ = 0)", agree: true }],
        code: lagrange({ q: ["phi"], names: ["m", "L_1", "g", "k_D", "c_D", "M_1"], T: "1/2*m*L_1^2*diff(phi,t)^2",
          V: "m*g*L_1*(1 - cos(phi)) + 1/2*k_D*phi^2", D: "1/2*c_D*diff(phi,t)^2", Q: ["-M_1"] }),
        ...(() => { const st0 = [0.4, -0.3], L = Py.lagrange({ q: ["phi"], names: ["m", "L_1", "g", "k_D", "c_D", "M_1"], T: "1/2*m*L_1^2*diff(phi,t)^2", V: "m*g*L_1*(1 - cos(phi)) + 1/2*k_D*phi^2", D: "1/2*c_D*diff(phi,t)^2", Q: ["-M_1"], check: { values: { m: st.m, L_1: st.L1, g: 9.80665, k_D: st.kD, c_D: st.cD, M_1: pendel(st).M1(0) }, state: st0 } }), n = st0.length / 2; return { python: L.code, pyCheck: [L.expr, pendel(st).f(0, st0).slice(n), 1e-9] }; })(),
        hint: "The sheet's sin-form of V_G belongs to a φ measured from the horizontal (as in example 3); its final equation is right.",
      }) },
      { name: "Nonlinear against linear", draw: p => {
        const r = swing(st, false), l = swing(st, true), k = at(r, p), pp = pendel(st);
        return {
          figure: [linkage({ links: rod(r.x[k][0]), ghost: [l.x[k][0]], label: "The nonlinear pendulum, and the linear model's faint behind it" }),
            grow({ p, label: "Angle φ of both models", xLabel: "t [s]", yLabel: "φ [°]",
              lines: [{ x: r.t, y: r.x.map(x => deg(x[0])), name: "sin φ" }, { x: l.t, y: l.x.map(x => deg(x[0])), name: "sin φ ≈ φ", cls: "second" }] }),
            caption("Example values; M₁ = 0, the pendulum swings freely.")],
          notes: [["Small-angle period", `T₀ = 2π√(L₁/g) = ${fmt(pp.T0)} s`, "", "without spring; the linear model keeps it at every amplitude"],
            ["Start angle", `${fmt(st.phi0)}°`, st.phi0 > 30 ? "warn" : "", st.phi0 > 30 ? "beyond about 30° the two drift apart: sin φ is no longer φ" : "small: the two agree"]],
          code: ode({ params: [...P(st), ["M_1", 0, "free swing"]], rows: ["x(2)", "(-M_1 - m*g*L_1*sin(x(1)) - k_D*x(1) - c_D*x(2))/(m*L_1^2)"], x0: [rad(st.phi0), 0], T: 8,
            plot: `fl = @(t,x) [x(2); (-M_1 - m*g*L_1*x(1) - k_D*x(1) - c_D*x(2))/(m*L_1^2)];   % sin(phi) ~ phi\n[tl,xl] = ode45(fl,[0 8],${"[" + num(rad(st.phi0)) + "; 0]"});\nplot(t,x(:,1)*180/pi, tl,xl(:,1)*180/pi), legend('nonlinear','linear')` }),
          python: Py.ode({ params: [...P(st), ["M_1", 0, "free swing"]], rows: ["x(2)", "(-M_1 - m*g*L_1*sin(x(1)) - k_D*x(1) - c_D*x(2))/(m*L_1^2)"], x0: [rad(st.phi0), 0], T: 8,
            plot: `fl = lambda t, x: [x[1], (-M_1 - m*g*L_1*x[0] - k_D*x[0] - c_D*x[1])/(m*L_1**2)]   # sin(phi) ~ phi\nsol_l = solve_ivp(fl, [0, 8], [${num(rad(st.phi0))}, 0])\nplt.plot(sol.t, np.rad2deg(sol.y[0]), sol_l.t, np.rad2deg(sol_l.y[0])); plt.legend(['nonlinear', 'linear'])` }),
          pyCheck: Py.odeCheck(r),
        };
      } },
      { name: "Rest angles and their stability", draw: p => {
        const pp = pendel(st), rest = pendelRest(st), k = Math.min(rest.length - 1, Math.floor(p * rest.length));
        const J = pp.jac(rest[k]), tr = J[0][0] + J[1][1], dt = J[0][0] * J[1][1] - J[0][1] * J[1][0];
        return {
          figure: [linkage({ links: rod(rest[k] + 0.08 * Math.sin(20 * p)), label: `The pendulum at the rest angle ${fmt(deg(rest[k]))}°, nudged` }),
            h("div", { class: "mtx-row" }, mtx("J", J))],
          notes: [["Rest angles in ±360°", rest.map(r => `${fmt(deg(r), 3)}°`).join(", "), "", "m g L₁ sin φ + k_D φ = 0; nπ when k_D = 0"],
            [`At ${fmt(deg(rest[k]), 3)}°`, classify(tr, dt), tr < 0 && dt > 0 ? "" : "warn", `tr = ${fmt(tr)}, det = ${fmt(dt)}; eigenvalues ${eig2(J).map(fmtC).join(", ")}`]],
          sheet: [{ source: "VO p. 18", sheet: "x* = ((2n+1)π, 0): saddle, \"in the first quadrant\" of the tr–det chart", lab: "tr < 0, det < 0: the lower half (third quadrant); a saddle", agree: false },
            { source: "VO p. 13", sheet: "rest at sin φ = 0 (the torsion spring left out)", lab: st.kD > 0 ? `with k_D = ${fmt(st.kD)}: ${rest.length} rest angle(s)` : "the same with k_D = 0", agree: st.kD > 0 ? false : true }],
          code: [assign(P(st)), "syms x1 x2", "f = [x2; -g/L_1*sin(x1) - k_D/(m*L_1^2)*x1 - c_D/(m*L_1^2)*x2];   % the state equations, M_1 = 0",
            "J = jacobian(f,[x1 x2])", `J0 = double(subs(J,[x1 x2],[${num(rest[k])} 0]))`, "eig(J0)", "[trace(J0) det(J0)]   % tr < 0 and det > 0: stable"].join("\n"),
          python: [Py.HEAD_SYM, "import numpy as np", "", Py.assign(P(st)), "x1, x2 = symbols('x1 x2')", "f = sp.Matrix([x2, -g/L_1*sin(x1) - k_D/(m*L_1**2)*x1 - c_D/(m*L_1**2)*x2])   # the state equations, M_1 = 0",
            "J = f.jacobian([x1, x2])", `J0 = np.array(J.subs({x1: ${num(rest[k])}, x2: 0}), dtype=float)`, "print(np.linalg.eigvals(J0), np.trace(J0), np.linalg.det(J0))   # tr < 0 and det > 0: stable"].join("\n"),
          pyCheck: ["J0", J],
        };
      } },
      { name: "Simulink chain and state space", draw: p => {
        const pp = pendel(st), row = { input: "M₁(t)", signs: "− − −", gain: "1/(mL₁²)", states: ["φ̈", "φ̇", "φ"], ics: ["0", "φ(0)"],
          feedback: [{ from: 1, gain: "c_D" }, { from: 2, gain: "Fcn: mgL₁ sin u + k_D u" }] };
        const n = blockCount([row]), cells = Math.floor(Math.max(0, p - 0.5) * 2 * 7);
        return {
          figure: [blocks([row], { show: Math.ceil(Math.min(1, 2 * p) * n), label: "The pendulum as Simulink blocks: Sum, Gain, two Integrators, the damper gain and the sine Fcn fed back" }),
            h("div", { class: "mtx-row" }, mtx("A", pp.A, { cells }), mtx("B", pp.B, { cells: cells - 4 }))],
          notes: [["Linear poles", eig2(pp.A).map(fmtC).join(", ")]],
          sheet: [{ source: "VO p. 18", sheet: "Simulink: θ̈ = 1·sin(2πt) − (g/L)·sin θ (no 1/(mL²), k_D, c_D)", lab: "the equation of p. 13 in full", agree: false },
            { source: "VO p. 13", sheet: "B = [0; 1/(mL²)] with u = M₁", lab: "B = [0; −1/(mL²)]: M₁ acts against φ in the ODE", agree: false }],
          code: simulink({ params: P(st), rows: [{ ...row, input: "Clock -> Fcn M0*cos(Om*u)", gain: "1/(m*L_1^2)", feedback: [{ from: 1, gain: "c_D" }, { from: 2, gain: "Fcn m*g*L_1*sin(u) + k_D*u" }] }],
            simscape: "Multibody: World Frame, Mechanism Configuration, Solver Configuration -> Rigid Transform (Pivot) -> Revolute Joint (torque from a Simulink-PS Converter, angle sensed) -> Link (VO p. 18)" })
            + "\n" + stateSpace({ params: [], A: "[0 1; -k_D/(m*L_1^2)-g/L_1 -c_D/(m*L_1^2)]", B: "[0; -1/(m*L_1^2)]", C: "[1 0]", then: ["eig(A)"] }),
          python: Py.simulink({ params: P(st), rows: [{ ...row, gain: "1/(m*L_1^2)" }], simscape: "Multibody: World Frame, Revolute Joint, Link (VO p. 18)" })
            + "\n" + Py.stateSpace({ params: [], A: "[0 1; -k_D/(m*L_1^2)-g/L_1 -c_D/(m*L_1^2)]", B: "[0; -1/(m*L_1^2)]", C: "[1 0]", step: false }),
          pyCheck: ["A", pp.A],
        };
      } },
    ];
    Object.assign(ui, stepper(root, steps, { controls }));
  },
};
