// Every view's Python, run for real when Python with numpy, scipy, sympy and python-control is on this PC: each snippet
// with a check is written to a fresh temporary folder (a copy; nothing of the project's is touched), run with python -P,
// and what it prints must equal the lab's own numbers: eigenfrequencies and poles to 1e-6 (relative); the accelerations
// sympy's Lagrange equations give at a test state to 1e-9 against the lab's equation of motion; solve_ivp's final
// state, with its default tolerances (rtol 1e-3, atol 1e-6, as ode45's), to 5 % of the largest value of the lab's
// fixed-step run. Right result: the lab's core, itself held by models.test.js against the lecture notes. Simulink and
// Simscape views and plot-only views carry no check and are held by python-defined.test.js only.
import { test } from "node:test";
import assert from "node:assert/strict";
import { pythonHas, runChecks } from "../../../kit/tests/code-views.js";
import { views } from "./python-defined.test.js";

const ready = pythonHas("numpy, scipy, sympy, control");

test("every view's Python prints the lab's numbers", { skip: ready ? false : "python with numpy, scipy, sympy and control not found: install them to run this test" }, async () => {
  const runs = (await views()).filter(v => v.where.endsWith(" at 1") && v.check);
  assert.ok(runs.length >= 30, `${runs.length} snippets`);
  assert.deepEqual(await runChecks(runs, { prefix: "modsim-py-" }), []);
});
