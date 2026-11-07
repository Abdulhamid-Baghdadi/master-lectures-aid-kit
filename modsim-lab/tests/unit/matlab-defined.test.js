// Every MATLAB snippet a view shows runs as pasted: each name is assigned (or declared with syms, or a parameter of an
// anonymous function) before it is used. The check mounts every lab on a fake page, plays every step to its start,
// middle and end, and scans the code each view shows. Right result: by definition (MATLAB stops at the first
// undefined name). The same check as the Advanced Automation lab's, taught syms, @(t,x) and strings.
import { test } from "node:test";
import assert from "node:assert/strict";
import { install } from "../../../kit/tests/fake-dom.js";

const BUILTIN = new Set(("syms sym diff ode45 plot ss eig step bode initial lsim tf damp linspace logspace sin cos sqrt pi "
  + "odeToVectorField matlabFunction subs simplify solve jacobian zeros eye inv diag abs xlabel ylabel legend trace det "
  + "squeeze arrayfun double").split(" "));

/** The statements of a snippet: comments and continuations removed, split at ; and line ends outside brackets. */
function statements(code) {
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
/** The names a snippet reads before any statement assigns them. */
export function undefinedNames(code) {
  const defined = new Set(), missing = new Set();
  for (let stmt of statements(code)) {
    const syms = stmt.match(/^\s*syms\s+(.*)$/);
    if (syms) { for (const w of syms[1].match(/[A-Za-z_]\w*/g) ?? []) defined.add(w); continue; }
    const local = new Set();
    stmt = stmt.replace(/@\(([^)]*)\)/g, (_, args) => { for (const w of args.match(/[A-Za-z_]\w*/g) ?? []) local.add(w); return " "; });
    const m = stmt.match(/^\s*(\[[^\]]*\]|[A-Za-z_]\w*)\s*=(?!=)/);
    const rhs = m ? stmt.slice(m[0].length) : stmt;
    for (const w of rhs.match(/(?<![\w.])[A-Za-z_]\w*/g) ?? []) if (!defined.has(w) && !local.has(w) && !BUILTIN.has(w)) missing.add(w);
    if (m) for (const v of m[1].match(/[A-Za-z_]\w*/g)) defined.add(v);
  }
  return [...missing];
}

test("the scanner finds a name used before it is assigned, and knows syms, @(t,x) and strings (by definition)", () => {
  assert.deepEqual(undefinedNames("x = y + 1;"), ["y"]);
  assert.deepEqual(undefinedNames("syms x(t) m\nT = m*diff(x,t)^2;"), []);
  assert.deepEqual(undefinedNames("k = 1;\nf = @(t,x) [x(2); ...\n  -k*x(1)];\n[t,x] = ode45(f,[0 1],[1; 0]);"), []);
  assert.deepEqual(undefinedNames("f = matlabFunction(V,'vars',{'t','Y'});"), ["V"]);
  assert.deepEqual(undefinedNames("A = [1 2]; B = A';"), []);
});

test("every view of every lab draws at its start, middle and end, and its MATLAB runs as pasted", async () => {
  install();
  const { labs } = await import("../../src/labs/index.js");
  let views = 0;
  for (const lab of labs) {
    const root = new (await import("../../../kit/tests/fake-dom.js")).El("div");
    lab.mount(root);
    const els = [...root.walk()];
    const pre = els.find(e => e.attrs.class === "matlab-code");
    const radios = els.filter(e => e.tag === "input" && e.attrs.type === "radio");
    const range = els.find(e => e.tag === "input" && e.attrs.type === "range" && String(e.attrs.id).startsWith("progress"));
    const picks = radios.length ? radios : [null];
    for (const [j, radio] of picks.entries()) {
      if (radio) radio.fire("change");
      for (const p of [0, 0.5, 1]) {
        range.value = String(p); range.fire("input");
        assert.ok(pre.textContent.trim(), `${lab.id} step ${j + 1} at ${p} shows MATLAB`);
        assert.deepEqual(undefinedNames(pre.textContent), [], `${lab.id} step ${j + 1}:\n${pre.textContent}`);
        views++;
      }
    }
  }
  assert.ok(views >= 13 * 3 * 3, `${views} views played`);
});
