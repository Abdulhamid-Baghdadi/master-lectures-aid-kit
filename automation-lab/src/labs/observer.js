// Beispiele 17 and 18, and the exam tasks like them: a Luenberger observer by pole placement. Step 1 compares
// coefficients in the BNF (slides p. 27); step 2 runs plant and observer from different start states and shows the
// estimate catching up; step 3 carries ℓ back to the plant's own states.
import { h, choice, slider } from "../../../kit/ui/kit.js";
import * as a from "../../../kit/ui/art.js";
import { poles, matVec, simulate, observeByBnf, observerGain, toBnf } from "../core/index.js";
import { stepper, fmt, fmtC, fmtVec, same } from "./view.js";
import { splane, grow, mtx } from "./pics.js";
import { SISO } from "./systems.js";
import { model, observerBnf, poleVec } from "./matlab.js";
import * as Py from "./python.js";

const CASES = {
  B17: { title: "Beispiel 17: System 5, s = −4 ± j4", sys: SISO.S5, poles: [[-4, 4], [-4, -4]], sheet: { source: "S1, p. 22", l: [39, 8] } },
  B18: { title: "Beispiel 18: s = −3, −4", sys: SISO.B18, poles: [[-3, 0], [-4, 0]], sheet: { source: "S1, p. 23", l: [9, 13] } },
  WH: { title: "Exam SS2014 WH GrA, RB3: s = −3 ± j", sys: SISO.B18, poles: [[-3, 1], [-3, -1]], sheet: null },
  G17: { title: "Exam SS2017 GrA, RB2: s = −1 ± j2", sys: { A: [[-4, 3], [2, -4]], b: [-2, 3], c: [-5, 5], d: 0 }, poles: [[-1, 2], [-1, -2]], sheet: null },
};
const lAc = (A, l, c) => A.map((r, i) => r.map((v, j) => v - l[i] * c[j]));

/** Plant (free, u = 0) and observer side by side: the error obeys d/dt x̃ = (A − ℓcᵀ)x̃ (slides p. 24). */
function race(S, l, T) {
  const n = S.A.length;
  const run = simulate((t, z) => {
    const x = z.slice(0, n), xh = z.slice(n), e = S.c.reduce((s, c, i) => s + c * (x[i] - xh[i]), 0);
    return [...matVec(S.A, x), ...matVec(S.A, xh).map((v, i) => v + l[i] * e)];
  }, [0.5, -0.5, 0, 0], T, 300);
  return { t: run.t, x: run.x.map(z => z.slice(0, n)), xh: run.x.map(z => z.slice(n)) };
}

export default {
  id: "observer",
  art: () => a.picture("A true state curve and an estimate that starts elsewhere and closes in on it",
    a.line([[20, 100], [60, 70], [100, 60], [140, 58], [180, 57]], a.INK, 3) + a.line([[20, 130], [50, 105], [80, 75], [120, 61], [180, 57]], a.ACC, 2, "6 4")),
  mount(root) {
    let key = "B17", wanted = CASES.B17.poles;
    const real = () => !CASES[key].poles[0][1];
    const set = () => { wanted = real() ? [[s1.get(), 0], [-s2.get(), 0]] : [[s1.get(), s2.get()], [s1.get(), -s2.get()]]; ui.refresh(); };
    const s1 = slider({ label: "Real part σ", min: -12, max: -0.5, step: 0.1, value: -4, format: v => fmt(v), onInput: set });
    const s2 = slider({ label: "Imaginary part ω", min: 0, max: 10, step: 0.1, value: 4, format: v => fmt(v), onInput: set, help: "With two real poles, the second sits at −ω." });
    const sel = choice("Exercise", Object.entries(CASES).map(([k, C]) => [k, C.title]), key, v => {
      key = v; const C = CASES[v]; wanted = C.poles; s1.set(C.poles[0][0]); s2.set(C.poles[0][1] || -C.poles[1][0]); ui.go(0);
    });
    const design = () => { const C = CASES[key], S = C.sys, o = observeByBnf(S.A, S.b, S.c, wanted); return { C, S, o }; };
    const steps = [
      { name: "Compare coefficients", draw: p => {
        const { C, S, o } = design(), bn = toBnf(S.A, S.b, S.c), k = Math.floor(p * 3);
        const open = poles(S.A), goal = poles(lAc(S.A, o.l, S.c));
        const now = open.map((q, i) => [q[0] + p * (goal[i][0] - q[0]), q[1] + p * (goal[i][1] - q[1])]);
        return {
          figure: [splane(now, { second: p >= 1 ? [] : open, label: "The eigenvalues of A − ℓcᵀ walking to the wanted observer poles" }),
            h("div", { class: "mtx-row" }, mtx("A_BNF", bn.A, {}), mtx("a", o.a, { row: true, cells: k >= 0 ? 9 : 0 }), mtx("p", o.p, { row: true, cells: k >= 1 ? 9 : 0 }),
              mtx("ℓ_BNF = p − a", o.lBnf, { cells: k >= 2 ? 9 : 0 }))],
          notes: [["ℓ_BNF", fmtVec(o.lBnf), "", "ℓ_i = p_(i−1) − a_(i−1): in the BNF, A − ℓcᵀ changes only the last column (slides p. 26)"]],
          sheet: C.sheet ? [{ source: C.sheet.source, sheet: `ℓ_BNF = (${C.sheet.l.join("; ")})`, lab: fmtVec(o.lBnf), agree: same(o.lBnf, C.sheet.l) }] : [],
          code: `${model(S)}\n${observerBnf(o.a, o.p)}`, python: `${Py.model(S)}\n${Py.observerBnf(o.a, o.p)}\nprint(l)`, pyCheck: ["l", o.l.map(v => [v])],
          hint: "The observer is the controller's mirror: Aᵀ, c take the place of A, b, and the BNF that of the RNF.",
        };
      } },
      { name: "Watch the estimate converge", draw: p => {
        const { S, o } = design(), r = race(S, o.l, 2);
        return {
          figure: grow({ p, label: "True states (solid) and the observer's estimates (dashed), from x0 = (0.5, −0.5) and x̂0 = 0", xLabel: "t [s]", yLabel: "x, x̂",
            lines: [{ x: r.t, y: r.x.map(x => x[0]), name: "x1" }, { x: r.t, y: r.xh.map(x => x[0]), name: "x̂1", cls: "faint" },
              { x: r.t, y: r.x.map(x => x[1]), name: "x2", cls: "second" }, { x: r.t, y: r.xh.map(x => x[1]), name: "x̂2", cls: "third" }] }),
          notes: [["Error poles eig(A − ℓcᵀ)", poles(lAc(S.A, o.l, S.c)).map(fmtC).join(", "), "", "the error dies away at their pace, whatever the plant does"],
            ["Plant poles", poles(S.A).map(fmtC).join(", "), poles(S.A).some(([re]) => re > 0) ? "warn" : "", poles(S.A).some(([re]) => re > 0) ? "unstable: the states grow, yet the estimate still catches them" : ""]],
          python: `${Py.model(S)}\npB = ${Py.poleList(wanted)}\nl = place(A.T, cT.T, pB).T   # MATLAB: l = place(A',cT',pB)'\nAo = np.block([[A, np.zeros((2, 2))], [l @ cT, A - l @ cT]])   # plant and observer, u = 0\nSYSo = ss(Ao, np.zeros((4, 1)), np.eye(4), 0)\nt = np.linspace(0, 2, 301)\ny, t, x = lsim(SYSo, np.zeros(len(t)), t, [0.5, -0.5, 0, 0])`,
          pyCheck: [["l", o.l.map(v => [v])], ["x[-1]", [...r.x.at(-1), ...r.xh.at(-1)], 1e-4]],
          code: `${model(S)}\npB = ${poleVec(wanted)};\nl = place(A',cT',pB)';\nAo = [A zeros(2); l*cT A-l*cT];   % plant and observer, u = 0\nSYSo = ss(Ao, zeros(4,1), eye(4), 0);\nt = linspace(0,2,301);\n[y,t,x] = lsim(SYSo, zeros(size(t)), t, [0.5; -0.5; 0; 0]);\nplot(t, x)`,
          hint: "Move the observer poles left: the estimate catches up sooner, but ℓ grows and so would the noise it amplifies.",
        };
      } },
      { name: "Back to the plant's states", draw: p => {
        const { S, o } = design(), pl = observerGain(S.A, S.c, wanted), bn = toBnf(S.A, S.b, S.c);
        return {
          figure: h("div", { class: "fly" }, h("div", { class: "mtx-row" }, mtx("S", bn.S, { cells: Math.floor(p * 5) }), mtx("ℓ = S⁻¹·ℓ_BNF", o.l, { cells: p >= 1 ? 9 : 0 }),
            mtx("place(A',cT',p)'", pl, { cells: p >= 1 ? 9 : 0 }))),
          notes: [["x_BNF = S·x", "S = Q_B,BNF⁻¹ · Q_B", "", "since Q_B,BNF = Q_B·S⁻¹; it exists because the plant is observable"], ["place gives the same", same(pl, o.l) ? "yes" : "no", same(pl, o.l) ? "" : "danger"]],
          sheet: CASES[key].sheet ? [{ source: CASES[key].sheet.source, sheet: "ℓ in BNF coordinates only", lab: `ℓ = ${fmtVec(o.l)} in the plant's states`, agree: undefined }] : [],
          python: `${Py.model(S)}\n${Py.observerBnf(o.a, o.p)}\nl_check = place(A.T, cT.T, ${Py.poleList(wanted)}).T   # the same l\nprint(l, l_check)`, pyCheck: [["l", o.l.map(v => [v])], ["l_check", pl.map(v => [v])]],
          code: `${model(S)}\n${observerBnf(o.a, o.p)}\nl_check = place(A',cT',${poleVec(wanted)})'   % the same l`,
          hint: "Beispiel 18's A is already a BNF (S = E), so there both agree with the sheet directly.",
        };
      } },
    ];
    const ui = stepper(root, steps, { controls: [sel, s1, s2] });
  },
};
