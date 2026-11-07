// Every view's Python runs as pasted: each name is imported or bound before it is used. The check mounts every lab on
// the kit's fake page, plays every step at its start, middle and end, and scans the Python panel with the kit's
// scanner (kit/tests/code-views.js). Right result: by definition (Python stops at the first undefined name).
import { test } from "node:test";
import assert from "node:assert/strict";
import { install } from "../../../kit/tests/fake-dom.js";
import { views as play } from "../../../kit/tests/code-views.js";

/** Every view of every lab: its MATLAB, its Python and what the Python should print. */
export async function views() {
  install();
  const { labs } = await import("../../src/labs/index.js");
  return play(labs);
}

test("every view shows Python beside its MATLAB, and the Python uses no name before binding it", async () => {
  const { pyUndefined } = await import("../../../kit/tests/code-views.js");
  const all = await views();
  assert.ok(all.length >= 30 * 3, `${all.length} views played`);
  for (const v of all) {
    assert.ok(v.python.trim(), `${v.where} shows Python`);
    assert.deepEqual(pyUndefined(v.python), [], `${v.where} Python:\n${v.python}`);
  }
});
