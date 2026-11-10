// The long-lived Octave worker behind runMChecks must run each snippet as if pasted alone into a fresh MATLAB. Right
// results by definition: a fresh MATLAB knows no variable the previous snippet set, keeps no global, starts in its own
// folder with the default display format and no open figure, and a snippet that fails or hangs is reported without
// taking the next one with it. Without Octave the tests are skipped and say so.
import { test } from "node:test";
import assert from "node:assert/strict";
import { octaveSkip, runOctave, runMChecks, plan } from "./octave-run.js";

const skip = octaveSkip();

test("a variable set in one snippet is not visible in the next", { skip }, async () => {
  const r = await runOctave([
    { code: "leak = 42;\nglobal G\nG = 1;\nformat long\nfigure; plot(1:3)\nfid = fopen('mine.txt','w'); fclose(fid);\n" },
    { code: "x = 1;", checks: ["exist('leak')", "numel(get(0,'children'))", "exist('mine.txt','file')", "numel(who('global'))", "numel(disp(pi))"] },
  ], { parallel: 1 });
  assert.equal(r[0].ok, true, r[0].stderr);
  assert.equal(r[1].ok, true, r[1].stderr);
  // disp(pi) in the default format is "3.1416\n": 7 characters.
  assert.deepEqual(r[1].values, [0, 0, 0, 0, 7]);
});

test("a failing snippet names its error and the next still runs", { skip }, async () => {
  const r = await runOctave([{ code: "y = undefined_name + 1;" }, { code: "z = 1 + 1;", checks: ["z"] }], { parallel: 1 });
  assert.equal(r[0].ok, false);
  assert.match(r[0].stderr, /'undefined_name' undefined/);
  assert.deepEqual(r[1].values, [2]);
});

test("a snippet that hangs is stopped at the timeout and the next still runs", { skip }, async () => {
  const r = await runOctave([{ code: "while true, end" }, { code: "a = 3;", checks: ["a"] }], { parallel: 1, timeout: 5000 });
  assert.equal(r[0].ok, false);
  assert.match(r[0].stderr, /no answer after 5 s/);
  assert.deepEqual(r[1].values, [3]);
});

test("a plotting call runs headless and the checks compare with the lab's numbers to the tolerance", { skip }, async () => {
  const views = [{ where: "x step 1 at 1", matlab: "SYS = ss(-1,1,1,0);\nstep(SYS)\nA = [1 2; 3 4];",
    check: [["A", [[1, 2], [3, 4]]], ["det(A)", -2.0001, 1e-3]] }];
  const { run } = plan(views, { "x step 1": ["A", "det(A)"] });
  assert.deepEqual(await runMChecks(run), []);
  run[0].checks[1][2] = 1e-6;
  assert.deepEqual(await runMChecks(run), ["x step 1 at 1: det(A)(1) = -2, the lab -2.0001"]);
});

test("the plan reuses the Python check's values, takes part of them, and counts the MATLAB-only views", () => {
  const views = [
    { where: "a step 1 at 1", matlab: "", check: ["xl[-1]", [3, 4], 1e-4] },
    { where: "a step 2 at 1", matlab: "", check: ["T", 1] },
    { where: "a step 3 at 1", matlab: "", check: ["T", 1] },
  ];
  const p = plan(views, { "a step 1": [["yl(end)", w => w[0]]], "a step 2": { only: "toolbox" } });
  assert.deepEqual(p.run[0].checks, [["yl(end)", 3, 1e-4]]);
  assert.deepEqual(p.only, [{ where: "a step 2 at 1", reason: "toolbox" }]);
  assert.deepEqual(p.missing, ["a step 3"]);
});
