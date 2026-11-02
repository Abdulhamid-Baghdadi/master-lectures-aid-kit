// The mobility count (Berger 2021, ch. 4, p. 23; ch. 3, pp. 28 and 113): F = 3(n − 1) − 2g1 − g2 says how many drives
// a plane mechanism needs; F = 0 is a rigid structure, F < 0 a structure with redundant links.
import { mobility } from "../core/index.js";
import { h, slider, readout, choice } from "../../../kit/ui/kit.js";
import { view, link, ground, joint, label } from "./draw.js";
import * as a from "../../../kit/ui/art.js";

// The examples: their links and joints, and where to draw them (mm). Frame pivots are listed in ground.
const EXAMPLES = {
  triangle: { name: "Three bars in a triangle", n: 3, g1: 3, g2: 0, ground: [[0, 0], [100, 0]], links: [[[0, 0], [50, 70], [100, 0]]] },
  fourbar: { name: "Four-bar linkage", n: 4, g1: 4, g2: 0, ground: [[0, 0], [100, 0]], links: [[[0, 0], [20, 50], [110, 70], [100, 0]]] },
  slider: { name: "Slider-crank", n: 4, g1: 4, g2: 0, ground: [[0, 0]], links: [[[0, 0], [25, 35], [120, 0]]], slide: [120, 0] },
  fivebar: { name: "Five-bar linkage", n: 5, g1: 5, g2: 0, ground: [[0, 0], [120, 0]], links: [[[0, 0], [10, 50], [60, 80], [115, 50], [120, 0]]] },
  cam: { name: "Ch. 3, p. 113: two cam pairs", n: 5, g1: 4, g2: 2, ground: [[0, 0], [120, 0]], links: [[[0, 0], [30, 60], [90, 60], [120, 0]], [[30, 60], [60, 100]]] },
  watt: { name: "Watt six-bar", n: 6, g1: 7, g2: 0, ground: [[0, 0], [80, 0], [160, 0]], links: [[[0, 0], [10, 50], [70, 55], [80, 0]], [[10, 50], [40, 80], [70, 55]], [[40, 80], [140, 70], [160, 0]]] },
};

const MEANING = {
  overconstrained: "statically indeterminate: a structure that cannot move, with links to spare",
  structure: "statically determinate: a rigid structure",
  constrained: "constrained motion (Zwanglauf): as many drives as degrees of freedom",
  unconstrained: "not constrained: more freedom than drives, some links move as they like",
  overdriven: "more drives than freedom: the drives fight each other",
};

export default {
  id: "mobility",
  art: () => a.picture("A four-bar linkage on two frame pivots with its count F = 1",
    a.line([[40, 120], [60, 60], [140, 45], [160, 120]], a.INK, 3) + a.circle(40, 120, 6, a.ACC) + a.circle(160, 120, 6, a.ACC) +
      a.line([[25, 132], [175, 132]], a.DIM, 2) + a.text(100, 30, "F = 1", 18, a.ACC)),
  mount(root) {
    let key = "fourbar", n = 4, g1 = 4, g2 = 0, drives = 1;
    const box = h("div", {}), rF = readout("Degrees of freedom F"), rM = readout("What it means");
    const sN = slider({ label: "Links n (with the frame)", min: 2, max: 10, value: n, step: 1, format: v => String(v), onInput: v => { n = v; update(); } });
    const sG1 = slider({ label: "Joints with one freedom g1", min: 0, max: 14, value: g1, step: 1, format: v => String(v), onInput: v => { g1 = v; update(); } });
    const sG2 = slider({ label: "Joints with two freedoms g2", min: 0, max: 6, value: g2, step: 1, format: v => String(v), onInput: v => { g2 = v; update(); } });
    const update = () => {
      const e = EXAMPLES[key], m = mobility(n, g1, g2, drives), own = e.n === n && e.g1 === g1 && e.g2 === g2;
      const all = [...e.ground, ...e.links.flat()];
      const xs = all.map(p => p[0]), ys = all.map(p => p[1]);
      box.replaceChildren(view([Math.min(...xs) - 20, Math.min(...ys) - 25, Math.max(...xs) + 20, Math.max(...ys) + 20], `${e.name}: ${e.n} links, ${e.g1} turning or sliding joints, ${e.g2} cam or rolling joints`, [
        e.links.map(l => link(l)), e.slide ? [link([[e.slide[0] - 15, e.slide[1] - 8], [e.slide[0] + 15, e.slide[1] - 8], [e.slide[0] + 15, e.slide[1] + 8], [e.slide[0] - 15, e.slide[1] + 8], [e.slide[0] - 15, e.slide[1] - 8]]), link([[e.slide[0] - 40, e.slide[1] - 12], [e.slide[0] + 40, e.slide[1] - 12]], "faint")] : [],
        e.links.flat().map(p => joint(p)), e.ground.map(p => ground(p)),
        label([Math.min(...xs) - 15, Math.max(...ys) + 12], own ? `n = ${n}, g1 = ${g1}, g2 = ${g2}` : "your own count (picture: the example)", 0, 0)]));
      rF.set(`F = ${m.F}`, m.F < 0 || m.verdict === "overdriven" ? "warn" : "", `3(${n} − 1) − 2·${g1} − ${g2} = ${3 * (n - 1)} − ${2 * g1} − ${g2}`);
      rM.set(m.verdict === "constrained" ? "Moves as driven" : m.F > 0 ? "Moves" : "Rigid", m.verdict === "constrained" ? "" : "warn", MEANING[m.verdict]);
    };
    const pick = v => { key = v; ({ n, g1, g2 } = EXAMPLES[v]); sN.set(n); sG1.set(g1); sG2.set(g2); update(); };
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      choice("Example", Object.entries(EXAMPLES).map(([k, e]) => [k, e.name]), key, pick),
      sN.el, sG1.el, sG2.el,
      slider({ label: "Drives", min: 1, max: 3, value: drives, step: 1, format: v => String(v), onInput: v => { drives = v; update(); } }).el,
      rF.el, rM.el,
      h("p", { class: "hint" }, "Count the frame as a link. A turning or sliding joint leaves one freedom (g1); a cam contact or a rolling contact with slip leaves two (g2). The slider-crank's sliding joint counts in g1 like the hinges. The count can be fooled by special lengths: a parallelogram with a fourth bar has F = 0 by the count but moves. In space the factor 3 becomes 6."))));
    update();
  },
};
