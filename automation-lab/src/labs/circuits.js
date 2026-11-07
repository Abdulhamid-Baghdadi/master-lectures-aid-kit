// Beispiele 27 and 28: two circuits with three energy stores and two outputs, which have no solution sheet; worked
// here from the task sheet's figures (pp. 28–29). Step 1 follows the one mesh into A, b, C, D; step 2 runs a step.
import { h, choice } from "../../../kit/ui/kit.js";
import * as a from "../../../kit/ui/art.js";
import { circuit27, circuit28, stepRun, poles } from "../core/index.js";
import { stepper, fmtC } from "./view.js";
import { circuitSvg, grow, mtx } from "./pics.js";
import * as Py from "./python.js";

// No component values in the task: example values, labelled as such.
const P = { C1: 100e-6, R1: 10, C2: 220e-6, R2: 4.7, L1: 50e-3 };
const CASES = {
  b27: { title: "Beispiel 27: ua → ub, uc", model: circuit27, parts: { top: [["C", "C1"], ["R", "R1"]], shunt: [["C", "C2"]], bottom: [["R", "R2"], ["L", "L1"]], inLabel: "ua", outs: ["ub", "uc"] },
    outs: ["ub = uC2", "uc = ua − uC1 − R1·i − uC2"], C: "[0 1 0; -1 -1 -R1]", D: "[0; 1]" },
  b28: { title: "Beispiel 28: u1 → u2, u3", model: circuit28, parts: { top: [["C", "C1"], ["R", "R1"], ["C", "C2"]], shunt: [["L", "L1"]], bottom: [["R", "R2"]], inLabel: "u1", outs: ["u2", "u3"] },
    outs: ["u2 = L1·di/dt = u1 − uC1 − uC2 − (R1 + R2)·i", "u3 = R2·i"], C: "[-1 -1 -(R1+R2); 0 0 R2]", D: "[1; 0]" },
};
const code = C => `C1 = 100e-6; R1 = 10; C2 = 220e-6; R2 = 4.7; L1 = 50e-3;   % example values\nA = [0 0 1/C1; 0 0 1/C2; -1/L1 -1/L1 -(R1+R2)/L1];   % x = [uC1; uC2; i]\nb = [0; 0; 1/L1];\nC = ${C.C};\nD = ${C.D};\nSYS = ss(A,b,C,D);`;
const pyCode = C => `${Py.HEAD}\n\nC1 = 100e-6   # example values\nR1 = 10\nC2 = 220e-6\nR2 = 4.7\nL1 = 50e-3\nA = np.array([[0, 0, 1/C1], [0, 0, 1/C2], [-1/L1, -1/L1, -(R1+R2)/L1]])   # x = [uC1, uC2, i]\nb = np.array([[0], [0], [1/L1]])\nC = ${Py.pyMatStr(C.C)}\nD = ${Py.pyMatStr(C.D)}\nSYS = ss(A, b, C, D)`;

export default {
  id: "circuits",
  art: () => a.picture("A loop with two capacitors, two resistors and a coil, and two output terminals on the right",
    a.line([[20, 40], [180, 40]], a.INK, 2) + a.line([[20, 120], [180, 120]], a.INK, 2) + a.line([[60, 30], [60, 50]], a.ACC, 3) + a.line([[66, 30], [66, 50]], a.ACC, 3) +
    a.resistor(110, 40) + a.resistor(80, 120) + a.rect(120, 113, 32, 14, a.INK, 2, a.INK) + a.line([[160, 75], [180, 75]], a.ACC, 3) + a.line([[160, 83], [180, 83]], a.ACC, 3)),
  mount(root) {
    let key = "b27";
    const sel = choice("Exercise", Object.entries(CASES).map(([k, C]) => [k, C.title]), key, v => { key = v; ui.go(0); });
    const steps = [
      { name: "One mesh to A, b, C, D", draw: p => {
        const C = CASES[key], m = C.model(P);
        return {
          figure: [circuitSvg({ ...C.parts, flow: p * 2, label: "The circuit: one current i through every part" }),
            h("div", { class: "mtx-row" }, mtx("A", m.A, { cells: Math.floor(p * 10) }), mtx("b", m.b, { cells: p > 0.9 ? 3 : 0 }), mtx("C", m.C, { cells: p >= 1 ? 6 : 0 }), mtx("D", m.D, { cells: p >= 1 ? 2 : 0 }))],
          notes: [["States", "x = [uC1; uC2; i]", "", "the two capacitor voltages and the coil current"], ["Mesh", "L1·di/dt = u − uC1 − uC2 − (R1 + R2)·i", "", "C1·duC1/dt = i, C2·duC2/dt = i"],
            ...C.outs.map((o, i) => [`Output ${i + 1}`, o]), ["Solution sheet", "none", "warn", "worked here from the figure; no handwritten solution exists (docs/sources/solution-sheets.md)"]],
          code: code(C), python: pyCode(C), pyCheck: [["A", m.A], ["C", m.C]], hint: "The task gives no values: the lab uses example values to draw the responses. The matrices hold for any values.",
        };
      } },
      { name: "Step of the input", draw: p => {
        const C = CASES[key], m = C.model(P), T = 0.25;
        const runs = m.C.map((row, i) => { const r = stepRun(m.A, m.b, row, m.D[i], T, 400); return { x: r.t, y: r.y, name: CASES[key].parts.outs[i], cls: i ? "second" : "" }; });
        return {
          figure: grow({ p, label: "Both outputs after a 1 V step of the input", xLabel: "t [s]", yLabel: "u [V]", lines: runs }),
          notes: [["Poles", poles(m.A).map(fmtC).join(", ")], ["After the step", "the capacitors take all the voltage", "", "i → 0, so the steady outputs follow from the capacitor voltages"]],
          code: `${code(C)}\nstep(SYS, ${T})`, python: `${pyCode(C)}\ny, t = step(SYS, ${T})\nprint(pole(SYS))`, pyCheck: [Py.PY_POLES("A"), Py.polesKey(poles(m.A))],
        };
      } },
    ];
    const ui = stepper(root, steps, { controls: [sel] });
  },
};
