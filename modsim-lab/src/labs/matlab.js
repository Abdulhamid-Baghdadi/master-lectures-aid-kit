// The MATLAB a student would type for a view, written from the view's current values in the source's symbols, in the
// style of the group's own scripts (syms with symbolic functions of t, T and V written by hand, the Lagrange operator
// applied with diff). Only text: no page, no law. Calls as the MathWorks reference pages give them (read 7 Nov 2026;
// bibliography.json): diff(f, diff(x(t),t)) differentiates by a derivative (the page's own Euler–Lagrange example);
// odeToVectorField orders the states Y[1] = x, Y[2] = dx/dt and returns that order as S; matlabFunction(V,'vars',
// {'t','Y'}) makes the handle ode45 takes; ode45(odefun,tspan,y0) wants odefun(t,y) to return a column and returns
// one row of y per time; eig(K,M) solves K*V = M*V*D; bode returns the magnitude as a ratio, not in dB.
import { num, vec, mat } from "../../../kit/ui/matlab.js";
export { num, vec, mat };

/** "m = 1; k = 400;" from [[name, value, comment?]], one line per group of names. */
export const assign = list => list.map(([n, v, c]) => `${n} = ${typeof v === "number" ? num(v) : v};${c ? `   % ${c}` : ""}`).join("\n");

/** The Lagrange recipe with symbols (VO p. 11: d/dt ∂L/∂q̇ − ∂L/∂q + ∂D/∂q̇ = Q). q: coordinates; names: the other
 *  symbols; T, V, D in MATLAB; Q the generalised forces, one per coordinate. */
export function lagrange({ q, names, T, V, D = "0", Q }) {
  const lines = [`syms ${q.map(c => `${c}(t)`).join(" ")} ${names.join(" ")}`,
    `T = ${T};   % kinetic energy`, `V = ${V};   % potential energy`, `D = ${D};   % Rayleigh dissipation function`,
    "Lag = T - V;   % L is taken: the lengths are L"];
  q.forEach((c, i) => lines.push(`eq${i + 1} = diff(diff(Lag, diff(${c}(t),t)), t) - diff(Lag, ${c}) + diff(D, diff(${c}(t),t)) == ${Q[i]}`));
  return lines.join("\n");
}
/** From the Lagrange equations to ode45 symbolically: numbers in with subs, odeToVectorField, matlabFunction. */
export const toOde45 = ({ eqs, subsNames, subsValues, T, y0 }) => [
  `eqs = subs([${eqs.join(" ")}], [${subsNames.join(" ")}], [${subsValues.map(num).join(" ")}]);`,
  "[Vf,S] = odeToVectorField(eqs)   % S: the order of the states, read it before setting y0",
  "f = matlabFunction(Vf,'vars',{'t','Y'});",
  `[tt,Y] = ode45(f,[0 ${num(T)}],${vec(y0)});`, "plot(tt,Y(:,1))"].join("\n");

/** The numeric route: the parameters, the ODE as an anonymous function f = @(t,x) [...], ode45, a plot. */
export const ode = ({ params, rows, x0, T, plot = "plot(t,x(:,1))", note }) => [
  assign(params), `f = @(t,x) [${rows.join("; ...\n            ")}];${note ? `   % ${note}` : ""}`,
  `[t,x] = ode45(f,[0 ${num(T)}],${vec(x0)});   % one row of x per time`, plot].join("\n");

/** The linear model: A, B, C, D with ss, the poles with eig, and one response. */
export const stateSpace = ({ params, A, B, C, D = "0", then = ["eig(A)", "step(sys)"] }) => [
  assign(params), `A = ${A};`, `B = ${B};`, `C = ${C};`, `D = ${D};`, "sys = ss(A,B,C,D);", ...then].filter(Boolean).join("\n");

/** The Simulink model in words, block by block, as comments under the parameters it reads from the workspace. */
export const simulink = ({ params, rows, simscape }) => [
  "% Simulink: the parameters below in the workspace, then these blocks:", assign(params),
  ...rows.flatMap((r, i) => [`% row ${i + 1}: ${r.input} -> Sum (${r.signs}) -> Gain ${r.gain} -> Integrator (IC ${r.ics[0]}) -> ${r.states[1]}`,
    `%        -> Integrator (IC ${r.ics[1]}) -> ${r.states[2]} -> Scope`,
    ...r.feedback.map(fb => `%        ${fb.from === 2 ? r.states[2] : r.states[1]} -> ${fb.gain.startsWith("Fcn") ? fb.gain : `Gain ${fb.gain}`} -> back into the Sum`)]),
  ...(simscape ? [`% Simscape: ${simscape}`] : [])].join("\n");

/** The eigenfrequencies of M ẍ + K x = 0 with eig(K,M), as the TM3 note writes it. */
export const eigKM = ({ params, K, M }) => [assign(params), `K = ${K};`, `M = ${M};`,
  "[EV,EW] = eig(K,M);   % K*EV = M*EV*EW: EW holds lambda = omega^2", "om0 = sqrt(diag(EW))", "f0 = om0/(2*pi)"].join("\n");
