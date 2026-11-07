// Beispiele 4, 5, 7, 8 and 9: the transfer function and the course's normal forms (slides pp. 8–9). Step 1 reads
// a_i and b_i (from the equation, from G(s), or from (sE − A)⁻¹ for System A); steps 2 and 3 fill the RNF and BNF
// cell by cell; step 4 shows that all forms give the same step response.
import { h, choice } from "../../../kit/ui/kit.js";
import * as a from "../../../kit/ui/art.js";
import { ss2tf, normalForms, stepRun, poles } from "../core/index.js";
import { stepper, fmt, fmtC, same } from "./view.js";
import { mtx, grow } from "./pics.js";
import { SISO } from "./systems.js";
import { model, normalForm, vec } from "./matlab.js";
import * as Py from "./python.js";

const poly = (c, x = "s") => c.map((v, k) => [v, c.length - 1 - k]).filter(([v]) => Math.abs(v) > 1e-12)
  .map(([v, p], k) => `${v < 0 ? (k ? " − " : "−") : k ? " + " : ""}${Math.abs(v) === 1 && p ? "" : fmt(Math.abs(v))}${p ? (p > 1 ? `${x}${"⁰¹²³⁴"[p]}` : x) : ""}`).join("");

const CASES = {
  B4: { title: "Beispiel 4: v‴ + 4v″ + 8v′ + 6v = 5u″ + 2u′ + 3u", num: [5, 2, 3], den: [1, 4, 8, 6], ask: "both",
    sheet: { source: "S1, p. 5", rnfA: [[0, 1, 0], [0, 0, 1], [-6, -8, -4]], rnfC: [3, 2, 5], bnfB: [3, 2, 5] } },
  B5: { title: "Beispiele 5 and 7: System A", sys: SISO.A, ask: "RNF",
    sheet: { source: "S1, pp. 6–7 and 9", G: "(s − 13)/(s² − 8s − 29)", rnfA: [[0, 1], [29, 8]], rnfC: [-13, 1] } },
  B8: { title: "Beispiel 8: G = (3s² + 2s + 1)/(s³ + s² + 2s + 3)", num: [3, 2, 1], den: [1, 1, 2, 3], ask: "RNF",
    sheet: { source: "S1, p. 10", rnfA: [[0, 1, 0], [0, 0, 1], [-3, -2, -1]], rnfC: [1, 2, 3] } },
  B9: { title: "Beispiel 9: G = (s² + 2s + 3)/(s³ + 3s² + 2s + 1)", num: [1, 2, 3], den: [1, 3, 2, 1], ask: "BNF",
    sheet: { source: "S1, p. 11", bnfA: [[0, 0, -1], [1, 0, -2], [0, 1, -3]], bnfB: [3, 2, 1] } },
};
const tfOf = C => C.sys ? ss2tf(C.sys.A, C.sys.b, C.sys.c, C.sys.d) : { num: C.num, den: C.den };

export default {
  id: "normalforms",
  art: () => a.picture("A companion matrix: ones above the diagonal and the negative coefficients in its last row",
    a.rect(50, 30, 100, 90, a.INK, 2) + a.text(75, 55, "0", 14) + a.text(100, 55, "1", 14, a.ACC) + a.text(125, 55, "0", 14) +
    a.text(75, 80, "0", 14) + a.text(100, 80, "0", 14) + a.text(125, 80, "1", 14, a.ACC) + a.text(75, 105, "−a0", 12, a.COOL) + a.text(100, 105, "−a1", 12, a.COOL) + a.text(125, 105, "−a2", 12, a.COOL)),
  mount(root) {
    let key = "B4";
    const sel = choice("Exercise", Object.entries(CASES).map(([k, C]) => [k, C.title]), key, v => { key = v; ui.go(0); });
    const fill = (M, p) => ({ cells: Math.floor(p * M.flat().length * 1.0001), hot: p < 1 ? Math.floor(p * M.flat().length) : -1 });
    const steps = [
      { name: "Read G(s)", draw: p => {
        const C = CASES[key], G = tfOf(C), nf = normalForms(G.num, G.den), n = nf.a.length;
        const items = [...nf.a.map((v, i) => [`a${i}`, v]), ...nf.b.map((v, i) => [`b${i}`, v])], k = Math.floor(p * items.length);
        return {
          figure: h("div", { class: "fly" },
            C.sys ? h("p", { class: "ode" }, `(sE − A)⁻¹ = adj(sE − A)/det(sE − A), det(sE − A) = ${poly(G.den)}`) : null,
            h("p", { class: "gs" }, `G(s) = (${poly(G.num.slice(G.num.findIndex(v => Math.abs(v) > 1e-12)))}) / (${poly(G.den)})`),
            h("div", { class: "mtx-row" }, items.map(([name, v], i) => h("span", { class: i === k ? "coef hot" : i < k || p >= 1 ? "coef" : "coef wait" }, `${name} = ${fmt(v)}`)))),
          notes: [["Order", `n = ${n}`, "", "a_i and b_i are numbered from the constant term, with det(sE − A) made monic"]],
          sheet: C.sheet.G ? [{ source: C.sheet.source, sheet: `G(s) = ${C.sheet.G}`, lab: `G(s) = (${poly(G.num.slice(1))})/(${poly(G.den)})`, agree: same(G.num.slice(1), [1, -13]) && same(G.den, [1, -8, -29]) }] : [],
          python: C.sys ? `${Py.model(C.sys)}\nG = tf(SYS)\nprint(G)` : `${Py.HEAD}\n\nnum = ${Py.list(C.num)}\nden = ${Py.list(C.den)}\nG = tf(num, den)\nprint(G)`,
          pyCheck: ["G.den[0][0]", G.den],
          code: C.sys ? `${model(C.sys)}\nG = tf(SYS)` : `num = ${vec(C.num, false)};\nden = ${vec(C.den, false)};\nG = tf(num,den)`,
          hint: C.sys ? "G(s) = cᵀ(sE − A)⁻¹b + d (slides p. 9): the adjugate's first row times b gives the numerator." : "The equation's coefficients are G's: Laplace turns each derivative into a power of s.",
        };
      } },
      { name: "Fill the RNF", draw: p => {
        const C = CASES[key], G = tfOf(C), { rnf } = normalForms(G.num, G.den), f = fill(rnf.A, p);
        const sheet = C.sheet.rnfA ? [{ source: C.sheet.source, sheet: `last row ${vec(C.sheet.rnfA.at(-1), false)}, cᵀ = ${vec(C.sheet.rnfC, false)}`,
          lab: `last row ${vec(rnf.A.at(-1), false)}, cᵀ = ${vec(rnf.c, false)}`, agree: same(C.sheet.rnfA.flat(), rnf.A.flat()) && same(C.sheet.rnfC, rnf.c) }] : [];
        return {
          figure: h("div", { class: "fly" }, h("div", { class: "mtx-row" }, mtx("A_RNF", rnf.A, f), mtx("b_RNF", rnf.b, { cells: p >= 1 ? 9 : 0 }),
            mtx("cᵀ_RNF", rnf.c, { row: true, cells: p >= 1 ? 9 : 0 }), mtx("d", [rnf.d], { cells: p >= 1 ? 1 : 0 }))),
          notes: [["Pattern", "ones above the diagonal, −a_i in the last row", "", "b = [0 … 0 1]ᵀ, cᵀ = [b0 … b_(n−1)] (slides p. 8)"]],
          sheet, code: normalForm(G.num, G.den, "RNF"), python: Py.normalForm(G.num, G.den, "RNF"), pyCheck: [["ARNF", rnf.A], ["cTRNF", [rnf.c]]],
          hint: "MATLAB's tf2ss returns the companion form with −a in the first row and b = [1 0 … 0]ᵀ; reversing the order of the states (P = fliplr(eye(n))) gives the course's RNF.",
        };
      } },
      { name: "Fill the BNF", draw: p => {
        const C = CASES[key], G = tfOf(C), { bnf } = normalForms(G.num, G.den), f = fill(bnf.A, p);
        const sheet = C.sheet.bnfB ? [{ source: C.sheet.source, sheet: `b = ${vec(C.sheet.bnfB)}${C.sheet.bnfA ? `, last column ${vec(C.sheet.bnfA.map(r => r.at(-1)))}` : ""}`,
          lab: `b = ${vec(bnf.b)}, last column ${vec(bnf.A.map(r => r.at(-1)))}`, agree: same(C.sheet.bnfB, bnf.b) && (!C.sheet.bnfA || same(C.sheet.bnfA.flat(), bnf.A.flat())) }] : [];
        return {
          figure: h("div", { class: "fly" }, h("div", { class: "mtx-row" }, mtx("A_BNF", bnf.A, f), mtx("b_BNF", bnf.b, { cells: p >= 1 ? 9 : 0 }),
            mtx("cᵀ_BNF", bnf.c, { row: true, cells: p >= 1 ? 9 : 0 }), mtx("d", [bnf.d], { cells: p >= 1 ? 1 : 0 }))),
          notes: [["Pattern", "ones below the diagonal, −a_i in the last column", "", "b = [b0 … b_(n−1)]ᵀ, cᵀ = [0 … 0 1] (slides p. 9): the RNF transposed, b and c swapped"]],
          sheet, code: normalForm(G.num, G.den, "BNF"), python: Py.normalForm(G.num, G.den, "BNF"), pyCheck: [["ABNF", bnf.A], ["bBNF", bnf.b.map(v => [v])]],
        };
      } },
      { name: "Same G, same step", draw: p => {
        const C = CASES[key], G = tfOf(C), { rnf, bnf } = normalForms(G.num, G.den), T = 6;
        const runs = [[rnf, "RNF", ""], [bnf, "BNF", "second"], ...(C.sys ? [[C.sys, "System A", "third"]] : [])]
          .map(([m, name, cls]) => { const r = stepRun(m.A, m.b, m.c, m.d, T, 300); return { x: r.t, y: r.y, name, cls }; });
        const pl = poles(rnf.A), unstable = pl.some(([re]) => re > 0);
        return {
          figure: grow({ p, lines: runs, label: "Step responses of the normal forms, drawn over each other", xLabel: "t [s]", yLabel: "v", yMax: unstable ? 50 : undefined, yMin: unstable ? -50 : undefined }),
          notes: [["Poles", pl.map(fmtC).join(", "), unstable ? "danger" : "", unstable ? "a pole in the right half: unstable (slides p. 10)" : "all in the left half: stable"]],
          sheet: key === "B5" ? [{ source: "S1, p. 7", sheet: "s1 ≈ 10.7, s2 ≈ −2.7: unstable", lab: pl.map(fmtC).join(", "), agree: true }] : [],
          python: `${Py.normalForm(G.num, G.den, "RNF")}\nprint(pole(SYS))\ny, t = step(SYS, ${T})`, pyCheck: [Py.PY_POLES("ARNF"), Py.polesKey(pl)],
          code: `${normalForm(G.num, G.den, "RNF")}\npole(SYS)\nstep(SYS, ${T})`,
          hint: "The forms differ only in the choice of states: G(s), the poles and the step response stay the same.",
        };
      } },
    ];
    const ui = stepper(root, steps, { controls: [sel] });
  },
};
