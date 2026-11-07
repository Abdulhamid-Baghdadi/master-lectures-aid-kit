// Beispiel 20: the device approximated by R1, L1, R2 and C2. Step 1 writes Kirchhoff's mesh rule into A, b, cᵀ;
// step 2 tests controllability and observability; step 3 runs a step of Us and shows which states the output sees.
import { h } from "../../../kit/ui/kit.js";
import * as a from "../../../kit/ui/art.js";
import { circuit20, ctrb, obsv, det, stepRun, poles } from "../core/index.js";
import { stepper, fmt, fmtC } from "./view.js";
import { circuitSvg, grow, mtx } from "./pics.js";
import { model, checks } from "./matlab.js";
import * as Py from "./python.js";

// Kubinger (2021a), Beispiel 20, p. 21.
const P = { R1: 4.53, L1: 123e-3, R2: 0.8, C2: 321e-6 };
const parts = { top: [["R", "R1"], ["L", "L1"]], shunt: [["R", "R2"], ["C", "C2"]], inLabel: "Us", outs: ["Uh"] };
const code = m => `R1 = 4.53; L1 = 123e-3; R2 = 0.8; C2 = 321e-6;\nA = [-(R1+R2)/L1 -1/L1; 1/C2 0];\nb = [1/L1; 0];\ncT = [R2 1];\nd = 0;\nSYS = ss(A,b,cT,d);`;
const pyCode = `${Py.HEAD}\n\nR1 = 4.53\nL1 = 123e-3\nR2 = 0.8\nC2 = 321e-6\nA = np.array([[-(R1+R2)/L1, -1/L1], [1/C2, 0]])\nb = np.array([[1/L1], [0]])\ncT = np.array([[R2, 1]])\nd = 0\nSYS = ss(A, b, cT, d)`;

export default {
  id: "circuit",
  art: () => a.picture("A circuit with R1 and L1 in series and R2 with C2 across the output",
    a.line([[20, 40], [180, 40]], a.INK, 2) + a.line([[20, 120], [180, 120]], a.INK, 2) + a.resistor(60, 40) + a.rect(100, 33, 32, 14, a.INK, 2, a.INK) +
    a.resistor(150, 65, true) + a.line([[138, 100], [162, 100]], a.ACC, 3) + a.line([[138, 108], [162, 108]], a.ACC, 3)),
  mount(root) {
    const m = circuit20(P);
    const steps = [
      { name: "Kirchhoff to A, b, cᵀ", draw: p => ({
        figure: [circuitSvg({ ...parts, flow: p * 2, label: "The circuit: Us drives the current iL through R1, L1, R2 and C2; Uh is taken across R2 and C2" }),
          h("div", { class: "mtx-row" }, mtx("A", m.A, { cells: Math.floor(p * 5), hot: p < 1 ? Math.floor(p * 4) : -1 }), mtx("b", m.b, { cells: p > 0.8 ? 2 : 0 }), mtx("cᵀ", m.c, { row: true, cells: p >= 1 ? 2 : 0 }))],
        notes: [["States", "x1 = iL, x2 = uC", "", "one per energy store: the coil's current and the capacitor's voltage"],
          ["Mesh", "L1·diL/dt = Us − (R1 + R2)·iL − uC", "", "and C2·duC/dt = iL; Uh = R2·iL + uC with the output open"]],
        sheet: [{ source: "S1, pp. 26–27", sheet: "A = [−(R1+R2)/L −1/L; 1/C 0], b = [1/L; 0], cᵀ = [R2 1]", lab: `A = [${fmt(m.A[0][0])} ${fmt(m.A[0][1])}; ${fmt(m.A[1][0])} 0]`, agree: true }],
        code: code(m), python: pyCode, pyCheck: ["A", m.A], hint: "Kubinger (2021a) gives R1 = 4.53 Ω, L1 = 123 mH, R2 = 0.8 Ω, C2 = 321 µF.",
      }) },
      { name: "Controllable, observable?", draw: () => {
        const qs = det(ctrb(m.A, m.b)), qb = det(obsv(m.A, m.c));
        return {
          figure: h("div", { class: "mtx-row" }, mtx("Q_S", ctrb(m.A, m.b)), mtx("Q_B", obsv(m.A, m.c))),
          notes: [["det Q_S = 1/(L1²·C2)", fmt(qs, 4), "", "not zero: controllable"], ["det Q_B = R1·R2/L1 − 1/C2", fmt(qb, 4), "", "not zero: observable"],
            ["Measurable?", "Uh only", "warn", "iL and uC sit inside the housing; an observer has to estimate them"]],
          sheet: [{ source: "S1, p. 27", sheet: "det Q_S ≈ 205.9 k, det Q_B ≈ −3.1 k", lab: `${fmt(qs, 4)} and ${fmt(qb, 3)}`, agree: Math.abs(qs - 205.9e3) < 100 && Math.abs(qb + 3.1e3) < 50 }],
          code: `${code(m)}\n${checks()}`, python: `${pyCode}\n${Py.checks()}`, pyCheck: [["np.linalg.det(QS)", qs], ["np.linalg.det(QB)", qb]],
          hint: "S2, p. 9 writes another expression for det Q_B; S1's matches the matrices (see the README's source notes).",
        };
      } },
      { name: "Step of Us", draw: p => {
        const r = stepRun(m.A, m.b, m.c, 0, 0.12, 400), k = Math.min(400, Math.floor(p * 400));
        return {
          figure: [circuitSvg({ ...parts, flow: r.x[k][0] * 40 * p, label: "The current dot moves with iL after a 1 V step" }),
            grow({ p, label: "iL, uC and Uh after a 1 V step of Us", xLabel: "t [s]", yLabel: "iL [A], uC, Uh [V]",
              lines: [{ x: r.t, y: r.x.map(x => x[0]), name: "iL" }, { x: r.t, y: r.x.map(x => x[1]), name: "uC", cls: "second" }, { x: r.t, y: r.y, name: "Uh", cls: "third" }] })],
          notes: [["Poles", poles(m.A).map(fmtC).join(", "), "", "a damped swing between coil and capacitor"]],
          python: `${pyCode}\ny, t, x = step(SYS, 0.12, return_x=True)   # y, t, x as MATLAB's [y,t,x]`, pyCheck: [Py.PY_POLES("A"), Py.polesKey(poles(m.A))],
          code: `${code(m)}\n[y,t,x] = step(SYS, 0.12);\nplot(t, x, t, y)`,
        };
      } },
    ];
    stepper(root, steps);
  },
};
