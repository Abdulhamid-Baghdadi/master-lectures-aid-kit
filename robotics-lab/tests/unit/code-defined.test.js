// Every MATLAB and Python snippet a stepped view shows runs as pasted: each name is assigned (or imported, a function
// parameter, a loop variable) before it is used. The check mounts every lab on a fake page, plays every step to its
// start, middle and end, and scans both code panels. Right result: by definition (MATLAB and Python stop at the first
// undefined name). The MATLAB scanner is the ModSim lab's (tests/unit/matlab-defined.test.js there), taught the Robotics
// System Toolbox; the Python one is the kit's (kit/tests/code-views.js), shared with the other labs since 7 Nov 2026.
import { test } from "node:test";
import assert from "node:assert/strict";
import { install } from "../../../kit/tests/fake-dom.js";
import { pyUndefined, views as playViews } from "../../../kit/tests/code-views.js";

const ML_BUILTIN = new Set(("rigidBodyTree rigidBody rigidBodyJoint setFixedTransform addBody showdetails getTransform "
  + "geometricJacobian inverseKinematics homeConfiguration trvec2tform atan2 acos sqrt sin cos pi rad2deg deg2rad det "
  + "norm zeros eye").split(" "));

function mlStatements(code) {
  const text = code.split("\n").map(l => l.replace(/%.*$/, "")).join("\n").replace(/\.\.\.\s*\n/g, " ")
    .replace(/(?<=[(,{=\s[])'[^'\n]*'/g, "0").replace(/(?<=[\w)\]])'/g, "");
  const out = []; let depth = 0, cur = "";
  for (const ch of text) {
    if ("([{".includes(ch)) depth++;
    if (")]}".includes(ch)) depth--;
    if ((ch === ";" || ch === "\n") && depth <= 0) { out.push(cur); cur = ""; } else cur += ch;
  }
  return [...out, cur].filter(s => s.trim());
}
/** The names a MATLAB snippet reads before any statement assigns them. */
export function mlUndefined(code) {
  const defined = new Set(), missing = new Set();
  for (const stmt of mlStatements(code)) {
    const m = stmt.match(/^\s*(\[[^\]]*\]|[A-Za-z_]\w*)\s*=(?!=)/);
    const rhs = m ? stmt.slice(m[0].length) : stmt;
    for (const w of rhs.match(/(?<![\w.])[A-Za-z_]\w*/g) ?? []) if (!defined.has(w) && !ML_BUILTIN.has(w)) missing.add(w);
    if (m) for (const v of m[1].match(/[A-Za-z_]\w*/g)) defined.add(v);
  }
  return [...missing];
}

test("the MATLAB scanner finds a name used too early and knows the toolbox (by definition)", () => {
  assert.deepEqual(mlUndefined("x = y + 1;"), ["y"]);
  assert.deepEqual(mlUndefined("robot = rigidBodyTree('DataFormat','row');\nbody1 = rigidBody('b');\nbody1.Joint = jnt1;"), ["jnt1"]);
  assert.deepEqual(mlUndefined("q = [1 2];\nq(2) = q(2) - pi/2;"), []);
});

test("the Python scanner finds a name used too early and knows imports, def, for and keyword arguments (by definition)", () => {
  assert.deepEqual(pyUndefined("x = y + 1"), ["y"]);
  assert.deepEqual(pyUndefined("import numpy as np\nfrom numpy import cos, sin\ndef f(a, b):\n    return np.array([cos(a), b])\nz = f(1, 2)\nprint(np.round(z, decimals=3))"), []);
  assert.deepEqual(pyUndefined("def f(a):\n    return a\nprint(a)"), ["a"]);
  assert.deepEqual(pyUndefined("s = []\nfor k in (1, -1):\n    s.append(k)\nt = [[u, v] for u, v in s]"), []);
  assert.deepEqual(pyUndefined("a, b = 1, 2\nc = a + b + d"), ["d"]);
});

/** Every view of every stepped lab: its MATLAB, its Python and what the Python should end with. The stepped labs
 *  only: the older labs draw with parts of the page the fake one leaves out. */
export async function views() {
  install();
  const { labs } = await import("../../src/labs/index.js");
  return playViews(labs.filter(l => l.id.endsWith("steps")));
}

test("every stepped view shows MATLAB and Python that use no name before defining it", async () => {
  const all = await views();
  assert.ok(all.length >= (2 + 3 + 2 + 3) * 3, `${all.length} views played`);
  for (const v of all) {
    assert.ok(v.matlab.trim() && v.python.trim(), `${v.where} shows both`);
    assert.deepEqual(mlUndefined(v.matlab), [], `${v.where} MATLAB:\n${v.matlab}`);
    assert.deepEqual(pyUndefined(v.python), [], `${v.where} Python:\n${v.python}`);
  }
});
