// Every stepped view's MATLAB, run for real in GNU Octave when octave-cli is on this PC: each snippet at the end of its
// step is written to a fresh temporary folder (a copy; nothing of the project's is touched), run headless with the
// kit's runner (kit/tests/octave-run.js), and the MATLAB expressions below must give the numbers of the view's own
// pyCheck. Right result: the lab's core, itself held by core.test.js against the slides. The views built on the
// Robotics System Toolbox (rigidBodyTree, getTransform, geometricJacobian, inverseKinematics) have no Octave
// counterpart: they are marked MATLAB-only and counted, not run; their calls are checked on the MathWorks pages
// (CLAUDE.md). Without Octave the test is skipped and says so.
import { test } from "node:test";
import assert from "node:assert/strict";
import { octaveSkip, plan, runMChecks, byReason } from "../../../kit/tests/octave-run.js";
import { views } from "./code-defined.test.js";

const RST = "Robotics System Toolbox (rigidBodyTree): not in Octave";

const M = {
  "dhsteps step 1": { only: RST },
  "dhsteps step 2": { only: RST },
  "irbsteps step 1": { only: RST },
  "irbsteps step 2": { only: RST },
  "irbsteps step 3": { only: RST },
  "jacsteps step 1": { only: RST },
  "jacsteps step 2": { only: RST },
  // One row per elbow, angles in degrees, as the Python's sols.
  "iksteps step 1": ["rad2deg([t1 t2])"],
  "iksteps step 2": ["rad2deg([t1 t2 t3])"],
  "iksteps step 3": { only: RST },
};

test("every stepped view's MATLAB gives the lab's numbers in Octave, or is marked MATLAB-only", { skip: octaveSkip() }, async t => {
  const ends = (await views()).filter(v => v.where.endsWith(" at 1"));
  const { run, only, missing } = plan(ends, M);
  assert.deepEqual(missing, [], "each view has MATLAB checks or a MATLAB-only reason");
  t.diagnostic(`${run.length} run in Octave; MATLAB-only: ${byReason(only).join("; ")}`);
  assert.ok(run.length >= 2, `${run.length} snippets`);
  assert.deepEqual(await runMChecks(run, { prefix: "robotics-m-", parallel: 2 }), []);
});
