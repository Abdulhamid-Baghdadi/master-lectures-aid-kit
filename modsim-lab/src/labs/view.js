// What this lab's views share beyond the kit's step player (../../../kit/ui/steps.js): equations that arrive line by
// line, a cache so a run is integrated once per set of values (the player redraws it 60 times a second), and the
// sliders of a lab's values. None of it is a lab.
import { h, slider } from "../../../kit/ui/kit.js";
import { terms, fmt } from "../../../kit/ui/steps.js";

/** Lines of an equation or derivation, the first share p of them shown, the newest lit. Each line a string or
 *  [[text, key], …]. */
export function reveal(lines, p) {
  const n = Math.max(1, Math.ceil(p * lines.length - 1e-9));
  return terms(lines.slice(0, n).map((l, i) => typeof l === "string" ? [[l, i]] : l.map(([t]) => [t, i])), n - 1);
}

/** fn(args) computed once per distinct args (by their JSON), the last 20 kept. */
export function memo(fn) {
  const cache = new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    if (!cache.has(key)) { cache.set(key, fn(...args)); if (cache.size > 20) cache.delete(cache.keys().next().value); }
    return cache.get(key);
  };
}

/** Sliders for a lab's values: specs [[key, label, min, max, step, unit, help?]] on the object st; each change calls
 *  refresh(). */
export const sliders = (st, specs, refresh) => specs.map(([key, label, min, max, step, unit, help]) => slider({
  label, unit, min, max, step, value: st[key], help, format: v => `${fmt(v)}${unit ? ` ${unit}` : ""}`,
  onInput: v => { st[key] = v; refresh(); } }));

/** A short plain note under a figure, e.g. "Example values". */
export const caption = text => h("p", { class: "hint" }, text);

/** The index of the sample at share p of a run. */
export const at = (r, p) => Math.min(r.t.length - 1, Math.floor(p * (r.t.length - 1)));
export const deg = r => r * 180 / Math.PI;
export const rad = d => d * Math.PI / 180;
