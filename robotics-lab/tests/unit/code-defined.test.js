// Every MATLAB and Python snippet a stepped view shows runs as pasted: each name is assigned (or imported, a function
// parameter, a loop variable) before it is used. The check mounts every lab on a fake page, plays every step to its
// start, middle and end, and scans both code panels. Right result: by definition (MATLAB and Python stop at the first
// undefined name). The MATLAB scanner is the ModSim lab's (tests/unit/matlab-defined.test.js there), taught the Robotics
// System Toolbox; the Python one is its variant for Python's syntax.
import { test } from "node:test";
import assert from "node:assert/strict";
import { install, El } from "./fake-dom.js";

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

const PY_BUILTIN = new Set(("print round abs len range list tuple float int min max sum zip enumerate True False None "
  + "and or not in is if else for return lambda def import from as").split(" "));

/** Logical lines of Python: comments and strings out, bracketed continuations joined; each with its indent. */
function pyLines(code) {
  const out = []; let depth = 0, cur = "", indent = 0;
  for (const raw of code.split("\n")) {
    const line = raw.replace(/'[^'\n]*'|"[^"\n]*"/g, "0").replace(/#.*$/, "");
    if (!cur) indent = line.match(/^\s*/)[0].length;
    cur += " " + line;
    for (const ch of line) { if ("([{".includes(ch)) depth++; if (")]}".includes(ch)) depth--; }
    if (depth <= 0) { if (cur.trim()) out.push({ indent, text: cur.trim() }); cur = ""; depth = 0; }
  }
  return out;
}
/** The names a Python snippet reads before any statement binds them. */
export function pyUndefined(code) {
  const defined = new Set(), missing = new Set();
  let local = new Set(), bodyIndent = -1;
  const use = (text, extra = new Set()) => {
    const own = new Set(extra);
    // Comprehension and generator variables: "for a, b in".
    for (const m of text.matchAll(/\bfor\s+([\w\s,]+?)\s+in\b/g)) for (const w of m[1].match(/\w+/g)) own.add(w);
    const clean = text.replace(/(?<![=!<>])\b[A-Za-z_]\w*\s*=(?!=)(?=[^)]*\))/g, " "); // keyword arguments
    for (const w of clean.match(/(?<![\w.])[A-Za-z_]\w*/g) ?? [])
      if (!defined.has(w) && !local.has(w) && !own.has(w) && !PY_BUILTIN.has(w)) missing.add(w);
  };
  for (const { indent, text } of pyLines(code)) {
    if (indent <= bodyIndent) { local = new Set(); bodyIndent = -1; }
    let m;
    if ((m = text.match(/^import\s+(\w+)(?:\s+as\s+(\w+))?/))) { defined.add(m[2] ?? m[1]); continue; }
    if ((m = text.match(/^from\s+[\w.]+\s+import\s+(.*)$/))) { for (const w of m[1].split(",")) defined.add(w.trim().split(/\s+as\s+/).at(-1)); continue; }
    if ((m = text.match(/^def\s+(\w+)\s*\(([^)]*)\)\s*:/))) { defined.add(m[1]); local = new Set(m[2].match(/\w+/g) ?? []); bodyIndent = indent; continue; }
    if ((m = text.match(/^for\s+([\w\s,]+?)\s+in\s+(.*):$/))) { use(m[2]); for (const w of m[1].match(/\w+/g)) defined.add(w); continue; }
    if ((m = text.match(/^return\s+(.*)$/))) { use(m[1]); continue; }
    if ((m = text.match(/^([\w\s,]+?)\s*([-+*/@]?=)(?!=)\s*(.*)$/))) {
      const names = m[1].match(/\w+/g);
      if (m[2] !== "=") use(m[1]);
      use(m[3]);
      for (const w of names) (bodyIndent >= 0 ? local : defined).add(w);
      continue;
    }
    use(text);
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

/** Every view of every stepped lab: its MATLAB, its Python and what the Python should end with. */
export async function views() {
  install();
  const { labs } = await import("../../src/labs/index.js");
  const out = [];
  // The stepped labs only: the older labs draw with parts of the page this fake one leaves out.
  for (const lab of labs.filter(l => l.id.endsWith("steps"))) {
    const root = new El("div");
    lab.mount(root);
    const els = [...root.walk()];
    const ml = els.find(e => e.attrs.class === "matlab-code"), py = els.find(e => e.attrs.class === "matlab-code python-code");
    const radios = els.filter(e => e.tag === "input" && e.attrs.type === "radio");
    const range = els.find(e => e.tag === "input" && e.attrs.type === "range" && String(e.attrs.id).startsWith("progress"));
    for (const [j, radio] of (radios.length ? radios : [null]).entries()) {
      if (radio) radio.fire("change");
      for (const p of [0, 0.5, 1]) {
        range.value = String(p); range.fire("input");
        out.push({ where: `${lab.id} step ${j + 1} at ${p}`, matlab: ml.textContent, python: py.textContent, check: JSON.parse(py.getAttribute("data-check")) });
      }
    }
  }
  return out;
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
