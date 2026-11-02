// Modal analysis (Krach 2018, pp. 39–47; Puhwein 2020, pp. 27–28): without damping and load, [M]{ẍ} + [K]{x} = 0, and
// only mass and stiffness set the natural frequencies, ω = √(K/m) for one mass. A chain of masses and springs gives
// det([K] − ω²[M]) = 0: one frequency and one mode shape per degree of freedom, with no amplitude, since no load
// is applied.
import { chainModes, sdof } from "../core/index.js";
import { h, s, slider, readout, choice } from "../../../kit/ui/kit.js";
import * as a from "../../../kit/ui/art.js";
import { view, spring, wall, label } from "./draw.js";

/** A mass drawn as a square block centred at p, side 30 mm. */
const block = (p, text) => at => {
  const [x, y] = at([p[0] - 15, p[1] + 15]), [x2, y2] = at([p[0] + 15, p[1] - 15]);
  return s("g", {}, s("rect", { x, y, width: x2 - x, height: y2 - y, class: "body" }),
    s("text", { x: (x + x2) / 2, y: (y + y2) / 2 + 5, class: "tick", "text-anchor": "middle" }, text));
};

export default {
  id: "modal",
  art: () => a.picture("Two masses on springs from a wall, with their two mode shapes as arrows in and out of phase",
    a.line([[15, 45], [15, 105]], a.DIM, 3) + a.line([[15, 75], [55, 75]], a.INK, 2.5) + a.rect(55, 60, 30, 30, a.INK, 3) + a.line([[85, 75], [125, 75]], a.INK, 2.5) + a.rect(125, 60, 30, 30, a.INK, 3) +
      a.arrow(70, 115, 90, 115, a.ACC, 2) + a.arrow(140, 115, 172, 115, a.ACC, 2) + a.arrow(78, 135, 58, 135, a.COOL, 2) + a.arrow(140, 135, 160, 135, a.COOL, 2)),
  mount(root) {
    const p = { n: 2, m: 1, k: 100, m2: 1, k2: 100, held: false };
    let mode = 0;
    const pic = h("div", {}), rF = readout("Natural frequencies f"), rMode = readout("This mode's shape"), rOne = readout("One mass alone, f0 = √(k/m)/2π");
    const modeChoice = h("div", {});
    const update = () => {
      // Every mass and spring equal, except the last mass and the spring to it, which the student sets apart.
      const masses = Array.from({ length: p.n }, (_, i) => i === p.n - 1 ? p.m2 : p.m);
      const springs = Array.from({ length: p.n + (p.held ? 1 : 0) }, (_, i) => i === p.n - 1 ? p.k2 : p.k);
      const r = chainModes(masses, springs, { bothEnds: p.held });
      mode = Math.min(mode, p.n - 1);
      const shape = r.modes[mode], gap = 80, xs = masses.map((_, i) => gap * (i + 1));
      const right = gap * (p.n + 1);
      pic.replaceChildren(view([-30, -80, right + 30, 60], `${p.n} masses on springs, mode ${mode + 1} at ${r.f[mode].toFixed(2)} Hz`, [
        wall([0, 0], [-1, 0]), p.held ? wall([right, 0], [1, 0]) : null,
        xs.map((x, i) => spring([i ? xs[i - 1] + 15 : 0, 0], [x - 15, 0])), p.held ? spring([xs.at(-1) + 15, 0], [right, 0]) : null,
        xs.map((x, i) => block([x, 0], `m${i + 1}`)),
        // The mode shape: each mass's amplitude as an arrow below it, the largest 30 mm.
        xs.map((x, i) => at => { const [px, py] = at([x, -45]), [qx] = at([x + 30 * shape[i], -45]);
          return s("line", { x1: px, y1: py, x2: qx, y2: py, class: "series second", "stroke-width": 4 }); }),
        label([-25, -65], `mode ${mode + 1}: amplitudes below each mass`, 0, 0)]));
      rF.set(r.f.map(f => `${f.toFixed(2)} Hz`).join(", "), "", `ω² = λ from det([K] − λ[M]) = 0; λ = ${r.lambda.map(l => l.toFixed(1)).join(", ")} s⁻²`);
      rMode.set(shape.map(v => v.toFixed(3)).join(" : "), "", mode === 0 ? "all masses move together: the lowest mode" : `${mode} change${mode > 1 ? "s" : ""} of sign along the chain`);
      rOne.set(`${sdof(p.k, p.m).f.toFixed(2)} Hz`, "", "with k and m of the first spring and mass");
      modeChoice.replaceChildren(choice("Mode shown", r.f.map((f, i) => [String(i), `Mode ${i + 1}, ${f.toFixed(2)} Hz`]), String(mode), v => { mode = Number(v); update(); }));
    };
    const sl = (name, key, min, max, step, unit) => slider({ label: name, unit, min, max, value: p[key], step, format: v => unit ? `${v} ${unit}` : String(v), onInput: v => { p[key] = v; update(); } }).el;
    root.append(h("div", { class: "stage" }, pic, h("div", { class: "controls" },
      sl("Masses n", "n", 1, 6, 1, ""), sl("Mass m", "m", 0.1, 10, 0.1, "kg"), sl("Stiffness k", "k", 10, 1000, 10, "N/m"),
      sl("Last mass", "m2", 0.1, 10, 0.1, "kg"), sl("Spring to the last mass", "k2", 10, 1000, 10, "N/m"),
      choice("Right end", [["free", "Free"], ["held", "Held by a spring to a wall"]], "free", v => { p.held = v === "held"; update(); }),
      modeChoice, rF.el, rMode.el, rOne.el,
      h("p", { class: "hint" }, "Two masses with the right end free is the two-mass oscillator of the ModSim exercises (Puhwein 2020, p. 27), here without dampers. Held at both ends, two masses and three springs are the spring system of the FEM introduction (Krach 2020a, p. 29). Keep the structure's natural frequencies away from the frequency it runs at, above or below (Krach 2018, p. 42). The amplitudes are relative: an eigen analysis applies no load, so it cannot say how far the masses move (p. 43)."))));
    update();
  },
};
