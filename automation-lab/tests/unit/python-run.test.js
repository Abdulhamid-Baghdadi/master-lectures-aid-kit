// Every view's Python, run for real when Python with numpy and python-control is on this PC: each snippet with a check
// is written to a fresh temporary folder (a copy; nothing of the project's is touched), run with python -P, and what it
// prints must equal the lab's own numbers: gains rT, Kf and l and determinants to 1e-6 (relative), poles to 1e-6,
// lsim's states to 1e-4 against the lab's Runge–Kutta run, stepinfo to 3 % (python-control picks its own time grid).
// Right result: the lab's core, itself held by its tests against the solution sheets. Snippets that only plot carry no
// check and are held by python-defined.test.js only. Without the modules the test is skipped and says so.
import { test } from "node:test";
import assert from "node:assert/strict";
import { pythonHas, runChecks } from "../../../kit/tests/code-views.js";
import { views } from "./python-defined.test.js";

const ready = pythonHas("numpy, control");

test("every view's Python prints the lab's numbers", { skip: ready ? false : "python with numpy and control not found: install them to run this test" }, async () => {
  const runs = (await views()).filter(v => v.where.endsWith(" at 1") && v.check);
  assert.ok(runs.length >= 40, `${runs.length} snippets`);
  assert.deepEqual(await runChecks(runs, { prefix: "automation-py-", preload: ["numpy", "control"] }), []);
});
