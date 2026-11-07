// Every MATLAB snippet a view shows runs as pasted: each variable is assigned before it is used. The snippets join a
// model with a design step, so the check runs on the joins the labs show. Right result: by definition (MATLAB stops
// at the first undefined variable). Found by the browser audit of 7 Nov 2026: the RNF/BNF routes used ARNF and ABNF
// without building them.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as M from "../../src/labs/matlab.js";

const BUILTIN = new Set(("ss tf step place acker lqr inv ctrb obsv det rank pole zero eig tf2ss fliplr eye zeros ones "
  + "numel size stepinfo").split(" "));

/** The names a snippet reads before any line assigns them. Comments and transposes are stripped first. */
export function undefinedNames(code) {
  const defined = new Set(), missing = new Set();
  const body = code.replace(/%[^\n]*/g, "").replace(/\.'/g, "").replace(/(?<=[\w)\]])'/g, "");
  for (const stmt of body.split(/[;\n]/)) {
    const m = stmt.match(/^\s*(\[[^\]]*\]|[A-Za-z_]\w*)\s*=(?!=)/);
    const rhs = m ? stmt.slice(m[0].length) : stmt;
    for (const w of rhs.match(/(?<![\w.])[A-Za-z_]\w*/g) ?? []) if (!defined.has(w) && !BUILTIN.has(w)) missing.add(w);
    if (m) for (const v of m[1].match(/[A-Za-z_]\w*/g)) defined.add(v);
  }
  return [...missing];
}

const plant = M.model({ A: [[-2, 3], [3, 10]], b: [1, -1], c: [1, 0], d: 0 });

test("the scanner finds a name used before it is assigned (by definition)", () => {
  assert.deepEqual(undefinedNames("x = y + 1;"), ["y"]);
  assert.deepEqual(undefinedNames("y = 2; x = y'*y;"), []);
});

test("pole placement by hand in RNF coordinates runs after the model", () => {
  assert.deepEqual(undefinedNames(`${plant}\n${M.placementRnf([-29, -8], [10, 2])}`), []);
});

test("the observer by hand in BNF coordinates runs after the model", () => {
  assert.deepEqual(undefinedNames(`${plant}\n${M.observerBnf([-29, -8], [40, 12])}`), []);
});

test("placement, then the observer, run after the model", () => {
  const code = `${plant}\n${M.placement([[-3, 1], [-3, -1]])}\n${M.observer([[-6, 2], [-6, -2]], 2)}`;
  assert.deepEqual(undefinedNames(code), []);
});

test("the course's normal forms from num/den run on their own", () => {
  assert.deepEqual(undefinedNames(M.normalForm([3, 2, 1], [1, 1, 2, 3], "BNF")), []);
});
