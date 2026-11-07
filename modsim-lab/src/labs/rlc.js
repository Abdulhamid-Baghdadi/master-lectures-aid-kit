// VO example 4, the RLC circuit (pp. 25–26): the mesh rule gives the ODE in the charge q, the ODE becomes a Simulink
// chain, the state space fills in, and the energy moves between coil and capacitor while the resistor takes its share.
import { h } from "../../../kit/ui/kit.js";
import * as a from "../../../kit/ui/art.js";
import { stepper, fmt, fmtC, mtx, grow } from "../../../kit/ui/steps.js";
import { rlc, run, eig2, VALUES } from "../core/index.js";
import { loop, bars, blocks, blockCount } from "./pics.js";
import { reveal, memo, sliders, caption, at } from "./view.js";
import { ode, stateSpace, simulink } from "./matlab.js";
import * as Py from "./python.js";

const T = v => Math.min(0.5, 10 / Math.max(rlc(v).delta, 1));
const sim = memo(v => run(rlc(v), [0, 0], T(v), 2000));
const P = v => [["R", v.R, "Ohm"], ["L", v.L, "H"], ["C", v.C, "F"], ["U", v.U, "V, a step"]];
const PARTS = [{ kind: "C", name: "C" }, { kind: "L", name: "L" }, { kind: "R", name: "R  (y = u_R)" }];
const ROW = { input: "u(t)", signs: "+ − −", gain: "1/L", states: ["q̈", "q̇ = i", "q"], ics: ["0", "0"], feedback: [{ from: 1, gain: "R" }, { from: 2, gain: "1/C" }] };

export default {
  id: "rlc",
  art: () => a.picture("A series loop of a source, a capacitor, a coil and a resistor, with a dot running round it",
    a.rect(30, 30, 140, 100, a.INK, 3) + a.line([[75, 22], [75, 38]], a.INK, 4) + a.line([[85, 22], [85, 38]], a.INK, 4)
    + a.rect(115, 22, 30, 16, a.INK, 3, a.INK) + a.rect(162, 65, 16, 30, a.INK, 3) + a.circle(30, 80, 12, a.ACC, 3) + a.circle(100, 130, 5, a.ACC, 2, a.ACC)),
  mount(root) {
    const st = { ...VALUES.rlc };
    const ui = { refresh: () => {} };
    const controls = sliders(st, [["R", "Resistance R", 0.5, 40, 0.5, "Ω"], ["L", "Inductance L", 0.01, 1, 0.01, "H"], ["C", "Capacitance C", 1e-4, 5e-3, 1e-4, "F"], ["U", "Step of u", 0.5, 10, 0.5, "V"]], () => ui.refresh());
    const steps = [
      { name: "Mesh rule → the ODE", draw: p => ({
        figure: [loop({ parts: PARTS, flow: p, label: "The series loop: source u, capacitor C, coil L, resistor R" }),
          reveal(["u(t) = u_C + u_L + u_R", "u_C = (1/C)∫i dt,  u_L = L di/dt,  u_R = R i = y", "i = q̇:  u = (1/C) q + R q̇ + L q̈",
            "q̈ = (1/L)[u − (1/C) q − R q̇]   (the form for Simulink)"], p)],
        notes: [["ω₀ = 1/√(LC)", `${fmt(rlc(st).w0)} rad/s`], ["Like the single mass", "L ↔ m, R ↔ c, 1/C ↔ k, q ↔ x", "", "the same ODE in other letters"]],
        sheet: [{ source: "VO pp. 25–26", sheet: "q̈ = (1/L)[u − (1/C)q − Rq̇], ω₀ = 1/√(LC)", lab: "the same", agree: true }],
        code: ["syms q(t) R L C u", "eq = L*diff(q,t,2) + R*diff(q,t) + q/C == u   % the mesh rule with i = dq/dt", "[Vf,S] = odeToVectorField(eq)   % S: Y[1] = q, Y[2] = dq/dt"].join("\n"),
        python: [Py.HEAD_SYM, "", "t = symbols('t')", "R, L, C, u = symbols('R L C u')", "q = Function('q')(t)", "eq = Eq(L*diff(q, t, 2) + R*diff(q, t) + q/C, u)   # the mesh rule with i = dq/dt",
          "acc = solve(eq, diff(q, t, 2))[0]   # q'' alone: sympy has no odeToVectorField", "print(acc)",
          `a = float(acc.subs({diff(q, t): 0.01}).subs({q: 1e-4, R: ${Py.num(st.R)}, L: ${Py.num(st.L)}, C: ${Py.num(st.C)}, u: ${Py.num(st.U)}}))   # at a test state`, "print(a)"].join("\n"),
        pyCheck: ["a", rlc(st).f(0, [1e-4, 0.01])[1], 1e-9],
      }) },
      { name: "The ODE as Simulink blocks", draw: p => ({
        figure: blocks([ROW], { show: Math.ceil(p * blockCount([ROW])), label: "u into a Sum, Gain 1/L, two Integrators to i and q, R and 1/C fed back" }),
        sheet: [{ source: "VO p. 26", sheet: "u_in → Sum → Gain 1/L → q_pp → 1/s → q_p → 1/s → q; Gains R and 1/C back", lab: "the same", agree: true }],
        code: simulink({ params: P(st), rows: [{ ...ROW, input: "Step U" }], simscape: "DC Voltage Source, Resistor, Inductor, Capacitor in series, Current Sensor, Voltage Sensor across C, Electrical Reference, Solver Configuration (VO p. 26)" }),
        python: Py.simulink({ params: P(st), rows: [{ ...ROW, input: "Step U" }], simscape: "DC Voltage Source, Resistor, Inductor, Capacitor (VO p. 26)" }),
      }) },
      { name: "State space: A, B, C fill in", draw: p => {
        const c = rlc(st), cells = Math.floor(p * 8);
        return {
          figure: h("div", { class: "mtx-row" }, mtx("A", c.A, { cells, hot: cells }), mtx("B", c.B, { cells: cells - 4, hot: cells - 4 }), mtx("C", c.Cy, { row: true, cells: cells - 6, hot: cells - 6 })),
          notes: [["States", "x₁ = q, x₂ = i = q̇"], ["Poles, eig(A)", eig2(c.A).map(fmtC).join(", ")]],
          sheet: [{ source: "VO p. 26", sheet: "u_C = x₁, then (1/C) x₁ in ẋ₂", lab: "x₁ = q: (1/C)·q is the capacitor's voltage; with x₁ = u_C the term would be x₁ alone", agree: false }],
          code: stateSpace({ params: P(st).slice(0, 3), A: "[0 1; -1/(L*C) -R/L]", B: "[0; 1/L]", C: "[0 R]", then: ["eig(A)", "step(sys)   % u_R after a 1 V step"] }),
          python: Py.stateSpace({ params: P(st).slice(0, 3), A: "[0 1; -1/(L*C) -R/L]", B: "[0; 1/L]", C: "[0 R]" }), pyCheck: [Py.PY_POLES("A"), Py.polesKey(eig2(c.A))],
        };
      } },
      { name: "Energy between coil and capacitor", draw: p => {
        const c = rlc(st), r = sim(st), k = at(r, p), x = r.x[k];
        let lost = 0, given = 0;
        for (let j = 1; j <= k; j++) { const dt = r.t[j] - r.t[j - 1], i = (r.x[j][1] + r.x[j - 1][1]) / 2; lost += st.R * i * i * dt; given += st.U * i * dt; }
        const e = c.stored(x);
        return {
          figure: [loop({ parts: PARTS, flow: x[0] / Math.max(1e-12, st.C * st.U) * 1.5, label: "The loop, the dots moved by the charge that has flowed", values: [`${fmt(x[0] / st.C, 3)} V`, "", `${fmt(st.R * x[1], 3)} V`] }),
            bars([{ name: "source gave", value: given }, { name: "capacitor ½q²/C", value: e.electric, cls: "store" }, { name: "coil ½Li²", value: e.magnetic, cls: "store" }, { name: "resistor ∫Ri²dt", value: lost, cls: "loss" }],
              { label: "Energy: what the source gave, what is stored, what the resistor turned to heat", unit: "J", max: st.C * st.U * st.U }),
            grow({ p, label: "Capacitor voltage and current", xLabel: "t [s]", yLabel: "u_C [V], i·10 [A]", lines: [{ x: r.t, y: r.x.map(v => v[0] / st.C), name: "u_C" }, { x: r.t, y: r.x.map(v => 10 * v[1]), name: "10·i", cls: "second" }] }),
            caption("Example values.")],
          notes: [["Balance", `${fmt(given, 3)} J = ${fmt(e.electric + e.magnetic + lost, 3)} J`, "", "given = stored + lost, to the integrator's accuracy"],
            ["At the end", "C·U²/2 stored, as much lost", "", "charging a capacitor through a resistor always loses half"]],
          code: ode({ params: P(st), rows: ["x(2)", "(U - x(1)/C - R*x(2))/L"], x0: [0, 0], T: T(st), plot: "plot(t,x(:,1)/C, t,R*x(:,2)), legend('u_C','u_R')" }),
          python: Py.ode({ params: P(st), rows: ["x(2)", "(U - x(1)/C - R*x(2))/L"], x0: [0, 0], T: T(st), plot: "plt.plot(sol.t, sol.y[0]/C, sol.t, R*sol.y[1]); plt.legend(['u_C', 'u_R'])" }), pyCheck: Py.odeCheck(r),
        };
      } },
    ];
    Object.assign(ui, stepper(root, steps, { controls }));
  },
};
