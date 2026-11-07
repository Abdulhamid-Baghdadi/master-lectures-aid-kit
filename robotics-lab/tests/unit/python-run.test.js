// Every stepped view's Python, run for real when Python with numpy is on this PC: the snippet, written to a fresh
// folder in the system's temporary directory (a copy; nothing of the project's is touched), must end with its named
// variable equal to the lab's own number. Right result: the lab's core, itself held by core.test.js against the slides.
// Run with -P (the script's folder is not put on the import path; numpy lives in the user's site-packages, which -I
// would hide). Without Python or numpy the test is skipped and says so; MATLAB is not installed, so its snippets are only scanned.
import { test } from "node:test";
import assert from "node:assert/strict";
import { pythonHas, runChecks } from "../../../kit/tests/code-views.js";
import { views } from "./code-defined.test.js";

const ready = pythonHas("numpy");

test("every stepped view's Python ends with the lab's numbers", { skip: ready ? false : "python with numpy not found: install it to run this test" }, async () => {
  // At p = 1 only: the start and the middle of a step run the same code with other numbers.
  const runs = (await views()).filter(v => v.where.endsWith(" at 1") && v.check);
  assert.ok(runs.length >= 9, `${runs.length} snippets`);
  assert.deepEqual(await runChecks(runs, { prefix: "robotics-py-" }), []);
});
