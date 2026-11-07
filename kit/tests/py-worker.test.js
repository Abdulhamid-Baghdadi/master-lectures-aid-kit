// The long-lived Python worker behind runChecks must run each snippet as if pasted alone into a fresh python. Right
// results by definition: a fresh interpreter knows no name the previous snippet bound, starts in its own folder, has
// no open figure, and a snippet that fails or hangs is reported without taking the next one with it.
import { test } from "node:test";
import assert from "node:assert/strict";
import { pythonHas, runSnippets } from "./code-views.js";

const ready = pythonHas("numpy");
const skip = ready ? false : "python with numpy not found: install it to run this test";

test("a name bound in one snippet is not visible in the next", { skip }, async () => {
  const r = await runSnippets([
    "leak = 42\nimport numpy as np\nnp.set_printoptions(precision=2)\nimport os\nopen('mine.txt', 'w').write('x')\nprint('a')",
    "print('leak' in globals(), 'np' in globals())\nimport numpy as np, os\nprint(np.get_printoptions()['precision'], os.path.exists('mine.txt'))",
  ], { parallel: 1 });
  assert.equal(r[0].ok, true, r[0].stderr);
  assert.equal(r[1].ok, true, r[1].stderr);
  assert.equal(r[1].stdout, "False False\n8 False\n");
});

test("a failing snippet names its error and the next still runs", { skip }, async () => {
  const r = await runSnippets(["print(undefined_name)", "print(1 + 1)"], { parallel: 1 });
  assert.equal(r[0].ok, false);
  assert.match(r[0].stderr, /NameError: name 'undefined_name' is not defined/);
  assert.equal(r[1].stdout, "2\n");
});

test("a snippet that hangs is stopped at the timeout and the next still runs", { skip }, async () => {
  const r = await runSnippets(["import time\ntime.sleep(60)", "print('after')"], { parallel: 1, timeout: 5000 });
  assert.equal(r[0].ok, false);
  assert.match(r[0].stderr, /no answer after 5 s/);
  assert.equal(r[1].stdout, "after\n");
});
