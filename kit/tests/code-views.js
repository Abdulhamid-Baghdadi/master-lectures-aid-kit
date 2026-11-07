// What the labs' Python tests share (one copy since 7 Nov 2026, moved from the Robotics lab's code-defined.test.js):
// the scanner for names a Python snippet reads before binding them, the player that mounts a lab's views on the fake
// page and plays every step at its start, middle and end, and the runner that executes each snippet on a long-lived
// python -P worker (py-worker.py: heavy imports once, fresh globals per snippet) in a fresh temporary folder and
// compares what it prints with the lab's own numbers. Not a test itself.
import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { install, El } from "./fake-dom.js";

const PY_BUILTIN = new Set(("print round abs len range list tuple float int min max sum zip enumerate True False None "
  + "dict complex and or not in is if else for return lambda def import from as").split(" "));

/** A line split at the semicolons outside brackets. */
function splitTop(text) {
  const out = []; let depth = 0, cur = "";
  for (const ch of text) {
    if ("([{".includes(ch)) depth++;
    if (")]}".includes(ch)) depth--;
    if (ch === ";" && depth <= 0) { out.push(cur); cur = ""; } else cur += ch;
  }
  return [...out, cur];
}
/** Logical lines of Python: comments and strings out, bracketed continuations joined; each with its indent. */
function pyLines(code) {
  const out = []; let depth = 0, cur = "", indent = 0;
  for (const raw of code.split("\n")) {
    const line = raw.replace(/'[^'\n]*'|"[^"\n]*"/g, "0").replace(/#.*$/, "");
    if (!cur) indent = line.match(/^\s*/)[0].length;
    cur += " " + line;
    for (const ch of line) { if ("([{".includes(ch)) depth++; if (")]}".includes(ch)) depth--; }
    if (depth <= 0) {
      // Statements joined by ";" on one line are read one after the other.
      for (const part of splitTop(cur)) if (part.trim()) out.push({ indent, text: part.trim() });
      cur = ""; depth = 0;
    }
  }
  return out;
}
/** The names a Python snippet reads before any statement binds them (imports, def, for, lambda and comprehension
 *  variables, keyword arguments and attribute names are not reads). */
export function pyUndefined(code) {
  const defined = new Set(), missing = new Set();
  let local = new Set(), bodyIndent = -1;
  const use = (text, extra = new Set()) => {
    const own = new Set(extra);
    for (const m of text.matchAll(/\bfor\s+([\w\s,]+?)\s+in\b/g)) for (const w of m[1].match(/\w+/g)) own.add(w);
    for (const m of text.matchAll(/\blambda\s+([\w\s,]*?):/g)) for (const w of m[1].match(/\w+/g) ?? []) own.add(w);
    const clean = text.replace(/(?<![=!<>])\b[A-Za-z_]\w*\s*=(?!=)(?=[^)]*\))/g, " "); // keyword arguments
    for (const w of clean.match(/(?<![\w.])[A-Za-z_]\w*/g) ?? [])
      if (!defined.has(w) && !local.has(w) && !own.has(w) && !PY_BUILTIN.has(w)) missing.add(w);
  };
  for (const { indent, text } of pyLines(code)) {
    if (indent <= bodyIndent) { local = new Set(); bodyIndent = -1; }
    let m;
    if ((m = text.match(/^import\s+([\w.]+)(?:\s+as\s+(\w+))?/))) { defined.add(m[2] ?? m[1].split(".")[0]); continue; }
    if ((m = text.match(/^from\s+[\w.]+\s+import\s+(.*)$/))) { for (const w of m[1].replace(/[()]/g, "").split(",")) defined.add(w.trim().split(/\s+as\s+/).at(-1)); continue; }
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

/** Every view of the given labs at its start, middle and end: { where, matlab, python, check }. */
export function views(labs) {
  install();
  const out = [];
  for (const lab of labs) {
    const root = new El("div");
    lab.mount(root);
    const els = [...root.walk()];
    const ml = els.find(e => e.attrs.class === "matlab-code"), py = els.find(e => e.attrs.class === "matlab-code python-code");
    // The player's own choice, legend "Step"; a lab's other choices (system, exercise) keep their first option.
    const pick = els.find(e => e.tag === "fieldset" && e.children.some(c => c.tag === "legend" && c.textContent === "Step"));
    const steps = pick ? [...pick.walk()].filter(e => e.tag === "input" && e.attrs.type === "radio") : [];
    const range = els.find(e => e.tag === "input" && e.attrs.type === "range" && String(e.attrs.id).startsWith("progress"));
    for (const [j, radio] of (steps.length ? steps : [null]).entries()) {
      if (radio) radio.fire("change");
      for (const p of [0, 0.5, 1]) {
        range.value = String(p); range.fire("input");
        out.push({ where: `${lab.id} step ${j + 1} at ${p}`, matlab: ml.textContent, python: py ? py.textContent : "",
          check: py ? JSON.parse(py.getAttribute("data-check") ?? "null") : null });
      }
    }
  }
  return out;
}

/** Is Python with these modules on this PC? (-P: the script's folder is not put on the import path.) */
export const pythonHas = modules => spawnSync("python", ["-P", "-c", `import ${modules}`], { encoding: "utf8" }).status === 0;

const WORKER = fileURLToPath(new URL("./py-worker.py", import.meta.url));

/** One long-lived python -P running py-worker.py: the heavy imports (preload) are paid once, each snippet still runs
 *  in fresh globals (see the worker's header). The timeout counts from the worker's ready line, so a slow import on a
 *  busy PC is not taken for a hanging snippet. A snippet that outlasts it kills the worker; the next run starts anew. */
class PyWorker {
  constructor(preload) { this.preload = preload; }
  start() {
    const p = this.p = spawn("python", ["-P", WORKER, ...this.preload], { env: { ...process.env, MPLBACKEND: "Agg" } });
    let buf = "", log = "", onReady;
    this.wait = null;
    this.ready = new Promise(r => { onReady = r; });
    p.stdout.setEncoding("utf8");
    p.stdout.on("data", d => {
      buf += d;
      let i;
      while ((i = buf.indexOf("\n")) >= 0) {
        const msg = JSON.parse(buf.slice(0, i)); buf = buf.slice(i + 1);
        if (this.p !== p) continue;
        if (msg.ready) { onReady(); continue; }
        const w = this.wait; this.wait = null; w?.(msg);
      }
    });
    // The worker's own stderr: import warnings, or why it died; kept for the failure message.
    p.stderr.on("data", d => { log = (log + d).slice(-4000); });
    p.stdin.on("error", () => {}); // a killed worker's pipe; its close below says why
    p.on("close", code => {
      if (this.p !== p) return;
      this.p = null; onReady();
      const w = this.wait; this.wait = null;
      w?.({ ok: false, stdout: "", stderr: `the Python worker stopped (exit ${code}):\n${log}` });
    });
  }
  async run(file, cwd, timeout) {
    if (!this.p) this.start();
    await this.ready;
    if (!this.p) return { ok: false, stdout: "", stderr: "the Python worker stopped before it was ready (see above)" };
    return new Promise(res => {
      const timer = setTimeout(() => {
        this.wait = null; this.p?.kill(); this.p = null;
        res({ ok: false, stdout: "", stderr: `no answer after ${timeout / 1000} s: the snippet was stopped` });
      }, timeout);
      this.wait = r => { clearTimeout(timer); res(r); };
      this.p.stdin.write(JSON.stringify({ file, cwd }) + "\n");
    });
  }
  stop() { this.p?.stdin.end(); }
}

/** Runs Python snippets (texts) on the workers, each in its own temporary folder: [{ ok, stdout, stderr }]. */
export async function runSnippets(codes, { prefix = "lab-py-", parallel = 6, timeout = 120000, preload = ["numpy"] } = {}) {
  const dir = mkdtempSync(join(tmpdir(), prefix)), out = [];
  const pool = Array.from({ length: Math.min(parallel, codes.length) }, () => new PyWorker(preload));
  try {
    let next = 0;
    await Promise.all(pool.map(async w => {
      while (next < codes.length) {
        const k = next++, cwd = join(dir, `s${k}`), file = join(cwd, "snippet.py");
        mkdirSync(cwd);
        writeFileSync(file, codes[k], "utf8");
        out[k] = await w.run(file, cwd, timeout);
      }
    }));
  } finally {
    pool.forEach(w => w.stop());
    // The workers may still hold a folder open for a moment on Windows; rmSync retries.
    rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  }
  return out;
}

/** Runs each view's Python (those with a check) on a copy in a temporary folder, a few at a time, and returns the
 *  failures as texts. A check is [expression, value, tolerance = 1e-6, scale = 1] or a list of them; a number passes
 *  when |got − want| ≤ tolerance · max(scale, |want|). */
export async function runChecks(list, opts = {}) {
  const bad = [];
  const jobs = list.map(v => {
    const checks = Array.isArray(v.check[0]) ? v.check : [v.check];
    const code = `${v.python}\nimport json as _json, numpy as _np\n${checks.map(([e]) =>
      `print("@@" + _json.dumps(_np.asarray(${e}, dtype=float).tolist()))`).join("\n")}\n`;
    return { v, checks, code };
  });
  const results = await runSnippets(jobs.map(j => j.code), opts);
  for (const [k, { v, checks }] of jobs.entries()) {
    const r = results[k];
    if (!r.ok) { bad.push(`${v.where}: Python stopped:\n${r.stderr}\n${v.python}`); continue; }
    const got = r.stdout.split(/\r?\n/).filter(l => l.startsWith("@@")).map(l => JSON.parse(l.slice(2)));
    checks.forEach(([e, want, tol = 1e-6, scale = 1], i) => {
      const a = [got[i]].flat(Infinity), b = [want].flat(Infinity);
      if (a.length !== b.length) { bad.push(`${v.where}: ${e} has ${a.length} numbers, the lab ${b.length}`); return; }
      a.forEach((x, n) => { if (!(Math.abs(x - b[n]) <= tol * Math.max(scale, Math.abs(b[n])))) bad.push(`${v.where}: ${e}[${n}] = ${x}, the lab ${b[n]}`); });
    });
  }
  return bad;
}
