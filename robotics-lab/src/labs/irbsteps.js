// Exercise: the ABB IRB 120 at the student's joint values, in three steps. The student's own seven-row DH table
// (forward_kinematics(spyder).py, report slide 4) beside this lab's six rows, built from the specification's
// dimensions (ABB 2020, p. 12); the flange pose at the home position, set against the student's printed result and the
// specification's row A (p. 31); then every row of the working-range table (p. 31) driven through the chain.
import { h } from "../../../kit/ui/kit.js";
import * as a from "../../../kit/ui/art.js";
import { stepper, mtx, fmt, same } from "../../../kit/ui/steps.js";
import { irb120, irb120Student, IRB120, STUDENT_ROWS, WRIST_TABLE, posOf, rad, deg } from "../core/index.js";
import { view, link, joint, ground, dot, label, frameAxes, angleSlider, project } from "./draw.js";
import { matlabTree, PY_HEAD, pyAngles, num } from "./code.js";

// The student's notebook output for the home position (forward_kinematics(jupyter).ipynb, cell 1).
const STUDENT_HOME = [[0, 0, 1, 374], [0, -1, 0, 0], [1, 0, 0, 630], [0, 0, 0, 1]];
const NAMES = ["Axis 1", "Axis 2", "Axis 3", "Axis 4", "Axis 5", "Axis 6"];
const f2 = v => String(Number(v.toFixed(2)));

/** The Python of the student's script with numbers: seven DH steps, the joint angles added to rows 2–7. */
const pyStudent = q => [PY_HEAD, pyAngles(q.map((v, i) => [`q${i + 1}`, deg(v)])), "",
  "# the DH table of the report, slide 4: dh(theta, alpha, d, a) as the script's subs, here dh(theta, alpha, a, d)",
  ...STUDENT_ROWS.map((r, i) => `m${i}_${i + 1} = dh(${[i ? `${r.theta ? "-pi/2 + " : ""}q${i}` : "0", r.alpha ? (r.alpha > 0 ? "pi/2" : "-pi/2") : "0", num(r.a), num(r.d)].join(", ")})`),
  "", "T = m0_1 @ m1_2 @ m2_3 @ m3_4 @ m4_5 @ m5_6 @ m6_7"].join("\n");
const mlRobot = q => [matlabTree(IRB120.rows.map(r => ({ a: r.a, alpha: r.alpha, d: r.d, theta: 0 }))),
  `q = [${q.map(num).join(" ")}];   % axes 1-6 in rad`, "q(2) = q(2) - pi/2;   % axis 2 is 0 with the upper arm upright: theta2 = q2 - 90 deg"].join("\n");

export default {
  id: "irbsteps",
  art: () => a.picture("Two DH tables side by side and the six-axis arm they both describe, its flange frame drawn",
    a.rect(15, 25, 45, 90, a.DIM, 2) + a.rect(65, 35, 40, 80, a.ACC, 2) + a.line([[130, 130], [130, 75], [175, 65]], a.INK, 4)
    + a.circle(130, 75, 5, a.ACC) + a.arrow(175, 65, 195, 65, a.ACC, 2)),
  mount(root) {
    const q = [0, 0, 0, 0, 0, 0], st = { az: rad(30) };
    const ui = { refresh: () => {} };
    const sliders = NAMES.map((n, i) => angleSlider(n, 0, Math.round(deg(IRB120.limits[i][0])), Math.round(deg(IRB120.limits[i][1])), v => { q[i] = v; ui.refresh(); }));
    const arm = (qq, extra = []) => {
      const fr = irb120(qq), P = project(st.az, rad(25)), w = posOf(fr[4]);
      const pts = [[0, 0, 0], ...[1, 2, 3, 4, 6].map(i => posOf(fr[i]))];
      return view([-650, -200, 650, 950], `IRB 120 at axes ${qq.map(v => deg(v).toFixed(0)).join("°, ")}°`, [
        link([P([-250, 0, 0]), P([250, 0, 0])], "faint"), link(pts.map(P)), pts.slice(1, -1).map(p => joint(P(p))), ground(P([0, 0, 0])),
        dot(P(w)), label(P(w), "wrist centre", 10, -10), frameAxes(fr[6], 90, P, ""), extra.map(e => e(P))]);
    };
    const steps = [
      { name: "Two DH tables, one robot", draw: p => {
        const n = Math.max(1, Math.ceil(p * 7 - 1e-9)), mine = IRB120.rows;
        const tab = (caption, rows, shown, base) => h("table", { class: "dh", "aria-label": caption },
          h("caption", {}, caption), h("thead", {}, h("tr", {}, ["Row", "θ", "α", "a", "d"].map(t => h("th", {}, t)))),
          h("tbody", {}, rows.slice(0, shown).map((r, i) => h("tr", {}, h("td", {}, String(i + 1)),
            h("td", {}, `${base(i)}${r.theta || r.offset ? ` ${f2(deg(r.theta ?? r.offset))}°` : ""}`), h("td", {}, `${f2(deg(r.alpha))}°`), h("td", {}, f2(r.a)), h("td", {}, f2(r.d))))));
        const a7 = irb120Student(q)[7], a6 = irb120(q)[6];
        return {
          figure: [arm(q), h("div", { class: "mtx-row" },
            tab("The student's table (report, slide 4)", STUDENT_ROWS, n, i => (i ? `q${i}` : "fixed")),
            tab("This lab's table (from ABB p. 12)", mine, Math.max(0, n - 1), i => `q${i + 1}`))],
          notes: [["Base height", "165 + 125 = 290 mm", "", "the student splits it over a fixed first row; ABB p. 12 gives 290"],
            ["Flange, both tables", `(${posOf(a7).map(v => fmt(v)).join("; ")}) mm`, same(a7.flat(), a6.flat(), 1e-9) ? "" : "warn", same(a7.flat(), a6.flat(), 1e-9) ? "the two tables give the same pose" : "the tables disagree"]],
          sheet: [{ source: "student's script", sheet: "7 rows: d 165, 125, 0, 0, 302, 0, 72; a 0, 0, 270, 70, 0, 0, 0; α 0, −90°, 0, −90°, 90°, −90°, 0", lab: "6 rows with d1 = 290: the same chain", agree: true }],
          code: [mlRobot(q), "showdetails(robot)"].join("\n"),
          python: [pyStudent(q), "print(np.round(T, 3))"].join("\n"), pyCheck: ["T", a7],
          hint: "Both tables put axis 3's −90° into row 3 or the offset of axis 2, so the upper arm is upright at q = 0.",
        };
      } },
      { name: "Home pose against the student and ABB", draw: p => {
        // The arm moves from the sliders' pose home, so the comparison is always made at q = 0 at the end.
        const qq = q.map(v => v * (1 - p)), T = irb120(qq)[6], w = posOf(irb120(qq)[4]), home = p >= 1;
        return {
          figure: [arm(qq), h("div", { class: "mtx-row" }, mtx("⁰T₆", T, { cells: Math.floor(p * 16) }))],
          notes: [["Wrist centre", `(${w.map(v => fmt(v)).join("; ")}) mm`, "", "72 mm behind the flange along its z"]],
          sheet: home ? [{ source: "student's notebook", sheet: "T = [0 0 1 374; 0 −1 0 0; 1 0 0 630]", lab: T.slice(0, 3).map(r => r.map(v => fmt(v)).join(" ")).join("; "), agree: same(T.flat(), STUDENT_HOME.flat(), 1e-9) },
            { source: "ABB p. 31, row A", sheet: "wrist centre X 302, Z 630 mm", lab: `X ${fmt(w[0])}, Z ${fmt(w[2])}`, agree: Math.abs(w[0] - 302) < 1 && Math.abs(w[2] - 630) < 1 }] : [],
          code: [mlRobot(qq), "T = getTransform(robot,q,'body6')   % 0T6, the flange"].join("\n"),
          python: [pyStudent(qq), "print(np.round(T, 3))"].join("\n"), pyCheck: ["T", T],
          hint: "At home the third column, the flange's z, is (1, 0, 0)ᵀ: the tool looks forward along x0, 302 + 72 = 374 mm out.",
        };
      } },
      { name: "The working-range table, row by row", draw: p => {
        const keys = Object.keys(WRIST_TABLE), k = keys[Math.min(keys.length - 1, Math.floor(p * keys.length))], [a2, a3, X, Z] = WRIST_TABLE[k];
        const qq = [0, rad(a2), rad(a3), 0, 0, 0], w = posOf(irb120(qq)[4]), ok = Math.abs(w[0] - X) < 1 && Math.abs(w[2] - Z) < 1;
        return {
          figure: [arm(qq, [P => dot(P([X, 0, Z]), "second")])],
          notes: [[`Row ${k}`, `axis 2 ${a2}°, axis 3 ${a3}°`]],
          sheet: [{ source: `ABB p. 31, row ${k}`, sheet: `X ${X}, Z ${Z} mm`, lab: `X ${fmt(w[0], 4)}, Z ${fmt(w[2], 4)} mm`, agree: ok }],
          code: [mlRobot(qq), "T = getTransform(robot,q,'body4');   % frame 4: the wrist centre", "wc = T(1:3,4)'"].join("\n"),
          python: [pyStudent(qq), "m0_5 = m0_1 @ m1_2 @ m2_3 @ m3_4 @ m4_5   # frame 5 of the student's table is the wrist centre",
            "wc = m0_5[:3, 3]", "print(np.round(wc, 1))"].join("\n"), pyCheck: ["wc", w],
          hint: "Rows D and H print Z = 270 mm; the chain, and the drawing's 290 mm shoulder height, give 290 mm (README, source notes).",
        };
      } },
    ];
    Object.assign(ui, stepper(root, steps, { controls: sliders.map(s => s.el) }));
  },
};
