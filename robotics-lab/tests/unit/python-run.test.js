// Every stepped view's Python, run for real when Python with numpy is on this PC: the snippet, written to a fresh
// folder in the system's temporary directory (a copy; nothing of the project's is touched), must end with its named
// variable equal to the lab's own number. Right result: the lab's core, itself held by core.test.js against the slides.
// Run with -P (the script's folder is not put on the import path; numpy lives in the user's site-packages, which -I
// would hide). Without Python or numpy the test is skipped and says so; MATLAB is not installed, so its snippets are only scanned.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { views } from "./code-defined.test.js";

const probe = spawnSync("python", ["-P", "-c", "import numpy"], { encoding: "utf8" });
const ready = probe.status === 0;

test("every stepped view's Python ends with the lab's numbers", { skip: ready ? false : "python with numpy not found: install it to run this test" }, async () => {
  const dir = mkdtempSync(join(tmpdir(), "robotics-py-"));
  try {
    // At p = 1 only: the start and the middle of a step run the same code with other numbers.
    const runs = (await views()).filter(v => v.where.endsWith(" at 1") && v.check);
    assert.ok(runs.length >= 9, `${runs.length} snippets`);
    for (const [k, v] of runs.entries()) {
      const [name, want] = v.check, file = join(dir, `s${k}.py`);
      writeFileSync(file, `${v.python}\nimport json as _json\nprint("@@" + _json.dumps(np.asarray(${name}, dtype=float).tolist()))\n`, "utf8");
      const r = spawnSync("python", ["-P", file], { encoding: "utf8", cwd: dir });
      assert.equal(r.status, 0, `${v.where}: Python stopped:\n${r.stderr}`);
      const got = JSON.parse(r.stdout.split("\n").find(l => l.startsWith("@@")).slice(2));
      const a = [got].flat(Infinity), b = [want].flat(Infinity);
      assert.equal(a.length, b.length, `${v.where}: ${name} has ${a.length} numbers, the lab ${b.length}`);
      a.forEach((x, i) => assert.ok(Math.abs(x - b[i]) <= 1e-6 * Math.max(1, Math.abs(b[i])), `${v.where}: ${name}[${i}] = ${x}, the lab ${b[i]}`));
    }
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
