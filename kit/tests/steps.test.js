// The shared step player's pure parts: fixed-step Runge–Kutta (core/ode.js) against the closed form, and the MATLAB
// number writer (ui/matlab.js). Right results: x' = −x gives e^(−t) by definition; RK4's error per unit time is of
// order h⁴, so 100 steps on [0, 1] land within 1e-9 (hand-checked bound: h⁴/120 · e^0 ≈ 8e-11).
import { test } from "node:test";
import assert from "node:assert/strict";
import { rk4Step, simulate } from "../core/index.js";
import { num, vec, mat, cplx } from "../ui/matlab.js";

test("RK4 integrates x' = −x to e^(−1) at t = 1", () => {
  const run = simulate((t, x) => [-x[0]], [1], 1, 100);
  assert.equal(run.t.length, 101);
  assert.ok(Math.abs(run.x.at(-1)[0] - Math.exp(-1)) < 1e-9);
});

test("one RK4 step of x' = t is exact (a polynomial of degree 2 in t)", () => {
  assert.ok(Math.abs(rk4Step((t) => [t], 0, [0], 0.5)[0] - 0.125) < 1e-15);
});

test("the same run twice gives the same numbers (deterministic)", () => {
  const f = (t, x) => [x[1], -Math.sin(x[0])];
  assert.deepEqual(simulate(f, [2, 0], 10, 500), simulate(f, [2, 0], 10, 500));
});

test("numbers as MATLAB input: no plus sign, six figures, exponents for the very large and small", () => {
  assert.equal(num(-0.769230769), "-0.769231");
  assert.equal(num(321e-6), "3.21e-4");
  assert.equal(vec([1, -1]), "[1; -1]");
  assert.equal(mat([[0, 1], [29, 8]]), "[0 1; 29 8]");
  assert.equal(cplx([-0.1, -1]), "-0.1-1j");
});
