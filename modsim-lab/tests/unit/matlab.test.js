// The MATLAB each view shows (src/labs/matlab.js): for known cases the generated code equals the expected text, written
// out by hand from the lecture's equations (VO pp. 7, 11) and the MathWorks reference pages (bibliography.json).
import { test } from "node:test";
import assert from "node:assert/strict";
import * as M from "../../src/labs/matlab.js";

test("the Lagrange recipe for the single mass: T, V, D, L = T − V, and diff by the derivative (MathWorks, diff)", () => {
  assert.equal(M.lagrange({ q: ["x"], names: ["m", "k", "c", "F_1"], T: "1/2*m*diff(x,t)^2", V: "1/2*k*x^2", D: "1/2*c*diff(x,t)^2", Q: ["F_1"] }), [
    "syms x(t) m k c F_1", "T = 1/2*m*diff(x,t)^2;   % kinetic energy", "V = 1/2*k*x^2;   % potential energy",
    "D = 1/2*c*diff(x,t)^2;   % Rayleigh dissipation function", "Lag = T - V;   % L is taken: the lengths are L",
    "eq1 = diff(diff(Lag, diff(x(t),t)), t) - diff(Lag, x) + diff(D, diff(x(t),t)) == F_1"].join("\n"));
});

test("the numeric route: f = @(t,x) [...] returns a column, ode45(f,tspan,x0) (MathWorks, ode45)", () => {
  assert.equal(M.ode({ params: [["m", 1], ["k", 400]], rows: ["x(2)", "-k*x(1)/m"], x0: [0.1, 0], T: 5 }), [
    "m = 1;", "k = 400;", "f = @(t,x) [x(2); ...\n            -k*x(1)/m];",
    "[t,x] = ode45(f,[0 5],[0.1; 0]);   % one row of x per time", "plot(t,x(:,1))"].join("\n"));
});

test("eig(K,M) gives λ = ω², as the TM3 note writes it (MathWorks, eig: K*V = M*V*D)", () => {
  assert.equal(M.eigKM({ params: [["m1", 1]], K: "[2750 -750; -750 750]", M: "[m1 0; 0 1]" }), [
    "m1 = 1;", "K = [2750 -750; -750 750];", "M = [m1 0; 0 1];", "[EV,EW] = eig(K,M);   % K*EV = M*EV*EW: EW holds lambda = omega^2",
    "om0 = sqrt(diag(EW))", "f0 = om0/(2*pi)"].join("\n"));
});

test("odeToVectorField, then matlabFunction with 'vars' {'t','Y'}, then ode45 (MathWorks, odeToVectorField)", () => {
  const code = M.toOde45({ eqs: ["eq1"], subsNames: ["m", "k"], subsValues: [1, 400], T: 2, y0: [0.1, 0] });
  assert.match(code, /\[Vf,S\] = odeToVectorField\(eqs\)/);
  assert.match(code, /f = matlabFunction\(Vf,'vars',\{'t','Y'\}\);/);
  assert.match(code, /\[tt,Y\] = ode45\(f,\[0 2\],\[0\.1; 0\]\);/);
});

test("the Simulink text names each block, its gain and its initial condition", () => {
  const code = M.simulink({ params: [["m", 1]], rows: [{ input: "F", signs: "+ − −", gain: "1/m", states: ["a", "v", "x"], ics: ["0", "0"], feedback: [{ from: 1, gain: "c" }, { from: 2, gain: "k" }] }] });
  assert.match(code, /% row 1: F -> Sum \(\+ − −\) -> Gain 1\/m -> Integrator \(IC 0\) -> v/);
  assert.match(code, /%        v -> Gain c -> back into the Sum/);
  assert.match(code, /%        x -> Gain k -> back into the Sum/);
});
