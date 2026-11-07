// The frame every lab here shares: the exercise solved in steps, one animated view per step, a player that runs the
// animation once (or a slider that steps it, for readers who asked for reduced motion), the readouts, the solution
// sheet's value beside the lab's own, and the MATLAB that gives the view's result, with a copy button.
import { h, choice, readout } from "../../../kit/ui/kit.js";

const DURATION = 3.5; // seconds one animation runs
let uid = 0;

/** Lays out a lab: steps [{ name, draw(p) }] where draw gets the animation's progress p in [0, 1] and returns
 *  { figure, notes: [[label, value, tone, why]], sheet: [{ source, sheet, lab, agree }], code, hint }.
 *  controls are the lab's own inputs, shared by its steps; they call refresh(). Returns { refresh, go }. */
export function stepper(root, steps, { controls = [], intro = null } = {}) {
  const still = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  let k = 0, p = still ? 1 : 0, timer = null, last = null;
  const figure = h("div", { class: "figure" }), notes = h("div", {}), sheet = h("div", { class: "sheet" }), hint = h("p", { class: "hint" });
  const id = `progress${++uid}`;
  const range = h("input", { type: "range", id, min: 0, max: 1, step: 0.01, value: p });
  const play = h("button", { type: "button", class: "press" }, "Play");
  const pre = h("pre", { class: "matlab-code", tabindex: "0" });
  const copied = h("span", { class: "copied", role: "status" });
  const copy = h("button", { type: "button" }, "Copy");
  copy.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(pre.textContent); copied.textContent = "Copied."; }
    catch { copied.textContent = "The browser did not allow copying: select the code and press Ctrl+C."; }
  });

  const draw = () => {
    const out = steps[k].draw(p);
    figure.replaceChildren(...[out.figure].flat().filter(Boolean));
    notes.replaceChildren(...(out.notes ?? []).map(([label, value, tone = "", why = ""]) => {
      const r = readout(label); r.set(value, tone, why); return r.el;
    }));
    sheet.replaceChildren(...(out.sheet ?? []).map(s => {
      const r = readout(`Solution sheet (${s.source})`);
      r.set(s.sheet, s.agree === false ? "warn" : "",
        s.agree === false ? `This lab: ${s.lab}. They disagree; see the README's source notes.` : `This lab: ${s.lab}${s.agree ? ", the same" : ""}.`);
      return r.el;
    }));
    hint.textContent = out.hint ?? "";
    pre.textContent = out.code ?? "";
  };
  const stop = () => { if (timer) cancelAnimationFrame(timer); timer = null; last = null; play.textContent = "Play"; };
  const frame = now => {
    if (!root.isConnected && last !== null) { stop(); return; }
    if (last !== null) p = Math.min(1, p + (now - last) / 1000 / DURATION);
    last = now; range.value = p; draw();
    if (p < 1) timer = requestAnimationFrame(frame); else stop();
  };
  const start = () => { if (p >= 1) p = 0; play.textContent = "Pause"; last = null; timer = requestAnimationFrame(frame); };
  play.addEventListener("click", () => (timer ? stop() : start()));
  range.addEventListener("input", () => { stop(); p = Number(range.value); draw(); });

  const go = j => { stop(); k = j; p = still ? 1 : 0; range.value = p; draw(); if (!still) start(); };
  const pick = steps.length > 1
    ? choice("Step", steps.map((s, j) => [String(j), `${j + 1} ${s.name}`]), "0", v => go(Number(v))) : null;

  root.append(...[
    intro ? h("p", { class: "hint" }, intro) : null,
    pick,
    h("div", { class: "stage" }, figure, h("div", { class: "controls" },
      h("div", { class: "control player" }, h("label", { for: id }, "Animation"), range, play),
      ...controls, notes, sheet, hint)),
    h("section", { class: "matlab", "aria-label": "MATLAB" }, h("div", { class: "matlab-head" },
      h("h3", {}, "In MATLAB"), copy, copied), pre)].filter(Boolean));
  draw();
  if (!still) start();
  return { refresh: draw, go };
}

/** The first share p of a sampled curve, so a response is drawn growing over time. */
export const upTo = (xs, p) => xs.slice(0, Math.max(2, Math.ceil(p * xs.length)));

/** "−1.2", "39", "3.33": a value for a readout, with the minus sign. */
export const fmt = (v, digits = 4) => !Number.isFinite(v) ? "—"
  : Math.abs(v) < 1e-10 ? "0" : String(Number(v.toPrecision(digits))).replace("-", "−");
export const fmtVec = v => `(${v.map(x => fmt(x)).join("  ")})`;
export const fmtC = ([re, im]) => Math.abs(im) < 1e-9 ? fmt(re) : `${fmt(re)} ${im < 0 ? "−" : "+"} j${fmt(Math.abs(im))}`;
/** Do two lists of numbers agree within a relative 0.5 % (hand-rounded values)? */
export const same = (a, b, tol = 5e-3) => a.length === b.length && a.every((v, i) => Math.abs(v - b[i]) <= tol * Math.max(1, Math.abs(b[i])));
