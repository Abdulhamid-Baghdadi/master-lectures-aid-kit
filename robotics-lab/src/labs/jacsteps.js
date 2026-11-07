// Exercise: the planar two-link arm's Jacobian by the course's schema (ch. 4, p. 15), in two steps. Each column is
// z_{i−1} × (p − p_{i−1}), drawn as the lever arm and the speed it gives the tip; the result is the matrix of p. 20.
// Then the elbow closes towards θ2 = 0 and det J = l1 l2 sin θ2 (worked here from p. 20) falls to zero as the columns
// line up. Values of ch. 2, p. 38: l1 = 5, l2 = 3, θ1 = 20°, θ2 = 64°.
import { h } from "../../../kit/ui/kit.js";
import * as a from "../../../kit/ui/art.js";
import { lineChart } from "../../../kit/ui/chart.js";
import { stepper, mtx, fmt } from "../../../kit/ui/steps.js";
import { chain, jacobian, jacobian2r, det, posOf, rad, deg } from "../core/index.js";
import { view, link, joint, ground, label, arrow, angleSlider, lengthSlider } from "./draw.js";
import { twin, matlabTree, PY_HEAD, pyAngles, num } from "./code.js";

const rows = st => [{ theta: st.t1, alpha: 0, a: st.l1, d: 0 }, { theta: st.t2, alpha: 0, a: st.l2, d: 0 }];
/** The 2 × 2 position Jacobian by the schema (rows vx, vy of the 6 × n matrix). */
const jac = st => jacobian(chain(rows(st)), ["R", "R"]).slice(0, 2);

const py = st => [PY_HEAD, `l1, l2 = ${num(st.l1)}, ${num(st.l2)}   # ch. 2, p. 38`, pyAngles([["theta1", deg(st.t1)], ["theta2", deg(st.t2)]]), "",
  "m0_1 = dh(theta1, 0, l1, 0)", "m0_2 = m0_1 @ dh(theta2, 0, l2, 0)", "p = m0_2[:3, 3]   # the tip",
  "# the schema of ch. 4, p. 15: a turning joint i gives z_(i-1) x (p - p_(i-1))",
  "J1 = np.cross([0, 0, 1], p - np.zeros(3))", "J2 = np.cross(m0_1[:3, 2], p - m0_1[:3, 3])",
  "J = np.column_stack([J1, J2])[:2, :]   # rows vx, vy"].join("\n");
const ml = st => [matlabTree(rows(st).map(r => ({ ...r, theta: 0 }))), `q = [${num(st.t1)} ${num(st.t2)}];`,
  "J6 = geometricJacobian(robot,q,'body2');   % rows 1-3 angular, 4-6 linear", "J = J6(4:5,:)   % vx, vy",
  "% the same by hand (ch. 4, p. 20):", `l1 = ${num(st.l1)}; l2 = ${num(st.l2)}; t1 = q(1); t2 = q(2);`,
  "Jh = [-l1*sin(t1)-l2*sin(t1+t2) -l2*sin(t1+t2); l1*cos(t1)+l2*cos(t1+t2) l2*cos(t1+t2)]"].join("\n");

export default {
  id: "jacsteps",
  art: () => a.picture("A two-link arm with two arrows at its tip, one for each joint, nearly lined up as the elbow straightens",
    a.line([[30, 125], [95, 80], [160, 60]], a.INK, 3) + a.circle(30, 125, 6, a.ACC) + a.circle(95, 80, 5)
    + a.arrow(160, 60, 175, 20, a.ACC, 2) + a.arrow(160, 60, 185, 35, a.COOL, 2)),
  mount(root) {
    const st = { l1: 5, l2: 3, t1: rad(20), t2: rad(64) };
    const ui = { refresh: () => {} };
    const controls = [lengthSlider("Link l1", "", 5, 1, 8, 0.1, v => { st.l1 = v; ui.refresh(); }).el,
      lengthSlider("Link l2", "", 3, 1, 8, 0.1, v => { st.l2 = v; ui.refresh(); }).el,
      angleSlider("Joint θ1", 20, -180, 180, v => { st.t1 = v; ui.refresh(); }).el,
      angleSlider("Joint θ2", 64, -180, 180, v => { st.t2 = v; ui.refresh(); }).el];
    const K = 0.3; // the speed arrows drawn at this share of their length so they fit
    const picture = (s, shown) => {
      const fr = chain(rows(s)), o = [0, 0], e = posOf(fr[1]).slice(0, 2), p = posOf(fr[2]).slice(0, 2), J = jac(s), R = s.l1 + s.l2;
      const col = j => [p[0] + K * J[0][j], p[1] + K * J[1][j]];
      return view([-R - 1, -R - 1, R + 1, R + 1], `Two-link arm at θ1 = ${fmt(deg(s.t1), 3)}°, θ2 = ${fmt(deg(s.t2), 3)}° with its Jacobian's columns at the tip`, [
        link([o, e, p]), joint(e), ground(o),
        shown >= 1 ? [arrow(o, p, "faint"), arrow(p, col(0), "speed"), label(col(0), "J₁", 6, -6)] : null,
        shown >= 2 ? [arrow(e, p, "faint"), arrow(p, col(1), "second"), label(col(1), "J₂", 6, 12)] : null]);
    };
    const steps = [
      { name: "Columns as z × (p − pᵢ)", draw: p => {
        const J = jac(st), shown = p < 0.5 ? 1 : 2;
        return {
          figure: [picture(st, shown), h("div", { class: "mtx-row" }, mtx("J", J, { cells: shown === 1 ? 0 : 2, hot: -1, row: false }))],
          notes: [["Column now", shown === 1 ? "J₁ = z₀ × (p − p₀)" : "J₂ = z₁ × (p − p₁)", "", "z points out of the page: the cross product turns the lever arm 90° left"],
            ["J", J.map(r => `(${r.map(v => fmt(v)).join(", ")})`).join(" ; ")]],
          sheet: [{ source: "ch. 4, p. 20", sheet: "J = [−l1 s1 − l2 s12, −l2 s12; l1 c1 + l2 c12, l2 c12]", lab: "the schema gives the same entries", agree: jacobian2r(st.l1, st.l2, st.t1, st.t2).flat().every((v, i) => Math.abs(v - J.flat()[i]) < 1e-9) }],
          code: ml(st), python: [py(st), "print(np.round(J, 3))"].join("\n"), pyCheck: ["J", J],
          hint: "Each column is the tip's speed when only that joint turns at 1 rad/s; the faint arrows are the lever arms p − pᵢ.",
        };
      } },
      { name: "Towards the singularity: det J", draw: p => {
        const s = { ...st, t2: st.t2 * (1 - p) }, J = jac(s), D = det(J), xs = Array.from({ length: 181 }, (_, i) => -180 + 2 * i);
        const sing = Math.abs(Math.sin(s.t2)) < 0.02;
        return {
          figure: [picture(s, 2), lineChart({ label: "det J over the elbow angle θ2", lines: [{ x: xs, y: xs.map(t => s.l1 * s.l2 * Math.sin(rad(t))), name: "l1 l2 sin θ2" }],
            marks: [{ x: deg(s.t2), y: D, shape: "dot" }], xLabel: "Elbow angle θ2 [°]", yLabel: "det J [1]", xMin: -180, xMax: 180 })],
          notes: [["det J", fmt(D), sing ? "warn" : "", sing ? "singular: the two columns are parallel, the tip cannot move along the arm" : `l1 l2 sin θ2 = ${fmt(s.l1 * s.l2 * Math.sin(s.t2))}`]],
          sheet: [{ source: "worked here from ch. 4, p. 20", sheet: "det J = l1 l2 sin θ2, zero at θ2 = 0° and 180°", lab: `${fmt(D)} at θ2 = ${fmt(deg(s.t2), 3)}°`, agree: Math.abs(D - s.l1 * s.l2 * Math.sin(s.t2)) < 1e-9 }],
          code: [ml(s), "det(J)   % = l1*l2*sin(t2): zero when the arm is stretched or folded"].join("\n"),
          python: [py(s), "d = np.linalg.det(J)   # = l1*l2*sin(theta2)", "print(round(d, 4))"].join("\n"), pyCheck: ["d", D],
          hint: "As θ2 closes, J₁ and J₂ turn onto one line; at θ2 = 0 no joint speeds give a tip speed along the arm (q̇ = J⁻¹v fails, ch. 4, p. 12).",
        };
      } },
    ];
    const { steps: s2, panel } = twin(steps);
    Object.assign(ui, stepper(root, s2, { controls }));
    root.append(panel);
  },
};
