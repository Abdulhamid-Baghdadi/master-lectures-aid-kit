// Beispiele 23–26: the tangent method (slides p. 57). Step 1 lays the tangent on sin y and shows the error grow
// with the angle; step 2 swings the pendulum of Beispiel 23 with the nonlinear and the linear model; step 3 fills
// A, b, cᵀ, d of Beispiele 24–26 entry by entry, each the slope of one term at x0 = 0.
import { h, choice, slider } from "../../../kit/ui/kit.js";
import * as a from "../../../kit/ui/art.js";
import { simulate, tangent } from "../core/index.js";
import { stepper, fmt, same } from "./view.js";
import { grow, mtx, pendulumSvg } from "./pics.js";
import { vec, mat, num } from "./matlab.js";
import * as Py from "./python.js";

const K = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const CASES = {
  bsp24: { title: "Beispiel 24 (K1 … K11 set to 1 … 11, example values)", params: { K },
    f: "[-(K(2)*x(1)*cos(x(1)) + K(3)*sin(x(2)) + K(4)*u)/K(1); -(K(6)*sin(x(1)) + K(7)*x(2)*cos(x(2)) + K(8)*u)/K(5)]", g: "K(9)*x(1) + K(10)*x(2) + K(11)*u",
    sheet: { source: "M, p. 58", text: "A = [−K2/K1 −K3/K1; −K6/K5 −K7/K5], b = [−K4/K1; −K8/K5], cᵀ = [K9 K10], d = K11",
      A: [[-2, -3], [-6 / 5, -7 / 5]], b: [-4, -8 / 5], c: [9, 10], d: 11 } },
  bsp25: { title: "Beispiel 25", params: {},
    f: "[-2*sin(x(1)) - 3*x(2)*cos(x(2)) - 4*x(3) - 3*u; 2*x(1) + 2*tan(x(2)) + x(3) + u; -6*x(1) - 7*x(2)^2 - 8*x(3) - 9*u]", g: "-2*x(1) - 3*x(2) - 4*x(3) - 5*u",
    sheet: { source: "M, p. 60", A: [[-2, -3, -4], [2, 2, 1], [-6, 0, -8]], b: [-3, 1, -9], c: [-2, -3, -4], d: -5 } },
  bsp26: { title: "Beispiel 26", params: {},
    f: "[-2*sin(x(1)) - 3*x(2)*cos(x(2)) - 4*sin(x(3)) - 3*u; sin(x(1)) + 2*tan(x(2)) + x(3) + u; -6*x(1) - 7*x(2) - 8*x(3) - 9*u]", g: "-2*x(1) - 3*x(2) - 4*x(3) - 5*u",
    sheet: { source: "M, p. 62", A: [[-2, -3, -4], [1, 2, 1], [-6, -7, -8]], b: [-3, 1, -9], c: [-2, -3, -4], d: -5 } },
};

export default {
  id: "linearise",
  art: () => a.picture("The curve sin y and its tangent y through the origin, parting as the angle grows",
    a.line([[20, 75], [180, 75]], a.DIM, 1) + a.path("M20 125 Q60 125 100 75 T180 25", a.INK, 3) + a.line([[40, 135], [160, 15]], a.ACC, 2, "6 4")),
  mount(root) {
    let y0 = 30, D = 0.5, w = 2, key = "bsp25";
    const ang = slider({ label: "Angle", unit: "°", min: 5, max: 90, step: 1, value: y0, format: v => `${v.toFixed(0)}°`, onInput: v => { y0 = v; ui.refresh(); },
      help: "Steps 1 and 2: the angle the tangent is read at, and the pendulum's start." });
    const dS = slider({ label: "Damping D (example value)", min: 0, max: 2, step: 0.05, value: D, format: v => fmt(v), onInput: v => { D = v; ui.refresh(); } });
    const wS = slider({ label: "ω (example value)", unit: "s⁻¹", min: 0.5, max: 4, step: 0.1, value: w, format: v => `${fmt(v)} s⁻¹`, onInput: v => { w = v; ui.refresh(); } });
    const sel = choice("Step 3: exercise", Object.entries(CASES).map(([k, C]) => [k, C.title]), key, v => { key = v; ui.go(2); });
    const steps = [
      { name: "Lay the tangent on sin y", draw: p => {
        const Y = y0 * Math.PI / 180, ys = Array.from({ length: 121 }, (_, i) => -Math.PI / 2 + i * Math.PI / 120), at = Y * p;
        const F = Math.abs((Math.sin(Y) - Y) / Math.sin(Y));
        return {
          figure: grow({ p: 1, label: "sin y and its tangent y at y0 = 0, with the point read off", xLabel: "y [rad]", yLabel: "f(y)", yMin: -1.6, yMax: 1.6,
            lines: [{ x: ys, y: ys.map(Math.sin), name: "sin y", noTip: true }, { x: ys, y: ys, name: "tangent y", cls: "second", noTip: true }],
            marks: [{ x: at, y: Math.sin(at), shape: "dot" }, { x: at, y: at, shape: "dot", cls: "second" }] }),
          notes: [["At", `${y0}° = ${fmt(Y, 3)} rad`], ["sin y", fmt(Math.sin(Y), 4)], ["Relative error F", `${fmt(100 * F, 3)} %`, F > 0.02 ? "warn" : "",
            "F = |(f − y_t)/f| (slides p. 58); the slides allow small swings only, 5–10° for a pendulum (p. 59)"]],
          python: `import numpy as np\n\ny = np.linspace(-np.pi/2, np.pi/2, 121)   # plot y, np.sin(y) and the tangent y\ny1 = ${num(Y)}\nF = abs((np.sin(y1) - y1)/np.sin(y1))\nprint(F)`, pyCheck: ["F", F],
          code: `y = linspace(-pi/2, pi/2, 121);\nplot(y, sin(y), y, y)   % tangent at y0 = 0: sin(0) + cos(0)*(y - 0)\ny1 = ${num(Y)};\nF = abs((sin(y1) - y1)/sin(y1))`,
          hint: "The tangent is the first Taylor polynomial: sin y ≈ y, cos y ≈ 1 near 0.",
        };
      } },
      { name: "Swing the pendulum", draw: p => {
        const Y = y0 * Math.PI / 180, T = 10;
        const nl = simulate((t, [y, yd]) => [yd, -D * yd - w * w * Math.sin(y)], [Y, 0], T, 500);
        const li = simulate((t, [y, yd]) => [yd, -D * yd - w * w * y], [Y, 0], T, 500);
        const k = Math.min(500, Math.floor(p * 500));
        return {
          figure: [pendulumSvg(nl.x[k][0], li.x[k][0], "The pendulum by the nonlinear model (solid) and the linear one (faint), side by side"),
            grow({ p, label: "y(t) of both models", xLabel: "t [s]", yLabel: "y [rad]", lines: [{ x: nl.t, y: nl.x.map(x => x[0]), name: "ÿ + Dẏ + ω² sin y = 0" }, { x: li.t, y: li.x.map(x => x[0]), name: "ÿ + Dẏ + ω² y = 0", cls: "second" }] })],
          notes: [["Linear model", "A = [0 1; −ω² −D], b = 0", "", "x1 = y, x2 = ẏ (S2, p. 13; M, p. 56)"]],
          sheet: [{ source: "S2, p. 13", sheet: "ÿ + D·ẏ + ω²·y = 0", lab: "the same, by sin y ≈ y", agree: true }],
          python: `${Py.HEAD}\nfrom scipy.integrate import solve_ivp\n\nD = ${num(D)}\nw = ${num(w)}\nA = np.array([[0, 1], [-w**2, -D]])\nf = lambda t, x: [x[1], -D*x[1] - w**2*np.sin(x[0])]   # ode45's @(t,x)\nsol = solve_ivp(f, [0, 10], [${num(Y)}, 0])   # RK45 with rtol 1e-3, atol 1e-6 by default, as ode45's RelTol and AbsTol; sol.y has one ROW per state, ode45 one row per time\nSYS = ss(A, np.zeros((2, 1)), [[1, 0]], 0)\ntl = np.linspace(0, 10, 501)\nyl, tl, xl = lsim(SYS, np.zeros(len(tl)), tl, [${num(Y)}, 0])`,
          pyCheck: [["sol.y[:, -1]", nl.x.at(-1), 0.05, Math.max(...nl.x.flat().map(Math.abs))], ["xl[-1]", li.x.at(-1), 1e-4]],
          code: `D = ${num(D)}; w = ${num(w)};\nA = [0 1; -w^2 -D];\n[t,yn] = ode45(@(t,x) [x(2); -D*x(2) - w^2*sin(x(1))], [0 10], [${num(Y)}; 0]);\nSYS = ss(A, [0; 0], [1 0], 0);\ntl = linspace(0,10,501);\nyl = lsim(SYS, zeros(size(tl)), tl, [${num(Y)}; 0]);\nplot(t, yn(:,1), tl, yl)`,
          hint: "At large angles the real pendulum swings slower than the linear one, so the two drift apart.",
        };
      } },
      { name: "Fill A, b, cᵀ, d", draw: p => {
        const C = CASES[key], L = tangent(key, C.params), n = L.A.length, total = n * n + 2 * n + 1, k = Math.floor(p * total);
        const parts = [["A", L.A, n * n], ["b", L.b, n], ["cᵀ", L.c, n], ["d", [L.d], 1]];
        let off = 0;
        const shown = parts.map(([name, M, size]) => { const m = mtx(name, M, { row: name === "cᵀ", cells: Math.max(0, k - off), hot: p < 1 && k >= off && k < off + size ? k - off : -1 }); off += size; return m; });
        const sh = C.sheet, agree = same(L.A.flat(), sh.A.flat()) && same(L.b, sh.b) && same(L.c, sh.c) && same([L.d], [sh.d]);
        return {
          figure: h("div", { class: "fly" }, h("p", { class: "ode" }, `f(x, u) = ${C.f.replaceAll("*", "·")}`), h("div", { class: "mtx-row" }, ...shown)),
          notes: [["Each entry", "∂fᵢ/∂xⱼ at x0 = 0, u0 = 0", "", "sin x → x, cos x → 1, tan x → x, x² → 0, x·cos x → x"]],
          sheet: [{ source: sh.source, sheet: sh.text ?? `A = ${mat(sh.A)}, b = ${vec(sh.b)}, cᵀ = ${vec(sh.c, false)}, d = ${sh.d}`, lab: `A = ${mat(L.A.map(r => r.map(v => Number(v.toFixed(6)))))}`, agree }],
          python: `${Py.HEAD}\n\n${key === "bsp24" ? "K = np.arange(1, 12)   # example values; K[0] is K1\n" : ""}f = lambda x, u: ${Py.pyVec(C.f)}\ng = lambda x, u: ${Py.pyExpr(C.g)}\nn = ${n}\nx0 = np.zeros(n)\nu0 = 0\nh = 1e-6\nA = np.zeros((n, n))\ncT = np.zeros((1, n))\nfor j in range(n):\n    e = np.zeros(n)\n    e[j] = h\n    A[:, j] = (f(x0+e, u0) - f(x0-e, u0))/(2*h)\n    cT[0, j] = (g(x0+e, u0) - g(x0-e, u0))/(2*h)\nb = ((f(x0, u0+h) - f(x0, u0-h))/(2*h)).reshape(-1, 1)\nd = (g(x0, u0+h) - g(x0, u0-h))/(2*h)\nSYS = ss(A, b, cT, d)\nprint(SYS)`,
          pyCheck: [["A", L.A, 1e-5], ["b", L.b.map(v => [v]), 1e-5]],
          code: `${key === "bsp24" ? "K = 1:11;   % example values\n" : ""}f = @(x,u) ${C.f};\ng = @(x,u) ${C.g};\nn = ${n}; x0 = zeros(n,1); u0 = 0; h = 1e-6;\nA = zeros(n); cT = zeros(1,n);\nfor j = 1:n\n  e = zeros(n,1); e(j) = h;\n  A(:,j) = (f(x0+e,u0) - f(x0-e,u0))/(2*h);\n  cT(j) = (g(x0+e,u0) - g(x0-e,u0))/(2*h);\nend\nb = (f(x0,u0+h) - f(x0,u0-h))/(2*h);\nd = (g(x0,u0+h) - g(x0,u0-h))/(2*h);\nSYS = ss(A,b,cT,d)`,
          hint: "Solve each equation for its ẋi first: a leading −ẋ or K1·ẋ divides the whole row.",
        };
      } },
    ];
    const ui = stepper(root, steps, { controls: [ang, dS, wS, sel] });
  },
};
