// Draws what each view's Python would plot beside what the lab's own chart plots, so the two can be compared by eye.
//
//   node kit/scripts/python-plots.mjs <lab-folder> [view-id …]      e.g.  node kit/scripts/python-plots.mjs automation-lab placement
//
// For each lab view (each step of each lab, the step's animation at its end p = 1, sliders and choices at their
// defaults) whose figure holds a line chart, it:
//   1. records the chart's own series (the arguments the lab passed to kit/ui/chart.js lineChart, caught by a loader
//      hook that wraps that one function; nothing in the lab is changed);
//   2. writes the view's Python snippet to a copy in a fresh temporary folder, appends matplotlib code (Agg backend,
//      no plt.show, no randomness) and runs it with `python -P`. If the snippet draws its own figure, that figure is
//      saved as it stands; otherwise every pair the snippet leaves behind (y, t / y1, t1 / … and solve_ivp results) is
//      plotted;
//   3. draws the lab's series with the same matplotlib in another style (dashed, grey grid);
//   4. saves <lab>/docs/python-check/<view>-python.png and <view>-lab.png (80 dpi, small) and <view>.json with the
//      numbers of both: per line its peak, final value, 2 % settling time and time span.
// Views whose Python stops are reported, not drawn. Needs python with numpy, matplotlib and the lab's modules
// (control, scipy, sympy). The temporary folder is removed afterwards.
import { register } from "node:module";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, readFileSync, rmSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";

// Wrap lineChart so each call's arguments land in globalThis.__charts.
register("data:text/javascript," + encodeURIComponent(`
export async function load(url, ctx, next) {
  const r = await next(url, ctx);
  if (!url.endsWith("/kit/ui/chart.js")) return r;
  const src = String(r.source).replace("export function lineChart(", "export function lineChart(a) { (globalThis.__charts ??= []).push(a); return lineChart0(a); }\\nfunction lineChart0(");
  return { ...r, source: src, shortCircuit: true };
}`));

const here = dirname(fileURLToPath(import.meta.url));
const [labDir, ...only] = process.argv.slice(2);
if (!labDir) { console.error("Name a lab folder: node kit/scripts/python-plots.mjs automation-lab [view-id …]"); process.exit(1); }
const lab = resolve(labDir), out = join(lab, "docs", "python-check");
mkdirSync(out, { recursive: true });

const { install, El } = await import(pathToFileURL(join(here, "..", "tests", "fake-dom.js")));
install();
const { labs } = await import(pathToFileURL(join(lab, "src", "labs", "index.js")));

// The plotting tail: one figure per side, numbers of both to a JSON file.
const TAIL = String.raw`
import json as _json, numpy as _np, matplotlib as _mpl
_mpl.use("Agg")
import matplotlib.pyplot as _plt
from types import SimpleNamespace as _NS
def _stats(t, y):
    t = _np.asarray(t, float).ravel(); y = _np.asarray(y, float).ravel()
    ok = _np.isfinite(t) & _np.isfinite(y); t, y = t[ok], y[ok]
    if len(y) < 2: return None
    f = float(y[-1]); band = 0.02 * max(abs(f), 1e-12); out = _np.nonzero(_np.abs(y - f) > band)[0]
    ts = float(t[min(out[-1] + 1, len(t) - 1)]) if len(out) else float(t[0])
    k = int(_np.argmax(_np.abs(y)))
    return dict(peak=float(y[k]), t_peak=float(t[k]), final=f, settling=ts, t_end=float(t[-1]), n=len(y))
_g = dict(globals()); _series = []
for _k, _v in sorted(_g.items()):
    if _k.startswith("_"): continue
    if hasattr(_v, "t") and hasattr(_v, "y") and hasattr(_v, "message"):
        for _i, _row in enumerate(_np.atleast_2d(_v.y)): _series.append((f"{_k}.y[{_i}]", _v.t, _row))
    elif _k[:1] in "yx" and ("t" + _k[1:]) in _g:   # y, t from step/lsim, and the states x of lsim or return_x
        _t = _np.asarray(_g["t" + _k[1:]], float).ravel(); _y = _np.asarray(_v, float)
        if _y.ndim == 1 and len(_y) == len(_t): _series.append((_k, _t, _y))
        elif _y.ndim >= 2 and _y.shape[0] == len(_t): _series += [(f"{_k}[:, {_i}]", _t, _y.reshape(len(_t), -1)[:, _i]) for _i in range(_y.reshape(len(_t), -1).shape[1])]
_own = bool(_plt.get_fignums())
if _own:
    _fig = _plt.gcf(); _fig.set_size_inches(6, 3.4)
else:
    _plt.close("all"); _fig, _ax = _plt.subplots(figsize=(6, 3.4))
    for _n, _t, _y in _series: _ax.plot(_t, _y, label=_n)
    _ax.set_xlabel("t"); _ax.legend(fontsize=7); _ax.grid(alpha=.3)
_fig.suptitle("Python: " + _VIEW + (" (the snippet's own plot)" if _own else ""), fontsize=9); _fig.tight_layout()
_fig.savefig(_PNG_PY, dpi=80); _plt.close("all")
_lab = _json.load(open(_LAB_JSON, encoding="utf-8"))
_fig, _ax = _plt.subplots(figsize=(6, 3.4))
for _c in _lab["charts"]:
    for _l in _c["lines"]:
        if _l.get("noTip") and not _l.get("name"): continue
        _ax.plot(_l["x"], _l["y"], "--", lw=1.6, label=_l.get("name") or "")
_ax.set_xlabel(_lab["charts"][0].get("xLabel") or ""); _ax.set_ylabel(_lab["charts"][0].get("yLabel") or "")
_ax.grid(color="0.6", ls=":"); _ax.legend(fontsize=7)
_fig.suptitle("Lab: " + _VIEW + " (" + (_lab["charts"][0].get("label") or "") + ")", fontsize=9); _fig.tight_layout()
_fig.savefig(_PNG_LAB, dpi=80); _plt.close("all")
_res = dict(python={_n: _stats(_t, _y) for _n, _t, _y in _series}, python_own_plot=_own,
            lab={f"{_c.get('label','')} / {_l.get('name') or _j}": _stats(_l["x"], _l["y"]) for _c in _lab["charts"] for _j, _l in enumerate(_c["lines"]) if not _l.get("noTip")})
open(_OUT_JSON, "w", encoding="utf-8", newline="\n").write(_json.dumps(_res, indent=1))
`;

const tmp = mkdtempSync(join(tmpdir(), "python-plots-")), report = [];
try {
  for (const L of labs) {
    const root = new El("div");
    globalThis.__charts = [];
    try { L.mount(root); } catch (e) { report.push(`${L.id}: not mounted on the fake page (${e.message}); skipped`); continue; }
    const els = [...root.walk()];
    const py = els.find(e => e.attrs.class === "matlab-code python-code");
    const pick = els.find(e => e.tag === "fieldset" && e.children.some(c => c.tag === "legend" && c.textContent === "Step"));
    const steps = pick ? [...pick.walk()].filter(e => e.tag === "input" && e.attrs.type === "radio") : [null];
    const range = els.find(e => e.tag === "input" && e.attrs.type === "range" && String(e.attrs.id).startsWith("progress"));
    if (!range) continue; // a lab without the step player (a free view) has no stepped Python
    for (const [j, radio] of steps.entries()) {
      const id = steps.length > 1 ? `${L.id}-s${j + 1}` : L.id;
      if (only.length && !only.includes(L.id) && !only.includes(id)) continue;
      if (radio) radio.fire("change");
      globalThis.__charts = [];
      range.value = "1"; range.fire("input");
      const charts = globalThis.__charts.filter(c => c.lines?.some(l => l.x?.length > 2));
      if (!charts.length || !py) continue;
      // Copies of the series (the lab's arrays are cut by grow at p = 1, so they are whole).
      const data = { charts: charts.map(c => ({ label: c.label, xLabel: c.xLabel, yLabel: c.yLabel,
        lines: c.lines.map(l => ({ name: l.name, noTip: l.noTip, x: [...l.x], y: [...l.y] })) })) };
      const labJson = join(tmp, `${id}-lab.json`), file = join(tmp, `${id}.py`), res = join(out, `${id}.json`);
      writeFileSync(labJson, JSON.stringify(data));
      const head = ["import matplotlib", "matplotlib.use('Agg')",
        `_VIEW = ${JSON.stringify(id)}`, `_LAB_JSON = ${JSON.stringify(labJson)}`, `_OUT_JSON = ${JSON.stringify(res)}`,
        `_PNG_PY = ${JSON.stringify(join(out, `${id}-python.png`))}`, `_PNG_LAB = ${JSON.stringify(join(out, `${id}-lab.png`))}`].join("\n");
      writeFileSync(file, `${head}\n${py.textContent}\n${TAIL}`, "utf8");
      const r = spawnSync("python", ["-P", file], { cwd: tmp, encoding: "utf8", env: { ...process.env, MPLBACKEND: "Agg" }, timeout: 120000 });
      if (r.status !== 0) { report.push(`${id}: Python stopped: ${r.stderr.trim().split("\n").at(-1)}`); continue; }
      report.push(`${id}: ${JSON.stringify(JSON.parse(readFileSync(res, "utf8")))}`);
    }
  }
} finally { rmSync(tmp, { recursive: true, force: true }); }
console.log(report.join("\n"));
