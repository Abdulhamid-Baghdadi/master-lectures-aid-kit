// Beispiele 1–3: from the equations to A, b, cᵀ, d (and B, C, D for two inputs and outputs). Step 1 carries each
// coefficient from its equation into its cell; step 2 runs the model's step response; step 3 lets it move freely
// from a start state.
import { h, choice } from "../../../kit/ui/kit.js";
import * as a from "../../../kit/ui/art.js";
import { simulate, matVec, poles } from "../core/index.js";
import { stepper, fmt, fmtC } from "./view.js";
import { mtx, terms, grow } from "./pics.js";
import { SYSTEMS, SHEETS, odeTerms, cellOrder } from "./systems.js";
import { model, modelMimo, mat, vec } from "./matlab.js";
import * as Py from "./python.js";

const eq = (P, Q) => JSON.stringify(P) === JSON.stringify(Q);
const isSiso = S => S.B[0].length === 1 && S.C.length === 1;
const pyCode = S => isSiso(S) ? Py.model({ A: S.A, b: S.B.map(r => r[0]), c: S.C[0], d: S.D[0][0] }) : Py.modelMimo(S);
const code = S => isSiso(S) ? model({ A: S.A, b: S.B.map(r => r[0]), c: S.C[0], d: S.D[0][0] }) : modelMimo(S);

/** The response of every output to a unit step on input j, or the free motion from x0. */
function run(S, T, { j = 0, x0 = null } = {}) {
  const n = S.A.length, u = x0 ? 0 : 1;
  const r = simulate((t, x) => matVec(S.A, x).map((v, i) => v + S.B[i][j] * u), x0 ?? new Array(n).fill(0), T, 300);
  return { t: r.t, x: r.x, v: S.C.map((row, i) => r.x.map(x => row.reduce((s, c, k) => s + c * x[k], 0) + S.D[i][j] * u)) };
}

export default {
  id: "models",
  art: () => a.picture("Coefficients of two differential equations moving into the cells of the matrices A and b",
    a.text(40, 50, "ẋ1 = −2x1 + 3x2", 13) + a.text(40, 72, "ẋ2 = 3x1 + 10x2", 13) + a.rect(120, 40, 60, 44, a.INK, 2) +
    a.text(136, 58, "−2", 12, a.ACC) + a.text(162, 58, "3", 12) + a.text(136, 78, "3", 12) + a.text(162, 78, "10", 12) +
    a.arrow(85, 50, 125, 56, a.ACC, 2) + a.line([[20, 120], [60, 115], [100, 95], [180, 40]], a.COOL, 2)),
  mount(root) {
    let key = "A", T = 1;
    const sel = choice("System", Object.entries(SYSTEMS).map(([k, S]) => [k, S.title]), key, v => { key = v; ui.go(0); });
    const steps = [
      { name: "Read the coefficients", draw: p => {
        const S = SYSTEMS[key], order = cellOrder(S), k = Math.min(order.length - 1, Math.floor(p * order.length)), done = p >= 1;
        const cells = M => order.filter(o => o.M === M).length;
        const before = M => order.findIndex(o => o.M === M);
        const shown = M => Math.max(0, Math.min(cells(M), (done ? order.length : k) - before(M)));
        const hot = M => (!done && order[k].M === M ? k - before(M) : -1);
        const sh = SHEETS[key];
        return {
          figure: h("div", { class: "fly" }, terms(odeTerms(S), done ? null : order[k].key),
            h("div", { class: "mtx-row" }, ...["A", "B", "C", "D"].map(M => mtx(isSiso(S) ? { A: "A", B: "b", C: "cᵀ", D: "d" }[M] : M, S[M],
              { cells: shown(M), hot: hot(M), row: M === "C" && isSiso(S) })))),
          notes: [["Now", done ? "all cells filled" : `${order[k].M}(${order[k].i + 1},${order[k].j + 1}) = ${fmt(S[order[k].M][order[k].i][order[k].j])}`, "",
            "row i of A holds the coefficients of x1 … xn in the equation for ẋi; a term that is missing is a 0"]],
          sheet: [{ source: sh.source, sheet: `A = ${mat(sh.A)}`, lab: `A = ${mat(S.A)}, ${isSiso(S) ? "b, cᵀ, d" : "B, C, D"} as well`,
            agree: ["A", "B", "C", "D"].every(M => eq(sh[M], S[M])) }],
          code: code(S), python: pyCode(S), pyCheck: ["A", S.A],
          hint: "Each row of the matrix is one equation; each column belongs to one state (A, C) or one input (B, D).",
        };
      } },
      { name: "Run a step", draw: p => {
        const S = SYSTEMS[key], r = run(S, T), unstable = poles(S.A).some(([re]) => re > 1e-9);
        return {
          figure: grow({ p, label: `The outputs after a unit step on the first input over ${T} s`, xLabel: "t [s]", yLabel: "v",
            lines: r.v.map((y, i) => ({ x: r.t, y, name: S.C.length > 1 ? `v${i + 1}` : "v", cls: i ? "second" : "" })) }),
          notes: [["Poles of A", poles(S.A).map(fmtC).join(", "), unstable ? "warn" : "", unstable ? "a pole in the right half: the response grows without bound" : "all in the left half: it settles"]],
          code: `${code(S)}\nstep(SYS, ${T})`,
          python: `${pyCode(S)}\ny, t = step(SYS, ${T})   # with two inputs, y holds every input-output pair\nprint(pole(SYS))`,
          pyCheck: [Py.PY_POLES("A"), Py.polesKey(poles(S.A))],
          hint: "A unit step on the first input from rest. With two inputs, MATLAB's step plots every input–output pair.",
        };
      } },
      { name: "Let it move freely", draw: p => {
        const S = SYSTEMS[key], x0 = S.A.map((_, i) => (i === 0 ? 1 : 0)), r = run(S, T, { x0 });
        return {
          figure: grow({ p, label: `The states moving freely from x1 = 1 over ${T} s`, xLabel: "t [s]", yLabel: "x",
            lines: S.A.map((_, i) => ({ x: r.t, y: r.x.map(x => x[i]), name: `x${i + 1}`, cls: ["", "second", "third", "faint"][i] })) }),
          notes: [["Start", `x0 = ${vec(x0)}`, "", "no input: the motion is A's alone"]],
          python: `${pyCode(S)}\nx0 = np.array(${Py.list(x0)})\nt = np.linspace(0, ${T}, 301)\ny, t, x = lsim(SYS, np.zeros((len(t), ${S.B[0].length})), t, x0)   # X0, the start state, fourth as in MATLAB`,
          pyCheck: ["x[-1]", r.x.at(-1), 1e-4],
          code: `${code(S)}\nx0 = ${vec(x0)};\nt = linspace(0,${T},301);\n[y,t,x] = lsim(SYS, zeros(numel(t),${S.B[0].length}), t, x0);\nplot(t,x)`,
          hint: "lsim with a zero input and a start state: the fourth argument is the initial state (MathWorks, lsim).",
        };
      } },
    ];
    const ui = stepper(root, steps, { controls: [sel,
      choice("Time span", [["0.5", "0.5 s"], ["1", "1 s"], ["3", "3 s"]], "1", v => { T = Number(v); ui.refresh(); })] });
  },
};
