// The Denavit–Hartenberg chain (Ajanović 2020, ch. 3, pp. 18–26): four numbers per joint, θ, α, a and d, give each step
// ⁱ⁻¹Tᵢ = Rot(z, θ)·Trans(z, d)·Trans(x, a)·Rot(x, α), and the product of the steps is the pose. The slides' RRT robot,
// with l1…l4 = 1…4 and the slide's stroke l5* = 5 as its start.
import { chain, rrtRows, posOf, rad, deg } from "../core/index.js";
import { h, readout } from "../../../kit/ui/kit.js";
import * as a from "../../../kit/ui/art.js";
import { view, link, joint, label, frameAxes, angleSlider, lengthSlider, matrix, project, num } from "./draw.js";

const L = [1, 2, 3, 4];

export default {
  id: "dh",
  art: () => a.picture("A table of four joint parameters beside a chain of frames, one per joint",
    a.rect(20, 30, 70, 90, a.DIM, 2) + [50, 70, 90].map(y => a.line([[20, y], [90, y]], a.DIM, 1)).join("") + a.text(55, 25, "θ α a d", 13, a.ACC) +
      a.line([[115, 125], [115, 75], [150, 75], [185, 40]], a.INK, 3) + a.circle(115, 75, 5, a.ACC) + a.circle(150, 75, 5, a.ACC)),
  mount(root) {
    const st = { t1: 0, t2: 0, l5: 5, az: rad(30) };
    const box = h("div", {}), table = h("div", {}), mat = h("div", {}), rP = readout("Position of frame 3");
    const update = () => {
      const rows = rrtRows(L, st.t1, st.t2, st.l5), frames = chain(rows), P = project(st.az, rad(20));
      const pts = [[0, 0, 0], [0, 0, L[0] + L[1]], ...frames.slice(1).map(posOf)].map(P);
      box.replaceChildren(view([-13, -4, 13, 15], `RRT robot at θ1 = ${deg(st.t1).toFixed(0)}°, θ2 = ${deg(st.t2).toFixed(0)}°, stroke ${st.l5}`, [
        link(pts), pts.slice(1, 4).map(p => joint(p)), frames.map((T, i) => frameAxes(T, 2, P, String(i))), label(pts.at(-1), "3", 10, 18)]));
      const f = v => Number(v.toFixed(2));
      table.replaceChildren(h("table", { class: "dh", "aria-label": "The DH table now" },
        h("thead", {}, h("tr", {}, ["Step", "θᵢ", "αᵢ", "aᵢ", "dᵢ"].map(t => h("th", {}, t)))),
        h("tbody", {}, rows.map((r, i) => h("tr", {}, h("td", {}, `${i} → ${i + 1}`), h("td", {}, `${f(deg(r.theta))}°`), h("td", {}, `${f(deg(r.alpha))}°`), h("td", {}, String(f(r.a))), h("td", {}, String(f(r.d))))))));
      mat.replaceChildren(h("p", { class: "hint" }, "⁰T₃ = ⁰T₁·¹T₂·²T₃:"), matrix(frames.at(-1), 3, "The pose of frame 3"));
      const p = posOf(frames.at(-1));
      rP.set(`(${p.map(v => num(v, 2)).join("; ")})`, "", "the last column of ⁰T₃");
    };
    root.append(h("div", { class: "stage" }, h("div", {}, box, table, mat), h("div", { class: "controls" },
      angleSlider("Joint θ1*", 0, -180, 180, v => { st.t1 = v; update(); }).el,
      angleSlider("Joint θ2*", 0, -180, 180, v => { st.t2 = v; update(); }).el,
      lengthSlider("Stroke l5*", "", 5, 0, 8, 0.1, v => { st.l5 = v; update(); }).el,
      angleSlider("View from", 30, -180, 180, v => { st.az = v; update(); }).el,
      rP.el,
      h("p", { class: "hint" }, "θ turns about the old z-axis until the old x lies along the new; d moves along the old z; a along the new x; α turns about the new x until the old z lies along the new (ch. 3, p. 18). Try 0°, 0° then 0°, 90° then 90°, 90°: the slides print these three poses (p. 26)."))));
    update();
  },
};
