// The ABB IRB 120, a six-axis arm with 0.58 m reach (ABB 2020, pp. 11–12 and 31–32), as a DH chain built from the
// specification's dimensions. Its wrist-centre table (p. 31) is the check: the lab sets axes 2 and 3 to a row and shows
// where the chain puts the wrist centre. The geometric Jacobian (ch. 4, p. 15) shows where the arm loses a freedom.
import { irb120, IRB120, WRIST_TABLE, jacobian, det, posOf, rad, deg } from "../core/index.js";
import { h, readout, choice } from "../../../kit/ui/kit.js";
import * as a from "../../../kit/ui/art.js";
import { view, link, joint, ground, label, frameAxes, angleSlider, project, num, dot } from "./draw.js";

// The specification's table of wrist-centre positions, p. 31, now kept in the core (chains.js) for the stepped lab too.
const TABLE = WRIST_TABLE;
const NAMES = ["Axis 1, turn", "Axis 2, arm", "Axis 3, arm", "Axis 4, wrist", "Axis 5, bend", "Axis 6, turn"];

export default {
  id: "irb120",
  art: () => a.picture("A six-axis industrial arm on its base, upper arm upright and forearm reaching forward",
    a.rect(70, 112, 40, 20, a.INK, 3) + a.line([[90, 112], [90, 60], [150, 52]], a.INK, 4) + a.line([[150, 52], [168, 52]], a.ACC, 4) +
      a.circle(90, 60, 6, a.ACC) + a.circle(150, 52, 5, a.ACC) + a.line([[30, 132], [170, 132]], a.DIM, 2)),
  mount(root) {
    const q = [0, 0, 0, 0, rad(30), 0], st = { az: rad(30) };
    const box = h("div", {}), rW = readout("Wrist centre"), rT = readout("The specification's row"), rF = readout("Flange"), rJ = readout("Jacobian determinant");
    let row = "A";
    const sliders = NAMES.map((name, i) => angleSlider(name, deg(q[i]), Math.round(deg(IRB120.limits[i][0])), Math.round(deg(IRB120.limits[i][1])),
      v => { q[i] = v; row = ""; update(); }));
    const update = () => {
      const frames = irb120(q), P = project(st.az, rad(25)), w = posOf(frames[4]), f = posOf(frames[6]);
      const pts = [[0, 0, 0], ...[1, 2, 3, 4, 6].map(i => posOf(frames[i]))];
      box.replaceChildren(view([-650, -200, 650, 950], `IRB 120 with axes at ${q.map(v => deg(v).toFixed(0)).join("°, ")}°: wrist centre at (${w.map(v => num(v, 0)).join(", ")}) mm`, [
        link([P([-250, 0, 0]), P([250, 0, 0])], "faint"), link([P([0, -250, 0]), P([0, 250, 0])], "faint"),
        link(pts.map(P)), pts.slice(1, -1).map(p => joint(P(p))), ground(P([0, 0, 0])), dot(P(w)), label(P(w), "wrist centre", 10, -10),
        frameAxes(frames[6], 90, P, "")]));
      rW.set(`(${w.map(v => num(v, 0)).join("; ")}) mm`, "", "origin of frame 4, where axes 4, 5 and 6 meet");
      const t = TABLE[row];
      rT.set(row ? `${row}: X ${t[2]}, Z ${t[3]} mm` : "—", row === "D" || row === "H" ? "warn" : "",
        row === "D" || row === "H" ? "the table prints Z = 270 mm; level at the shoulder the chain gives 290 mm, the base height of p. 12" : row ? "as printed; the chain's X and Z above" : "pick a row to compare");
      rF.set(`(${f.map(v => num(v, 0)).join("; ")}) mm`, "", "72 mm beyond the wrist centre along the flange's z");
      const D = det(jacobian(frames, Array(6).fill("R")));
      const wrist = Math.abs(Math.sin(q[4])) < 0.03;
      rJ.set(D.toExponential(2), wrist || Math.abs(D) < 1e3 ? "warn" : "", wrist ? "singular: axis 5 at 0° lines up axes 4 and 6" : Math.abs(D) < 1e3 ? "near a singular pose: some tool speed needs very fast joints" : "regular: every tool speed has its joint speeds, q̇ = J⁻¹v");
    };
    const pick = k => { row = k; q[1] = rad(TABLE[k][0]); q[2] = rad(TABLE[k][1]); sliders[1].set(TABLE[k][0]); sliders[2].set(TABLE[k][1]); update(); };
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      choice("Row of the working-range table (p. 31)", Object.keys(TABLE).map(k => [k, k]), row, pick),
      ...sliders.map(s => s.el),
      angleSlider("View from", 30, -180, 180, v => { st.az = v; update(); }).el,
      rW.el, rT.el, rF.el, rJ.el,
      h("p", { class: "hint" }, "The DH table is built here from the drawing's dimensions (p. 12): 290, 270, 70, 302 and 72 mm; the specification gives no DH table. Axes 2 and 3 turn forward for positive angles, as the table reads. The working ranges are those of p. 32."))));
    pick("A");
  },
};
