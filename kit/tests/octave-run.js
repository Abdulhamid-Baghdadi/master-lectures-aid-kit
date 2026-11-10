// What the labs' MATLAB-in-Octave tests share (one copy, 10 Nov 2026): finding octave-cli, a few long-lived workers
// (octave-worker.m: the control and signal packages loaded once, each snippet in a fresh function workspace, figures
// invisible), and the runner that executes each view's MATLAB on a copy in a fresh temporary folder and compares the
// values of its check expressions with the lab's own numbers. Not a test itself.
// A lab's test gives each view at the end of its step (code-views.js's views, " at 1") one of
//   [mexpr, ...]   one MATLAB expression per entry of the view's pyCheck; that entry's value, tolerance and scale are
//                  reused, so the lab's numbers have one source. An entry may be [mexpr, want => part of want] when
//                  the MATLAB has only part of what the Python prints (an output where Python has the states);
//   { only: reason } the view needs what Octave lacks (a toolbox, a function): it is counted, not run.
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, mkdirSync, writeFileSync, renameSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { join } from "node:path";

const INSTALLED = "C:\\Users\\A-Bag\\AppData\\Local\\Programs\\GNU Octave\\Octave-11.3.0\\mingw64\\bin\\octave-cli.exe";

/** octave-cli: env OCTAVE_CLI, else the installed 11.3.0, else the PATH's; null when none answers. */
export function findOctave() {
  for (const exe of [process.env.OCTAVE_CLI, INSTALLED, "octave-cli"]) {
    if (!exe || (exe.includes("\\") && !existsSync(exe))) continue;
    if (spawnSync(exe, ["--version"], { encoding: "utf8" }).status === 0) return exe;
  }
  return null;
}

/** The skip reason for node:test, or false when Octave is here. */
export const octaveSkip = () => findOctave() ? false
  : "octave-cli not found (set OCTAVE_CLI or install GNU Octave with the control and signal packages): the MATLAB was not run";

const WORKER = fileURLToPath(new URL("./octave-worker.m", import.meta.url));

/** One long-lived octave-cli running octave-worker.m. The timeout counts from its ready line (the packages take about
 *  10 s to load); a snippet that outlasts it kills the worker and the next run starts a new one. */
class OctaveWorker {
  constructor(exe, home) { this.exe = exe; this.home = home; this.n = 0; }
  start() {
    // Each start its own inbox: a killed worker's late reads never meet the next one's requests.
    this.inbox = join(this.home, `inbox${this.n++}`);
    mkdirSync(this.inbox);
    const p = this.p = spawn(this.exe, ["--no-gui", "--norc", "--quiet", "--no-window-system", WORKER, this.inbox]);
    let buf = "", log = "", onReady;
    this.wait = null;
    this.ready = new Promise(r => { onReady = r; });
    p.stdout.setEncoding("utf8");
    p.stdout.on("data", d => {
      buf += d;
      let i;
      while ((i = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, i).replace(/\r$/, ""); buf = buf.slice(i + 1);
        if (this.p !== p || !line.startsWith("@@")) continue; // gnuplot's and Octave's own chatter
        if (line === "@@READY") { onReady(); continue; }
        const w = this.wait; this.wait = null; w?.(JSON.parse(line.slice(2)));
      }
    });
    p.stderr.on("data", d => { log = (log + d).slice(-4000); });
    p.stdin.on("error", () => {});
    p.on("close", code => {
      if (this.p !== p) return;
      this.p = null; onReady();
      const w = this.wait; this.wait = null;
      w?.({ ok: false, stdout: "", stderr: `the Octave worker stopped (exit ${code}):\n${log}`, values: [] });
    });
  }
  async run(req, timeout) {
    if (!this.p) this.start();
    await this.ready;
    if (!this.p) return { ok: false, stdout: "", stderr: "the Octave worker stopped before it was ready", values: [] };
    return new Promise(res => {
      const timer = setTimeout(() => {
        this.wait = null; this.p?.kill(); this.p = null;
        res({ ok: false, stdout: "", stderr: `no answer after ${timeout / 1000} s: the snippet was stopped`, values: [] });
      }, timeout);
      this.wait = r => { clearTimeout(timer); res(r); };
      // Written whole, then renamed: the worker never reads half a request.
      const tmp = join(this.inbox, "request.tmp");
      writeFileSync(tmp, JSON.stringify(req), "utf8");
      renameSync(tmp, join(this.inbox, "request.json"));
    });
  }
  /** The worker sees its inbox gone and stops. */
  stop() { if (this.inbox) rmSync(this.inbox, { recursive: true, force: true }); }
}

/** Runs MATLAB snippets [{ code, checks: [expr] }] in Octave, each in its own temporary folder:
 *  [{ ok, stdout, stderr, values }], values[i] the value of checks[i] in the snippet's workspace. */
export async function runOctave(jobs, { prefix = "lab-m-", parallel = 3, timeout = 120000 } = {}) {
  const exe = findOctave();
  if (!exe) throw new Error(octaveSkip());
  const dir = mkdtempSync(join(tmpdir(), prefix)), out = [];
  const pool = Array.from({ length: Math.min(parallel, jobs.length) }, (_, i) => {
    // Not mkdirSync's return value: with recursive it is a \\?\ path, which Octave cannot open.
    const home = join(dir, `w${i}`);
    mkdirSync(home);
    return new OctaveWorker(exe, home);
  });
  try {
    let next = 0;
    await Promise.all(pool.map(async w => {
      while (next < jobs.length) {
        const k = next++, cwd = join(dir, `s${k}`), file = join(cwd, "snippet.m");
        mkdirSync(cwd);
        writeFileSync(file, jobs[k].code, "utf8");
        out[k] = await w.run({ file, cwd, checks: jobs[k].checks ?? [] }, timeout);
      }
    }));
  } finally {
    pool.forEach(w => w.stop());
    rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  }
  return out;
}

/** The MATLAB checks of the given views from a lab's table (see the header): { run, only, missing }, run the views
 *  with their checks [mexpr, want, tol, scale], only the MATLAB-only views with their reasons. */
export function plan(views, table) {
  const run = [], only = [], missing = [];
  for (const v of views) {
    const key = v.where.replace(/ at 1$/, ""), m = table[key];
    if (!m) { missing.push(key); continue; }
    if (m.only) { only.push({ where: v.where, reason: m.only }); continue; }
    const py = Array.isArray(v.check?.[0]) ? v.check : [v.check];
    if (m.length !== py.length) throw new Error(`${key}: ${m.length} MATLAB checks for ${py.length} Python ones`);
    const checks = m.map((e, i) => {
      const [expr, part = w => w] = [e].flat();
      const [, want, ...rest] = py[i];
      return [expr, part(want), ...rest];
    });
    run.push({ ...v, checks });
  }
  return { run, only, missing };
}

/** Runs each planned view's MATLAB in Octave and returns the failures as texts. A number passes when
 *  |got − want| ≤ tolerance · max(scale, |want|), as in code-views.js's runChecks. */
export async function runMChecks(list, opts = {}) {
  const bad = [];
  const results = await runOctave(list.map(v => ({ code: v.matlab, checks: v.checks.map(c => c[0]) })), opts);
  for (const [k, v] of list.entries()) {
    const r = results[k];
    if (!r.ok) { bad.push(`${v.where}: Octave stopped: ${r.stderr}\n${v.matlab}`); continue; }
    v.checks.forEach(([e, want, tol = 1e-6, scale = 1], i) => {
      const a = [r.values[i]].flat(Infinity), b = [want].flat(Infinity);
      if (a.length !== b.length) { bad.push(`${v.where}: ${e} has ${a.length} numbers, the lab ${b.length}`); return; }
      a.forEach((x, n) => { if (!(Math.abs(x - b[n]) <= tol * Math.max(scale, Math.abs(b[n])))) bad.push(`${v.where}: ${e}(${n + 1}) = ${x}, the lab ${b[n]}`); });
    });
  }
  return bad;
}

/** The MATLAB-only views counted by reason, for the test's report. */
export const byReason = only => Object.entries(Object.groupBy(only, o => o.reason)).map(([r, l]) => `${l.length} × ${r}`);
