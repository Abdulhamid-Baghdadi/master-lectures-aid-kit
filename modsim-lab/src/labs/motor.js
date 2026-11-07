// VO example 7, the E-Motor (pp. 41–42): the armature circuit and the shaft give two equations coupled by k_M and
// k_T, they become two Simulink rows and a 3 × 3 state space, and the motor runs up while the power flows from the
// source to the resistor, the friction and the load.
import { h } from "../../../kit/ui/kit.js";
import * as a from "../../../kit/ui/art.js";
import { stepper, fmt, fmtC, mtx, grow } from "../../../kit/ui/steps.js";
import { motor, run, VALUES } from "../core/index.js";
import { loop, bars, blocks, blockCount } from "./pics.js";
import { reveal, memo, sliders, caption, at } from "./view.js";
import { ode, stateSpace, simulink } from "./matlab.js";
import * as Py from "./python.js";

const T = 3;
const sim = memo(v => run(motor(v), [0, 0, 0], T, 3000));
const P = v => [["R_A", v.RA, "Ohm"], ["L_A", v.LA, "H"], ["k_M", v.kM, "V*s/rad"], ["k_T", v.kT, "N*m/A"], ["J", v.J, "kg*m^2"], ["c_L", v.cL, "N*m*s/rad"], ["u_A", v.uA, "V"], ["M_L", v.ML, "N*m, load"]];
const ROWS = [
  { input: "u_A", signs: "+ − −", gain: "1/L_A", states: ["di_A/dt", "i_A", "∫i_A"], ics: ["0", "0"], feedback: [{ from: 1, gain: "R_A" }, { from: 1, gain: "k_M·ω (from row 2)" }] },
  { input: "k_T·i_A", signs: "+ − −", gain: "1/J", states: ["φ̈", "ω", "φ"], ics: ["0", "0"], feedback: [{ from: 1, gain: "c_L" }, { from: 1, gain: "M_L (load)" }] }];

export default {
  id: "motor",
  art: () => a.picture("A DC motor: a circuit loop with a resistor and a coil driving a rotor, and a speed curve rising",
    a.rect(14, 30, 80, 90, a.INK, 3) + a.rect(36, 22, 30, 16, a.INK, 3) + a.circle(94, 75, 18, a.ACC, 3) + a.line([[112, 75], [140, 75]], a.INK, 4)
    + a.circle(156, 75, 16, a.INK, 3) + a.path("M120 135 C140 100 160 95 192 92", a.COOL, 2)),
  mount(root) {
    const st = { ...VALUES.motor };
    const ui = { refresh: () => {} };
    const controls = sliders(st, [["uA", "Armature voltage u_A", 0, 24, 0.5, "V"], ["ML", "Load torque M_L", 0, 0.2, 0.005, "N·m"],
      ["RA", "Armature resistance R_A", 0.2, 5, 0.1, "Ω"], ["J", "Inertia J", 0.001, 0.05, 0.001, "kg·m²"]], () => ui.refresh());
    const steps = [
      { name: "Circuit and shaft: two equations", draw: p => ({
        figure: [loop({ parts: [{ kind: "R", name: "R_A" }, { kind: "L", name: "L_A" }, { kind: "M", name: "u_M = k_M ω" }], source: "u_A", flow: p, label: "The armature loop: u_A, R_A, L_A and the induced voltage u_M" }),
          reveal(["u_A = R_A i_A + L_A di_A/dt + u_M", "u_M = k_M ω   (induced voltage)", "J φ̈ + c_L φ̇ = M_A", "M_A = k_T i_A   (motor torque)",
            "di_A/dt = (1/L_A)[u_A − R_A i_A − k_M ω],   φ̈ = (1/J)[k_T i_A − c_L ω − M_L]"], p)],
        notes: [["The coupling", "k_M and k_T", "", "the shaft's speed pushes back on the circuit; the current turns the shaft"]],
        sheet: [{ source: "VO pp. 41–42", sheet: "di_A/dt = (1/L_A)[u_A − R_A i_A − k_M ω], φ̈ = (1/J)[k_T i_A − c_L ω]", lab: "the same, with a load torque M_L the Simulink model has", agree: true }],
        code: ["syms i_A(t) phi(t) R_A L_A k_M k_T J c_L u_A M_L",
          "eq1 = L_A*diff(i_A,t) == u_A - R_A*i_A - k_M*diff(phi,t)", "eq2 = J*diff(phi,t,2) == k_T*i_A - c_L*diff(phi,t) - M_L",
          "[Vf,S] = odeToVectorField(eq1,eq2)   % read S: the order of i_A, phi, dphi/dt"].join("\n"),
        python: [Py.HEAD_SYM, "", "t = symbols('t')", "R_A, L_A, k_M, k_T, J, c_L, u_A, M_L = symbols('R_A L_A k_M k_T J c_L u_A M_L')", "i_A = Function('i_A')(t)", "phi = Function('phi')(t)",
          "eq1 = Eq(L_A*diff(i_A, t), u_A - R_A*i_A - k_M*diff(phi, t))", "eq2 = Eq(J*diff(phi, t, 2), k_T*i_A - c_L*diff(phi, t) - M_L)",
          "acc = solve([eq1, eq2], [diff(i_A, t), diff(phi, t, 2)], dict=True)[0]   # sympy has no odeToVectorField", "print(acc)",
          `at = {i_A: 0.5, phi: 0.1, R_A: ${Py.num(st.RA)}, L_A: ${Py.num(st.LA)}, k_M: ${Py.num(st.kM)}, k_T: ${Py.num(st.kT)}, J: ${Py.num(st.J)}, c_L: ${Py.num(st.cL)}, u_A: ${Py.num(st.uA)}, M_L: ${Py.num(st.ML)}}   # a test state`,
          "a = [float(acc[d].subs({diff(phi, t): 20}).subs(at)) for d in (diff(i_A, t), diff(phi, t, 2))]", "print(a)"].join("\n"),
        pyCheck: ["a", (([di, , dw]) => [di, dw])(motor(st).f(0, [0.5, 0.1, 20])), 1e-9],
      }) },
      { name: "Two Simulink rows", draw: p => ({
        figure: blocks(ROWS, { show: Math.ceil(p * blockCount(ROWS)), label: "Row 1 the current, row 2 the shaft; k_M·ω goes back to row 1, k_T·i_A drives row 2" }),
        sheet: [{ source: "VO p. 42", sheet: "Constant 10 \"load torque\" into the shaft's Sum", lab: "the ODE of p. 42 has no load term; the lab adds M_L with a minus sign", agree: false },
          { source: "VO p. 42", sheet: "the current named q_p and integrated once more to q", lab: "i_A needs one Integrator; the second is not used", agree: undefined }],
        code: simulink({ params: P(st), rows: [{ ...ROWS[0], feedback: [{ from: 1, gain: "R_A" }, { from: 1, gain: "k_M (on omega from row 2)" }] }, { ...ROWS[1], input: "Gain k_T on i_A", feedback: [{ from: 1, gain: "c_L" }, { from: 1, gain: "Constant M_L" }] }],
          simscape: "DC Voltage Source -> Resistor -> Inductor -> Rotational Electromechanical Converter -> Inertia, Rotational Damper; Ideal Torque Source for the load; Ideal Rotational Motion Sensor; Solver Configuration (VO p. 42)" }),
        python: Py.simulink({ params: P(st), rows: ROWS, simscape: "DC Voltage Source, Resistor, Inductor, Rotational Electromechanical Converter, Inertia (VO p. 42)" }),
      }) },
      { name: "State space 3 × 3", draw: p => {
        const m = motor(st), cells = Math.floor(p * 13);
        return {
          figure: h("div", { class: "mtx-row" }, mtx("A", m.A, { cells, hot: cells }), mtx("B", m.B, { cells: cells - 9, hot: cells - 9 })),
          notes: [["States", "(i_A, φ, ω)"], ["Poles", m.poles.map(fmtC).join(", "), "", "0 from φ (the angle keeps adding up), two from current and speed"]],
          sheet: [{ source: "VO p. 42", sheet: "A = [−R_A/L_A 0 −k_M/L_A; 0 0 1; k_T/J 0 −c_L/J], B = [1/L_A; 0; 0]", lab: "the same", agree: true }],
          code: stateSpace({ params: P(st).slice(0, 6), A: "[-R_A/L_A 0 -k_M/L_A; 0 0 1; k_T/J 0 -c_L/J]", B: "[1/L_A; 0; 0]", C: "[0 0 1]", then: ["eig(A)", "step(sys)   % omega after a 1 V step"] }),
          python: Py.stateSpace({ params: P(st).slice(0, 6), A: "[-R_A/L_A 0 -k_M/L_A; 0 0 1; k_T/J 0 -c_L/J]", B: "[1/L_A; 0; 0]", C: "[0 0 1]" }), pyCheck: ["A", m.A],
        };
      } },
      { name: "Run-up and the power flow", draw: p => {
        const m = motor(st), r = sim(st), k = at(r, p), pw = m.powers(r.x[k]);
        return {
          figure: [loop({ parts: [{ kind: "R", name: "R_A" }, { kind: "L", name: "L_A" }, { kind: "M", name: "motor" }], source: "u_A", flow: r.x[k][1] / 20, label: "The loop, the dots turned with the shaft's angle", values: [`${fmt(r.x[k][0], 3)} A`, "", `${fmt(r.x[k][2] * 60 / (2 * Math.PI), 4)} rpm`] }),
            bars([{ name: "source u_A·i_A", value: pw.source }, { name: "resistor R_A·i_A²", value: pw.resistor, cls: "loss" }, { name: "to the shaft k_T·i_A·ω", value: pw.shaft, cls: "store" },
              { name: "friction c_L·ω²", value: pw.friction, cls: "loss" }, { name: "load M_L·ω", value: pw.load }], { label: "Power now: from the source into the resistor and the shaft, from the shaft into friction and load", unit: "W" }),
            grow({ p, label: "Speed ω and current i_A", xLabel: "t [s]", yLabel: "ω [rad/s], 10·i_A [A]", lines: [{ x: r.t, y: r.x.map(x => x[2]), name: "ω" }, { x: r.t, y: r.x.map(x => 10 * x[0]), name: "10·i_A", cls: "second" }] }),
            caption("Example values of a small DC motor; the sheet gives none.")],
          notes: [["ω at rest", `${fmt(m.wInf)} rad/s`, m.wInf < 0 ? "danger" : "", "(k_T u_A − R_A M_L)/(R_A c_L + k_M k_T)"]],
          code: ode({ params: P(st), rows: ["(u_A - R_A*x(1) - k_M*x(3))/L_A", "x(3)", "(k_T*x(1) - c_L*x(3) - M_L)/J"], x0: [0, 0, 0], T, plot: "plot(t,x(:,3), t,10*x(:,1)), legend('\\omega','10 i_A')" }),
          python: Py.ode({ params: P(st), rows: ["(u_A - R_A*x(1) - k_M*x(3))/L_A", "x(3)", "(k_T*x(1) - c_L*x(3) - M_L)/J"], x0: [0, 0, 0], T, plot: "plt.plot(sol.t, sol.y[2], sol.t, 10*sol.y[0]); plt.legend(['omega', '10 i_A'])" }), pyCheck: Py.odeCheck(r),
        };
      } },
    ];
    Object.assign(ui, stepper(root, steps, { controls }));
  },
};
