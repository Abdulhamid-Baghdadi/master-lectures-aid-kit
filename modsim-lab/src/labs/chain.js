// Task sheet 5 (quarter car under road excitation), 6 (two-disc torsional oscillator) and 7 (hanging two-mass chain
// shaken at its top): the same equations in other letters, worked here with the lecture's method, since the sheet gives
// figures only. The path excitation w(t) moves the free end of spring 1 and damper 1.
import { h } from "../../../kit/ui/kit.js";
import * as a from "../../../kit/ui/art.js";
import { stepper, fmt, mtx, grow } from "../../../kit/ui/steps.js";
import { chain2, torsion2, run, VALUES } from "../core/index.js";
import { massChain } from "./pics.js";
import { reveal, memo, sliders, caption, at } from "./view.js";
import { ode, eigKM, assign } from "./matlab.js";
import * as Py from "./python.js";

const NOTE = "No solution sheet; worked here.";
const KIND = {
  task5: { page: 3, labels: ["m₁ (wheel)", "m₂ (body)"], coord: "x", unit: "m", mass: "m", k: "k", c: "c", vertical: true, hang: false,
    words: "the road lifts the tyre spring", art: "A quarter car: a wheel mass on a tyre spring over a moving road, a body mass on the suspension spring and damper above" },
  task6: { page: 3, labels: ["J₁", "J₂"], coord: "φ", unit: "rad", mass: "J", k: "k_T", c: "c_T", vertical: false, hang: false,
    words: "the shaft's end is turned by w(t)", art: "Two discs on a shaft, joined by torsion springs and dampers, the left end turned back and forth" },
  task7: { page: 4, labels: ["m₁", "m₂"], coord: "x", unit: "m", mass: "m", k: "k", c: "c", vertical: true, hang: true,
    words: "the suspension point is shaken by w(t)", art: "Two masses hanging one below the other on springs and dampers, the top point shaken up and down" },
};

function make(id) {
  const K = KIND[id], q = K.coord, T = 3, tor = id === "task6";
  // Task 6 as drawn (PDF p. 3): M₁(t) on J₁ and M₂(t) on J₂ besides w(t), each at its own frequency.
  const chain2_ = st => tor ? torsion2(st) : chain2(st);
  const sim = memo(st => run(chain2_(st), [0, 0, 0, 0], T, 6000));
  const P = st => [[`${K.mass}1`, st.m1], [`${K.mass}2`, st.m2], [`${K.k}1`, st.k1], [`${K.k}2`, st.k2], [`${K.c}1`, st.c1], [`${K.c}2`, st.c2], ["w0", st.w0, `${K.unit}, amplitude of w`], ["Om", st.Om, "rad/s"],
    ...(tor ? [["M01", st.M01, "N*m"], ["M02", st.M02, "N*m"], ["Om1", st.Om1, "rad/s"], ["Om2", st.Om2, "rad/s"]] : [])];
  // The torques as they enter each equation (python.js turns cos into np.cos).
  const Mt = tor ? [" + M01*cos(Om1*t)", " + M02*cos(Om2*t)"] : ["", ""];
  const Ms = tor ? [" - M01*cos(Om1*t)", " - M02*cos(Om2*t)"] : ["", ""];
  const [m1, m2, k1, k2, c1, c2] = P({}).map(p => p[0]);
  const chain = (xs, w, label, extra = {}) => massChain({ xs, base: w, labels: K.labels, scale: K.unit === "rad" ? 200 : 2000, vertical: K.vertical, hang: K.hang, label, ...extra });
  return {
    id,
    art: () => a.picture(K.art, K.vertical
      ? a.line([[60, 140], [140, 140]], a.HOT, 3) + a.path("M100 140 l0 -6 l-8 -4 l16 -6 l-16 -6 l8 -4 l0 -6", a.INK, 2) + a.rect(80, 88, 40, 20, a.INK, 3)
        + a.path("M100 88 l0 -6 l-8 -4 l16 -6 l-16 -6 l8 -4 l0 -6", a.INK, 2) + a.rect(70, 20, 60, 36, a.ACC, 3)
      : a.line([[10, 80], [190, 80]], a.INK, 3) + a.rect(70, 50, 14, 60, a.ACC, 3) + a.rect(140, 40, 16, 80, a.COOL, 3) + a.path("M20 60 a20 20 0 0 1 0 40", a.HOT, 3)),
    mount(root) {
      const st = { ...VALUES[id] };
      const ui = { refresh: () => {} };
      const u = K.unit === "rad" ? "kg·m²" : "kg", ku = K.unit === "rad" ? "N·m/rad" : "N/m";
      const controls = sliders(st, [["m1", `${K.mass}₁`, st.m1 / 5, st.m1 * 3, st.m1 / 20, u], ["m2", `${K.mass}₂`, st.m2 / 5, st.m2 * 3, st.m2 / 20, u],
        ["k1", `${K.k}₁`, st.k1 / 5, st.k1 * 3, st.k1 / 50, ku], ["k2", `${K.k}₂`, st.k2 / 5, st.k2 * 3, st.k2 / 50, ku], ["c2", `${K.c}₂`, 0, st.c2 * 4 + 1, (st.c2 * 4 + 1) / 100, ""],
        ["Om", "Excitation Ω", 1, 120, 1, "rad/s"],
        ...(tor ? [["M01", "Torque amplitude M₀₁", 0, 2, 0.05, "N·m"], ["M02", "Torque amplitude M₀₂", 0, 2, 0.05, "N·m"], ["Om1", "Torque frequency Ω₁", 1, 120, 1, "rad/s"], ["Om2", "Torque frequency Ω₂", 1, 120, 1, "rad/s"]] : [])], () => ui.refresh());
      const steps = [
        { name: "Cut free → M, C, K and the excitation", draw: p => {
          const c = chain2_(st), n = Math.floor(p * 12);
          return {
            figure: [chain([0, 0], 0, `The chain cut free: ${K.words}`, { show: Math.ceil(p * 3) }),
              reveal([`${K.mass}₁${q}̈₁ + ${K.c}₁(${q}̇₁ − ẇ) + ${K.k}₁(${q}₁ − w) − ${K.c}₂(${q}̇₂ − ${q}̇₁) − ${K.k}₂(${q}₂ − ${q}₁) = ${tor ? "M₁(t)" : "0"}`,
                `${K.mass}₂${q}̈₂ + ${K.c}₂(${q}̇₂ − ${q}̇₁) + ${K.k}₂(${q}₂ − ${q}₁) = ${tor ? "M₂(t)" : "0"}`,
                `w(t) = ŵ₀ cos(Ωt): it enters as ${K.k}₁w + ${K.c}₁ẇ on mass 1`,
                ...(tor ? ["M₁(t) = M₀₁ cos(Ω₁t), M₂(t) = M₀₂ cos(Ω₂t): torques on J₁ and J₂, as drawn; the phases φ₁, φ₂ taken 0"] : []),
                ...(K.vertical ? ["coordinates from the static rest: the weight and the springs' preload cancel"] : [])], p),
              h("div", { class: "mtx-row" }, mtx("M", c.M, { cells: n }), mtx("C", c.Cd, { cells: n - 4 }), mtx("K", c.K, { cells: n - 8 }))],
            notes: [["Source", NOTE, "", `task sheet p. ${K.page}: the figure only; symbols ${K.k}, ${K.c} chosen here`]],
            code: ["syms " + `${q === "φ" ? "phi1(t) phi2(t)" : "x1(t) x2(t)"} ${m1} ${m2} ${k1} ${k2} ${c1} ${c2} w0 Om${tor ? " M01 M02 Om1 Om2" : ""}`,
              `w = w0*cos(Om*t);`,
              q === "φ" ? `eq1 = ${m1}*diff(phi1,t,2) + ${c1}*(diff(phi1,t) - diff(w,t)) + ${k1}*(phi1 - w) - ${c2}*(diff(phi2,t) - diff(phi1,t)) - ${k2}*(phi2 - phi1)${Ms[0]} == 0` : `eq1 = ${m1}*diff(x1,t,2) + ${c1}*(diff(x1,t) - diff(w,t)) + ${k1}*(x1 - w) - ${c2}*(diff(x2,t) - diff(x1,t)) - ${k2}*(x2 - x1) == 0`,
              q === "φ" ? `eq2 = ${m2}*diff(phi2,t,2) + ${c2}*(diff(phi2,t) - diff(phi1,t)) + ${k2}*(phi2 - phi1)${Ms[1]} == 0` : `eq2 = ${m2}*diff(x2,t,2) + ${c2}*(diff(x2,t) - diff(x1,t)) + ${k2}*(x2 - x1) == 0`].join("\n"),
            python: (([a, b]) => [Py.HEAD_SYM, "", "t = symbols('t')", `${m1}, ${m2}, ${k1}, ${k2}, ${c1}, ${c2}, w0, Om${tor ? ", M01, M02, Om1, Om2" : ""} = symbols('${m1} ${m2} ${k1} ${k2} ${c1} ${c2} w0 Om${tor ? " M01 M02 Om1 Om2" : ""}')`,
              `${a} = Function('${a}')(t)`, `${b} = Function('${b}')(t)`, "w = w0*cos(Om*t)",
              `eq1 = Eq(${m1}*diff(${a}, t, 2) + ${c1}*(diff(${a}, t) - diff(w, t)) + ${k1}*(${a} - w) - ${c2}*(diff(${b}, t) - diff(${a}, t)) - ${k2}*(${b} - ${a})${Ms[0]}, 0)`,
              `eq2 = Eq(${m2}*diff(${b}, t, 2) + ${c2}*(diff(${b}, t) - diff(${a}, t)) + ${k2}*(${b} - ${a})${Ms[1]}, 0)`,
              `acc = solve([eq1, eq2], [diff(${a}, t, 2), diff(${b}, t, 2)], dict=True)[0]   # the accelerations alone`,
              `vel = {diff(${a}, t): 0.2, diff(${b}, t): -0.1}   # a test state at t = 0`,
              `at = {${a}: 0.01, ${b}: -0.02, ${m1}: ${Py.num(st.m1)}, ${m2}: ${Py.num(st.m2)}, ${k1}: ${Py.num(st.k1)}, ${k2}: ${Py.num(st.k2)}, ${c1}: ${Py.num(st.c1)}, ${c2}: ${Py.num(st.c2)}, w0: ${Py.num(st.w0)}, Om: ${Py.num(st.Om)}${tor ? `, M01: ${Py.num(st.M01)}, M02: ${Py.num(st.M02)}, Om1: ${Py.num(st.Om1)}, Om2: ${Py.num(st.Om2)}` : ""}}`,
              `a = [float(acc[diff(c, t, 2)].subs(vel).subs(at).subs(t, 0)) for c in (${a}, ${b})]`, "print(a)"].join("\n"))(q === "φ" ? ["phi1", "phi2"] : ["x1", "x2"]),
            pyCheck: ["a", chain2_(st).f(0, [0.01, -0.02, 0.2, -0.1]).slice(2), 1e-9],
          };
        } },
        { name: "Eigenfrequencies and modes", draw: p => {
          const c = chain2_(st), j = p < 0.5 ? 0 : 1, md = c.modes[j], ph = Math.sin(2 * Math.PI * 3 * ((p % 0.5) * 2));
          const amp = (K.unit === "rad" ? 0.3 : 0.02) / Math.max(...md.v.map(Math.abs));
          return {
            figure: chain(md.v.map(v => amp * v * ph), 0, `Eigenmode ${j + 1}: ${md.v[1] > 0 ? "both move together" : "they move against each other"}`),
            notes: c.modes.map((m, i) => [`Mode ${i + 1}`, `f = ${fmt(m.f)} Hz`, "", `shape ${q}₂/${q}₁ = ${fmt(m.v[1])}`]),
            code: eigKM({ params: P(st).slice(0, 4), K: `[${k1}+${k2} -${k2}; -${k2} ${k2}]`, M: `[${m1} 0; 0 ${m2}]` }),
            python: Py.eigKM({ params: P(st).slice(0, 4), K: `[${k1}+${k2} -${k2}; -${k2} ${k2}]`, M: `[${m1} 0; 0 ${m2}]` }), pyCheck: ["f0", c.modes.map(m => m.f)],
          };
        } },
        { name: tor ? "Driven by w(t), M₁ and M₂: the response" : "Driven by w(t): the response", draw: p => {
          const c = chain2_(st), r = sim(st), k = at(r, p);
          const fs = Array.from({ length: 300 }, (_, i) => 0.05 + i * Math.max(3, 2 * c.modes[1].f) / 299);
          return {
            figure: [chain([r.x[k][0], r.x[k][1]], c.w(r.t[k]), tor ? "The discs turned by w(t), M₁(t) and M₂(t), to scale" : "The chain moved by w(t), to scale"),
              grow({ p, label: `w and the response ${q}₁, ${q}₂${tor ? " (with M₁, M₂)" : ""}`, xLabel: "t [s]", yLabel: `[${K.unit === "rad" ? "rad" : "mm"}]`,
                lines: [{ x: r.t, y: r.t.map(t => (K.unit === "rad" ? 1 : 1000) * c.w(t)), name: "w", cls: "faint" }, { x: r.t, y: r.x.map(x => (K.unit === "rad" ? 1 : 1000) * x[0]), name: `${q}₁` }, { x: r.t, y: r.x.map(x => (K.unit === "rad" ? 1 : 1000) * x[1]), name: `${q}₂`, cls: "second" }] }),
              grow({ p: 1, label: `Transmissibility |${q}₂/ŵ₀| over the excitation frequency${tor ? " (w(t) alone)" : ""}`, xLabel: "f [Hz]", yLabel: `|${q}₂/ŵ₀|`, lines: [{ x: fs, y: fs.map(f => c.transmit(2 * Math.PI * f)), name: "|x₂/ŵ₀|", noTip: true }] }),
              caption(`Values: ${VALUES[id].source}. ${NOTE}`)],
            notes: [["Now: Ω", `${fmt(st.Om / (2 * Math.PI))} Hz`, "", `|${q}₂/ŵ₀| = ${fmt(c.transmit(st.Om))} in steady state`]],
            code: [ode({ params: P(st), rows: ["x(3)", "x(4)", `(-${c1}*(x(3) + w0*Om*sin(Om*t)) - ${k1}*(x(1) - w0*cos(Om*t)) + ${c2}*(x(4)-x(3)) + ${k2}*(x(2)-x(1))${Mt[0]})/${m1}`, `(-${c2}*(x(4)-x(3)) - ${k2}*(x(2)-x(1))${Mt[1]})/${m2}`], x0: [0, 0, 0, 0], T, plot: "plot(t,x(:,1:2))" }),
              `M = [${m1} 0; 0 ${m2}]; K = [${k1}+${k2} -${k2}; -${k2} ${k2}]; C = [${c1}+${c2} -${c2}; -${c2} ${c2}];`,
              "f = linspace(0.05,20,2000);",
              `X2 = arrayfun(@(om) abs([0 1]*((K - om^2*M + 1i*om*C) \\ [${k1} + 1i*om*${c1}; 0])), 2*pi*f);`, "plot(f,X2)   % transmissibility"].join("\n"),
            python: [Py.ode({ params: P(st), rows: ["x(3)", "x(4)", `(-${c1}*(x(3) + w0*Om*sin(Om*t)) - ${k1}*(x(1) - w0*cos(Om*t)) + ${c2}*(x(4)-x(3)) + ${k2}*(x(2)-x(1))${Mt[0]})/${m1}`, `(-${c2}*(x(4)-x(3)) - ${k2}*(x(2)-x(1))${Mt[1]})/${m2}`], x0: [0, 0, 0, 0], T, plot: "plt.plot(sol.t, sol.y[0], sol.t, sol.y[1])" }),
              `M = np.array([[${m1}, 0], [0, ${m2}]])`, `K = np.array([[${k1}+${k2}, -${k2}], [-${k2}, ${k2}]])`, `C = np.array([[${c1}+${c2}, -${c2}], [-${c2}, ${c2}]])`,
              "f = np.linspace(0.05, 20, 2000)", `X2 = [abs(np.linalg.solve(K - om**2*M + 1j*om*C, [${k1} + 1j*om*${c1}, 0])[1]) for om in 2*np.pi*f]   # MATLAB's arrayfun and \\`,
              `X2_Om = abs(np.linalg.solve(K - Om**2*M + 1j*Om*C, [${k1} + 1j*Om*${c1}, 0])[1])   # at the excitation now`, "plt.plot(f, X2)   # transmissibility"].join("\n"),
            pyCheck: [...Py.odeCheck(r), ["X2_Om", c.transmit(st.Om), 1e-9]],
          };
        } },
      ];
      Object.assign(ui, stepper(root, steps, { controls }));
    },
  };
}

export const task5 = make("task5");
export const task6 = make("task6");
export const task7 = make("task7");
