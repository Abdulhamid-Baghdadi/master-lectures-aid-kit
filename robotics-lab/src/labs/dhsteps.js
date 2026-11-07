// Exercise: the RRT robot of ch. 3, pp. 22–26, solved in two steps. The DH table is filled row by row while each new
// frame appears on the arm (p. 24), then the three steps ⁱ⁻¹Tᵢ are multiplied into ⁰T₃ entry by entry (p. 25) and the
// result is set beside the slide's three printed poses (p. 26). l1…l4 = 1…4 and the stroke l5* = 5 are the slide's.
import { h } from "../../../kit/ui/kit.js";
import * as a from "../../../kit/ui/art.js";
import { stepper, mtx, fmt, same } from "../../../kit/ui/steps.js";
import { chain, rrtRows, dh, posOf, rad, deg } from "../core/index.js";
import { view, link, joint, label, frameAxes, angleSlider, lengthSlider, project } from "./draw.js";
import { twin, matlabTree, PY_HEAD, pyAngles, num } from "./code.js";

const L = [1, 2, 3, 4];
// ch. 3, p. 26: (θ1, θ2) in degrees and the printed ⁰T₃ (l5* = 5).
const PRINTED = [[0, 0, [[0, 0, 1, 12], [0, -1, 0, 0], [1, 0, 0, 3], [0, 0, 0, 1]]],
  [0, 90, [[-1, 0, 0, 3], [0, -1, 0, 0], [0, 0, 1, 12], [0, 0, 0, 1]]],
  [90, 90, [[0, 1, 0, 0], [-1, 0, 0, 3], [0, 0, 1, 12], [0, 0, 0, 1]]]];

const pyRows = st => [PY_HEAD, "l1, l2, l3, l4 = 1, 2, 3, 4   # ch. 3, p. 22", `l5 = ${num(st.l5)}   # the stroke l5*`,
  pyAngles([["theta1", deg(st.t1)], ["theta2", deg(st.t2)]]), "",
  "# the DH table of ch. 3, p. 24: dh(theta, alpha, a, d)",
  "m0_1 = dh(theta1, pi/2, l3, l1 + l2)", "m1_2 = dh(pi/2 + theta2, pi/2, 0, 0)", "m2_3 = dh(0, 0, 0, l4 + l5)"].join("\n");
const mlTree = st => [matlabTree(rrtRows(L, 0, 0, 0).map((r, i) => ({ ...r, theta: i === 1 ? 0 : r.theta, d: i === 2 ? 0 : r.d, type: i === 2 ? "prismatic" : "revolute" }))),
  `q = [${num(st.t1)} pi/2+${num(st.t2)} ${num(L[3] + st.l5)}];   % theta1, 90 deg + theta2 (p. 24), d3 = l4 + l5*`].join("\n");

export default {
  id: "dhsteps",
  art: () => a.picture("A DH table filling row by row beside a robot whose frames appear one after the other",
    a.rect(15, 30, 70, 80, a.DIM, 2) + [50, 70, 90].map(y => a.line([[15, y], [85, y]], a.DIM, 1)).join("") + a.line([[15, 50], [85, 50]], a.ACC, 3)
    + a.line([[115, 125], [115, 70], [150, 70], [185, 70]], a.INK, 3) + a.circle(115, 70, 5, a.ACC) + a.arrow(150, 70, 150, 40, a.ACC, 2)),
  mount(root) {
    const st = { t1: 0, t2: 0, l5: 5, az: rad(30) };
    const ui = { refresh: () => {} };
    const controls = [angleSlider("Joint θ1*", 0, -180, 180, v => { st.t1 = v; ui.refresh(); }).el,
      angleSlider("Joint θ2*", 0, -180, 180, v => { st.t2 = v; ui.refresh(); }).el,
      lengthSlider("Stroke l5*", "", 5, 0, 8, 0.1, v => { st.l5 = v; ui.refresh(); }).el];
    const arm = (frames, n) => {
      const P = project(st.az, rad(20));
      const pts = [[0, 0, 0], [0, 0, L[0] + L[1]], ...frames.slice(1).map(posOf)].map(P);
      return view([-13, -4, 13, 15], `RRT robot with frames 0 to ${n} drawn`, [link(pts), pts.slice(1, 4).map(p => joint(p)),
        frames.slice(0, n + 1).map((T, i) => frameAxes(T, 2, P, String(i))), label(pts.at(-1), "TCP", 10, 18)]);
    };
    const steps = [
      { name: "DH table row by row", draw: p => {
        const rows = rrtRows(L, st.t1, st.t2, st.l5), frames = chain(rows), n = Math.max(1, Math.ceil(p * 3 - 1e-9));
        const sym = [["θ1*", "90°", "l3", "l1 + l2"], ["90° + θ2*", "90°", "0", "0"], ["0", "0", "0", "l4 + l5*"]];
        const f = v => String(Number(v.toFixed(2)));
        const table = h("table", { class: "dh", "aria-label": `The DH table, ${n} of 3 rows` },
          h("thead", {}, h("tr", {}, ["Step", "θᵢ", "αᵢ", "aᵢ", "dᵢ", "now"].map(t => h("th", {}, t)))),
          h("tbody", {}, rows.slice(0, n).map((r, i) => h("tr", { class: i === n - 1 ? "hot" : "" }, h("td", {}, `${i} → ${i + 1}`),
            ...sym[i].map(t => h("td", {}, t)), h("td", {}, `${f(deg(r.theta))}°, ${f(deg(r.alpha))}°, ${f(r.a)}, ${f(r.d)}`)))));
        return {
          figure: [arm(frames, n), table],
          notes: [["Row now", `${n - 1} → ${n}`, "", ["z0 along joint 1, x1 along the common normal", "z1 along joint 2, turned 90° about x1", "z2 along the stroke; frame 3 at the TCP"][n - 1]]],
          sheet: [{ source: "ch. 3, p. 24", sheet: "θ: θ1*, 90° + θ2*, 0; α: 90°, 90°, 0; a: l3, 0, 0; d: l1 + l2, 0, l4 + l5*", lab: "the same table", agree: true }],
          code: [mlTree(st), "showdetails(robot)"].join("\n"),
          python: [pyRows(st), "print(np.round(m0_1, 3))"].join("\n"), pyCheck: ["m0_1", chain(rows)[1]],
          hint: "θ turns about the old z, d moves along it; a moves along the new x, α turns about it (ch. 3, pp. 18–19).",
        };
      } },
      { name: "A₁·A₂·A₃ term by term", draw: p => {
        const rows = rrtRows(L, st.t1, st.t2, st.l5), A = rows.map(r => dh(r.theta, r.alpha, r.a, r.d)), frames = chain(rows), T = frames[3];
        const k = Math.min(15, Math.floor(p * 16));
        const hit = PRINTED.find(([t1, t2]) => Math.abs(deg(st.t1) - t1) < 0.5 && Math.abs(deg(st.t2) - t2) < 0.5);
        const r = Math.floor(k / 4), c = k % 4;
        return {
          figure: [arm(frames, 3), h("div", { class: "mtx-row" }, mtx("⁰T₁", A[0]), mtx("¹T₂", A[1]), mtx("²T₃", A[2])),
            h("div", { class: "mtx-row" }, mtx("⁰T₃", T, { cells: k, hot: k }))],
          notes: [[`Entry (${r + 1}, ${c + 1})`, `${fmt(T[r][c])}`, "", "row of ⁰T₁·¹T₂ times column of ²T₃"],
            ["TCP", `(${posOf(T).map(v => fmt(v)).join("; ")})`, "", "the last column of ⁰T₃"]],
          sheet: hit ? [{ source: "ch. 3, p. 26", sheet: `θ1 = ${hit[0]}°, θ2 = ${hit[1]}°: last column (${posOf(hit[2]).join("; ")})`,
            lab: `(${posOf(T).map(v => fmt(v)).join("; ")})`, agree: st.l5 === 5 && same(T.flat(), hit[2].flat()) }]
            : [{ source: "ch. 3, p. 26", sheet: "prints (0°, 0°), (0°, 90°) and (90°, 90°) with l5* = 5", lab: "set the joints to one of them", agree: undefined }],
          code: [mlTree(st), "T = getTransform(robot,q,'body3')   % 0T3 = 0T1*1T2*2T3"].join("\n"),
          python: [pyRows(st), "T = m0_1 @ m1_2 @ m2_3   # in order, as forward_kinematics(spyder).py multiplies", "print(np.round(T, 3))"].join("\n"),
          pyCheck: ["T", T],
          hint: "The order matters: each step is taken in the frame the one before left (ch. 3, p. 21).",
        };
      } },
    ];
    const { steps: s2, panel } = twin(steps);
    Object.assign(ui, stepper(root, s2, { controls }));
    root.append(panel);
  },
};
