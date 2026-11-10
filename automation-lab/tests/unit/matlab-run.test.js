// Every view's MATLAB, run for real in GNU Octave (with its control and signal packages) when octave-cli is on this
// PC: each snippet at the end of its step is written to a fresh temporary folder (a copy; nothing of the project's is
// touched), run headless with the kit's runner (kit/tests/octave-run.js), and the MATLAB expressions below must give
// the numbers and tolerances of the view's own pyCheck. Right result: the lab's core, itself held by its tests against
// the solution sheets. A view Octave cannot run (a function it lacks, or one whose result differs from MATLAB's by
// definition) is marked MATLAB-only with the reason and counted, not run; its MATLAB is checked on the MathWorks pages
// (CLAUDE.md). Without Octave the test is skipped and says so.
import { test } from "node:test";
import assert from "node:assert/strict";
import { octaveSkip, plan, runMChecks, byReason } from "../../../kit/tests/octave-run.js";
import { views } from "./python-defined.test.js";

// Sorted real parts over sorted |imaginary parts|, as the Python checks print them.
const eig = M => `[sort(real(eig(${M}))).'; sort(abs(imag(eig(${M})))).']`;
const STEPINFO = "stepinfo: not in Octave's control package 4.2.1";
// MathWorks, tf2ss: MATLAB returns the controller canonical form (−a in the first row); Octave's signal package
// returns another realisation of the same transfer function, so the matrices differ while the poles agree.
const TF2SS = "tf2ss: Octave's signal package returns another realisation than MATLAB's controller canonical form";

const M = {
  "models step 1": ["A"],
  "models step 2": [eig("A")],
  "models step 3": ["x(end,:)"],
  "normalforms step 1": ["G.den{1}"],
  "normalforms step 2": { only: TF2SS },
  "normalforms step 3": { only: TF2SS },
  "normalforms step 4": [eig("ARNF")],
  "ctrbobsv step 1": ["det(QS)"],
  "ctrbobsv step 2": ["det(QB)"],
  "ctrbobsv step 3": [eig("A"), "x(end,:)"],
  "placement step 1": ["rT"],
  "placement step 2": { only: STEPINFO },
  "placement step 3": ["rT"],
  "placement step 4": ["Kf"],
  "observer step 1": ["l"],
  "observer step 2": ["l", "x(end,:)"],
  "observer step 3": ["l", "l_check"],
  "combined step 1": ["rT", "Kf"],
  "combined step 2": ["l"],
  "combined step 3": [eig("Arb")],
  "combined step 4": ["x(end,[1 3])"],
  "linearise step 1": ["F"],
  // lsim's first output is y = phi alone where the Python keeps both states.
  "linearise step 2": ["yn(end,:)", ["yl(end)", w => w[0]]],
  "linearise step 3": ["A", "b"],
  "circuit step 1": ["A"],
  "circuit step 2": ["det(QS)", "det(QB)"],
  "circuit step 3": [eig("A")],
  "motor step 1": ["A", "bz"],
  "motor step 2": ["60*y(end)"],
  "motor step 3": ["60*y(end)"],
  "crane step 1": ["A", "b"],
  "crane step 2": ["max(abs(x(:,1)))*180/pi"],
  "circuits step 1": ["A", "C"],
  "circuits step 2": [eig("A")],
  "task0 step 1": ["Uncontrollable_states", "det(ctrb(A,b))"],
  "task0 step 2": ["rT", "Kf"],
  "task0 step 3": { only: STEPINFO },
  "task1 step 1": { only: STEPINFO },
  "task1 step 2": ["l"],
  "task1 step 3": [eig("Arb")],
  // Octave 11.3 with control 4.2.1, checked 10 Nov 2026: place(A,b,p) here returns rT = [1476.8 -66.3 17.6 27.5],
  // whose closed loop repeats the pair −0.375 ± 0.905j and lacks −0.905 ± 0.375j (in any order of p); acker(A,b,p)
  // in the same Octave gives the lab's rT, as does python-control. MATLAB's place places any conjugate-closed set.
  "task2 step 1": { only: "place: Octave's control package misplaces the four Butterworth poles (acker in Octave agrees with the lab)" },
  "task2 step 2": ["rT"],
  "task2 step 3": ["l"],
  "task2 step 4": { only: "pidtune and pidtuneOptions: not in Octave's control package 4.2.1" },
};

test("every view's MATLAB gives the lab's numbers in Octave, or is marked MATLAB-only", { skip: octaveSkip() }, async t => {
  const ends = (await views()).filter(v => v.where.endsWith(" at 1"));
  const { run, only, missing } = plan(ends, M);
  assert.deepEqual(missing, [], "each view has MATLAB checks or a MATLAB-only reason");
  assert.equal(run.length + only.length, ends.length);
  t.diagnostic(`${run.length} run in Octave; MATLAB-only: ${byReason(only).join("; ")}`);
  assert.ok(run.length >= 37, `${run.length} snippets`);
  assert.deepEqual(await runMChecks(run, { prefix: "automation-m-" }), []);
});
