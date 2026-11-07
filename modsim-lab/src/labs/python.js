// The Python beside each view's MATLAB, written to read as close to it as possible: sympy for the Lagrange recipe
// (symbols, Function, diff, solve), scipy's solve_ivp with f = lambda t, x: [...] for ode45's @(t,x) [...],
// scipy.linalg.eig(K, M) for eig(K,M), python-control's MATLAB layer for ss and step. Only text: no page, no law.
// Calls as the reference pages give them and as the installed versions behave (both checked 7 Nov 2026;
// bibliography.json). Where Python differs from MATLAB, the snippet says so: solve_ivp's default is RK45 with
// rtol 1e-3 and atol 1e-6 (ode45's RelTol and AbsTol defaults), and sol.y holds one row per state where ode45 returns
// one row per time; scipy.linalg.eig returns complex eigenvalues in no promised order, so they are sorted; sympy has no
// odeToVectorField, so solve gives the accelerations; Simulink and Simscape have no Python counterpart.
import { num, list } from "../../../kit/ui/python.js";
export { num, list };

export const HEAD = "import numpy as np\nfrom scipy.integrate import solve_ivp\nimport matplotlib.pyplot as plt";
export const HEAD_SS = "import numpy as np\nfrom control.matlab import ss, step, tf";
export const HEAD_EIG = "import numpy as np\nfrom scipy.linalg import eig";
export const HEAD_SYM = "import sympy as sp\nfrom sympy import symbols, Function, diff, solve, Eq, Rational, sin, cos, sqrt";

/** A MATLAB expression of the labs' own as numpy: 0-based x[i], **, np.sin. */
export const pyExpr = e => e.replace(/\bx\((\d+)\)/g, (_, i) => `x[${i - 1}]`).replace(/\.?\^/g, "**").replace(/\.\*/g, "*").replace(/\.\//g, "/")
  .replace(/(?<![\w.])(sin|cos|tan|sqrt|exp)\(/g, "np.$1(").replace(/(?<![\w.])pi\b/g, "np.pi");
/** A MATLAB expression as sympy: ** for ^, and a fraction of two integers exact (Rational(1, 2), not 0.5). */
export const symExpr = e => e.replace(/\^/g, "**").replace(/(?<![\w.)*])(\d+)\/(\d+)(?![\w.(])/g, "Rational($1, $2)");
/** "[a b; c d]" of MATLAB expressions as np.array. */
export const pyMatStr = e => `np.array([${e.trim().slice(1, -1).split(";").map(r => `[${pyExpr(r.trim()).split(/\s+/).join(", ")}]`).join(", ")}])`;

/** "m = 1   # kg" lines from [[name, value, comment?]]. */
export const assign = items => items.map(([n, v, c]) => `${n} = ${typeof v === "number" ? num(v) : pyExpr(v)}${c ? `   # ${c}` : ""}`).join("\n");

/** The Lagrange recipe with sympy (VO p. 11), then the accelerations alone. check: { values: {name: number},
 *  state: [q…, q̇…] } adds the line that prints them at that state, for the run test; returns { code, expr }. */
export function lagrange({ q, names, T, V, D = "0", Q, check }) {
  const dd = c => `diff(${c}, t, 2)`;
  const lines = [HEAD_SYM, "", "t = symbols('t')", `${names.join(", ")}${names.length === 1 ? "," : ""} = symbols('${names.join(" ")}')`,
    ...q.map(c => `${c} = Function('${c}')(t)`),
    `T = ${symExpr(T)}   # kinetic energy`, `V = ${symExpr(V)}   # potential energy`, `D = ${symExpr(D)}   # Rayleigh dissipation function`,
    "Lag = T - V   # L is taken: the lengths are L"];
  q.forEach((c, i) => lines.push(`eq${i + 1} = Eq(diff(diff(Lag, diff(${c}, t)), t) - diff(Lag, ${c}) + diff(D, diff(${c}, t)), ${symExpr(Q[i])})`));
  lines.push(`acc = solve([${q.map((_, i) => `eq${i + 1}`).join(", ")}], [${q.map(dd).join(", ")}], dict=True)[0]   # the accelerations alone: sympy has no odeToVectorField`,
    `print([sp.simplify(acc[${dd("c")}]) for c in (${q.join(", ")}${q.length === 1 ? "," : ""})])`.replace(/diff\(c, t, 2\)/, "diff(c, t, 2)"));
  if (!check) return { code: lines.join("\n"), expr: null };
  const n = q.length, s = check.state;
  lines.push(`vel = {${q.map((c, i) => `diff(${c}, t): ${num(s[n + i])}`).join(", ")}}   # a test state`,
    `at = {${[...q.map((c, i) => `${c}: ${num(s[i])}`), ...Object.entries(check.values).map(([k, v]) => `${k}: ${num(v)}`)].join(", ")}}`,
    `a = [float(acc[diff(c, t, 2)].subs(vel).subs(at)) for c in (${q.join(", ")}${n === 1 ? "," : ""})]`, "print(a)");
  return { code: lines.join("\n"), expr: "a" };
}

/** The numeric route: the parameters, f = lambda t, x: [...] as ode45's @(t,x), solve_ivp, a plot. */
export const ode = ({ params, rows, x0, T, plot = "plt.plot(sol.t, sol.y[0])", pre = [] }) => [HEAD, "", assign(params), ...pre,
  `f = lambda t, x: [${rows.map(pyExpr).join(",\n                  ")}]`,
  `sol = solve_ivp(f, [0, ${num(T)}], ${list(x0)})   # RK45 with rtol 1e-3, atol 1e-6 by default, as ode45's RelTol and AbsTol; sol.y: one ROW per state (ode45: one row per time)`,
  plot, "plt.show()"].filter(s => s !== "").join("\n");
/** The checks of an ode snippet: each final state within 5 % of the largest value the lab's run reaches. */
export const odeCheck = r => r.x[0].map((_, i) => [`sol.y[${i}, -1]`, r.x.at(-1)[i], 0.05, Math.max(...r.x.map(x => Math.abs(x[i])), 1e-12)]);

/** The linear model: ss from python-control's MATLAB layer, the poles, a step. */
export const stateSpace = ({ params, A, B, C, D = "0", step = true }) => [HEAD_SS, "", assign(params), `A = ${pyMatStr(A)}`, `B = ${pyMatStr(B)}`,
  `C = ${pyMatStr(C)}`, `D = ${D.startsWith("[") ? pyMatStr(D) : D}`, "sys = ss(A, B, C, D)", "print(np.linalg.eigvals(A))",
  ...(step ? ["y, t = step(sys)   # y first, then t, as MATLAB's [y,t]"] : [])].filter(s => s !== "").join("\n");

/** Simulink in words: no Python counterpart, so the parameters and the blocks as comments. */
export const simulink = ({ params, rows, simscape }) => [
  "# Simulink and Simscape have no Python counterpart: the same model is the ODE that solve_ivp integrates (see the",
  "# view with the motion). The parameters, then the blocks as MATLAB builds them:", assign(params),
  ...rows.map((r, i) => `# row ${i + 1}: ${r.input} -> Sum (${r.signs}) -> Gain ${r.gain} -> two Integrators -> ${r.states[2]}`),
  ...(simscape ? [`# Simscape: ${simscape}`] : [])].join("\n");

/** The eigenfrequencies of M x'' + K x = 0 with scipy.linalg.eig(K, M). */
export const eigKM = ({ params, K, M }) => [HEAD_EIG, "", assign(params), `K = ${pyMatStr(K)}`, `M = ${pyMatStr(M)}`,
  "lam, EV = eig(K, M)   # K @ EV = M @ EV * lam; lam complex and in no set order (MATLAB sorts this symmetric case)",
  "om0 = np.sqrt(np.sort(lam.real))", "f0 = om0/(2*np.pi)", "print(f0)"].join("\n");

/** The poles of a matrix, for a check: real parts and |imaginary parts|, each sorted. */
export const PY_POLES = M => `[np.sort(np.linalg.eigvals(${M}).real), np.sort(np.abs(np.linalg.eigvals(${M}).imag))]`;
export const polesKey = pl => [pl.map(p => p[0]).sort((x, y) => x - y), pl.map(p => Math.abs(p[1])).sort((x, y) => x - y)];
