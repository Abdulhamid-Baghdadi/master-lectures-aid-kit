// Every view's MATLAB, run for real in GNU Octave (with its control, signal and, for a snippet with syms, symbolic
// packages) when octave-cli is on this PC: each snippet at the end of its step is written to a fresh temporary folder (a
// copy; nothing of the project's is touched), run headless with the kit's runner (kit/tests/octave-run.js), and the
// MATLAB expressions below must give the numbers and tolerances of the view's own pyCheck. ode45's end states are held,
// as the Python's are, to 5 % of the largest value of the lab's fixed-step run: Octave's ode45 is the same
// Dormand-Prince 4(5) pair with the same defaults (RelTol 1e-3, AbsTol 1e-6), but its step choice differs from
// MATLAB's and scipy's, so only agreement within the method's error is asked for. Right result: the lab's core, itself
// held by models.test.js against the lecture notes. A view Octave cannot run is marked MATLAB-only with the reason and
// counted, not run; its MATLAB is checked on the MathWorks pages (CLAUDE.md). Without Octave the test is skipped.
import { test } from "node:test";
import assert from "node:assert/strict";
import { octaveSkip, plan, runMChecks, byReason } from "../../../kit/tests/octave-run.js";
import { views } from "./python-defined.test.js";
import { VALUES } from "../../src/core/index.js";

// Sorted real parts over sorted |imaginary parts|, as the Python checks print them.
const eig = M => `[sort(real(eig(${M}))).'; sort(abs(imag(eig(${M})))).']`;
// ode45's end state, one entry per state, as the Python's sol.y[i, -1].
const ends = n => Array.from({ length: n }, (_, i) => `x(end,${i + 1})`);
// The accelerations eq1 and eq2 give at the Python's test state at t = 0, for equations with one mass term each:
// q̈ᵢ = −lhs(eqᵢ)/mᵢ with q̈ᵢ set to 0. vals: [q1, q2, q̇1, q̇2, then the parameters as name: value].
const acc = ([q1, q2], [m1, m2], [x1, x2, v1, v2], par) => {
  const names = Object.keys(par), nums = Object.values(par);
  const d2 = `{diff(${q1},t,2), diff(${q2},t,2)}`, d1 = `{diff(${q1},t), diff(${q2},t)}`;
  const e = `[lhs(eq1)/${m1}; lhs(eq2)/${m2}]`;
  return `-double(subs(subs(subs(${e}, ${d2}, {0, 0}), ${d1}, {${v1}, ${v2}}), {${q1}, ${q2}, t, ${names.join(", ")}}, {${x1}, ${x2}, 0, ${nums.join(", ")}})).'`;
};
// The transmissibility |X₂/W| at the excitation Om, the frequency sweep's formula at one point.
const x2om = (k, c) => `abs([0 1]*((K - Om^2*M + 1i*Om*C) \\ [${k} + 1i*Om*${c}; 0]))`;

const SIMULINK = "Simulink and Simscape: not in Octave";
// MathWorks, diff: var may be "a symbolic scalar variable, symbolic function, or a derivative function", and its
// Euler-Lagrange example takes diff(L,x) of a symbolic function x(t). Octave's symbolic 3.2.2 (SymPy 1.14) stops with
// "max_recursion_depth exceeded" on diff(L,x) of a symfun x (checked 10 Nov 2026); diff(L,x(t)) works there.
const LAGRANGE = "diff(Lag, q) of a symbolic function q(t): Octave's symbolic package 3.2.2 exceeds its recursion depth";
const ODETOVF = "odeToVectorField: not in Octave's symbolic package 3.2.2";

const M = {
  "einmasse step 1": { only: LAGRANGE },
  "einmasse step 2": { only: SIMULINK },
  "einmasse step 3": [eig("A")],
  "einmasse step 4": ends(2),
  "pendel step 1": { only: LAGRANGE },
  "pendel step 2": ends(2),
  "pendel step 3": ["J0"],
  "pendel step 4": ["A"],
  "rolle step 1": ["double(subs([S dS], phi1, 1))"],
  "rolle step 2": { only: LAGRANGE },
  "rolle step 3": ends(2),
  "rolle step 4": { only: SIMULINK },
  "zweimasse step 1": ["M", "C", "K"],
  "zweimasse step 2": { only: SIMULINK },
  "zweimasse step 3": ["f0", "lam"],
  "zweimasse step 4": ends(4),
  "doppel step 1": { only: LAGRANGE },
  // Chaotic, a plot alone: held to running.
  "doppel step 2": [],
  "doppel step 3": ["E(1)"],
  "doppel step 4": ["f0"],
  "rlc step 1": { only: ODETOVF },
  "rlc step 2": { only: SIMULINK },
  "rlc step 3": [eig("A")],
  "rlc step 4": ends(2),
  "motor step 1": { only: ODETOVF },
  "motor step 2": { only: SIMULINK },
  "motor step 3": ["A"],
  "motor step 4": ends(3),
  "shaker step 1": { only: ODETOVF },
  "shaker step 2": ["U_S*dcgain(G_Ux)"],
  "shaker step 3": ["A"],
  "shaker step 4": ends(3),
  "task2 step 1": { only: LAGRANGE },
  "task2 step 2": ends(4),
  "task2 step 3": ["f0"],
  "task3 step 1": { only: LAGRANGE },
  "task3 step 2": ends(4),
  "task3 step 3": ["f0"],
  "task5 step 1": [acc(["x1", "x2"], ["m1", "m2"], [0.01, -0.02, 0.2, -0.1],
    { m1: 40, m2: 300, k1: 2e5, k2: 20000, c1: 100, c2: 1500, w0: 0.02, Om: 10 })],
  "task5 step 2": ["f0"],
  "task5 step 3": [...ends(4), x2om("k1", "c1")],
  "task6 step 1": [acc(["phi1", "phi2"], ["J1", "J2"], [0.01, -0.02, 0.2, -0.1],
    { J1: 0.02, J2: 0.05, k_T1: 50, k_T2: 80, c_T1: 0.02, c_T2: 0.02, w0: 0.1, Om: 30,
      M01: VALUES.task6.M01, M02: VALUES.task6.M02, Om1: VALUES.task6.Om1, Om2: VALUES.task6.Om2 })],
  "task6 step 2": ["f0"],
  "task6 step 3": [...ends(4), x2om("k_T1", "c_T1")],
  "task7 step 1": [acc(["x1", "x2"], ["m1", "m2"], [0.01, -0.02, 0.2, -0.1],
    { m1: 1, m2: 1, k1: 2000, k2: 750, c1: 1.6, c2: 0.2, w0: 0.01, Om: 20 })],
  "task7 step 2": ["f0"],
  "task7 step 3": [...ends(4), x2om("k1", "c1")],
  ...Object.fromEntries(["task1", "task4", "task8", "task9", "task10", "task11", "task12", "task13"].flatMap(l => [
    [`${l} step 1`, { only: LAGRANGE }],
    [`${l} step 2`, ends(4)],
    [`${l} step 3`, ["f0"]],
  ])),
};

test("every view's MATLAB gives the lab's numbers in Octave, or is marked MATLAB-only", { skip: octaveSkip() }, async t => {
  const at1 = (await views()).filter(v => v.where.endsWith(" at 1"));
  const { run, only, missing } = plan(at1, M);
  assert.deepEqual(missing, [], "each view has MATLAB checks or a MATLAB-only reason");
  assert.equal(run.length + only.length, at1.length);
  t.diagnostic(`${run.length} run in Octave; MATLAB-only: ${byReason(only).join("; ")}`);
  assert.ok(run.length >= 49, `${run.length} snippets`);
  assert.deepEqual(await runMChecks(run, { prefix: "modsim-m-" }), []);
});
