// What the side-by-side plots of each view's Python and the lab's chart found (docs/python-check, drawn by
// ../kit/scripts/python-plots.mjs on 7 Nov 2026). Exam task 1, step 3: the run after the defect (C2 ten times larger)
// stopped at the healthy loop's time span, 0.133 s, while the slower loop was still rising (2385 rpm), and the
// "steady error" read there said −115 rpm. Right result: the defect loop's own steady state, G(0)·w of the linear loop
// (finalValue; the ±10 V limit is not active at rest): 2500 rpm, no steady error, since G(0) of the plant does not
// depend on C2. python-control's step ends at 2497 rpm, still within its 2 % band.
import { test } from "node:test";
import assert from "node:assert/strict";
import { design, P } from "../../src/labs/task1.js";
import { circuit20, finalValue } from "../../src/core/index.js";

test("exam task 1, step 3: the run after the defect lasts until the speed is steady", () => {
  const st = { s: -60, w: 40, k: 3, target: 2500 }, d = design({ ...st, defect: 10 });
  const plant = circuit20({ ...P, C2: 10 * P.C2 }, 500);
  const A = [...plant.A.map((row, i) => [...row, ...d.r.map(rj => -plant.b[i] * rj)]),
    ...d.m.A.map((row, i) => [...plant.c.map(cj => d.l[i] * cj), ...row.map((v, j) => v - d.l[i] * d.m.c[j] - d.m.b[i] * d.r[j])])];
  const b = [...plant.b, ...d.m.b].map(v => v * d.Kf), c = [...plant.c, 0, 0];
  const steady = finalValue(A, b, c, 0) * st.target;
  assert.ok(Math.abs(steady - 2500) < 1, `steady ${steady}`);
  assert.ok(Math.abs(d.obs.v.at(-1) - steady) < 0.005 * steady, `the run ends at ${d.obs.v.at(-1)} rpm, steady is ${steady}`);
});
