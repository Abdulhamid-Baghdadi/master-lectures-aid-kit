// Exercise: inverse kinematics in three steps. The two-link arm of ch. 5, p. 20 (l1 = 5, l2 = 4, TCP (6 | 5.93)) swung
// into both of its solutions, elbow one way and the other; the three-link arm, which first backs off its last link to
// the wrist (the idea of the central wrist, p. 6, worked here in the plane); then the IRB 120 split the same way: the
// wrist centre gives axes 1–3, the rest of the turn gives axes 4–6 (worked here for this lab's DH table).
import { h } from "../../../kit/ui/kit.js";
import * as a from "../../../kit/ui/art.js";
import { stepper, fmt, same } from "../../../kit/ui/steps.js";
import { ik2r, ik3r, ikIrb120, irb120, planar2r, posOf, rad, deg } from "../core/index.js";
import { view, link, joint, ground, label, ring, dot, angleSlider, lengthSlider, project, frameAxes } from "./draw.js";
import { twin, matlabTree, PY_HEAD, pyMat, num } from "./code.js";
import { IRB120 } from "../core/index.js";

const f2 = t => `${fmt(deg(t), 4)}°`;
const PY_IK = st => ["import numpy as np", `l1, l2 = ${num(st.l1)}, ${num(st.l2)}`, `x, y = ${num(st.x)}, ${num(st.y)}   # the TCP`,
  "c2 = (x**2 + y**2 - l1**2 - l2**2) / (2*l1*l2)   # ch. 5, p. 17: needs -1 <= c2 <= 1",
  "sols = []", "for sign in (1, -1):   # the two elbows", "    t2 = np.arctan2(sign*np.sqrt(1 - c2**2), c2)",
  "    t1 = np.arctan2(y, x) - np.arctan2(l2*np.sin(t2), l1 + l2*np.cos(t2))", "    sols.append(np.rad2deg([t1, t2]))"].join("\n");
const ML_IK = st => [`l1 = ${num(st.l1)}; l2 = ${num(st.l2)};`, `x = ${num(st.x)}; y = ${num(st.y)};   % the TCP`,
  "c2 = (x^2 + y^2 - l1^2 - l2^2)/(2*l1*l2);   % ch. 5, p. 17: needs -1 <= c2 <= 1",
  "t2 = atan2([1; -1]*sqrt(1 - c2^2), c2);   % both elbows", "t1 = atan2(y,x) - atan2(l2*sin(t2), l1 + l2*cos(t2));",
  "rad2deg([t1 t2])   % one row per solution"].join("\n");
// A flange pose for step 3: the tool pointing straight down (flange z = −z0), at a reachable spot in front of the robot.
const down = (x, y, z) => [[-1, 0, 0, x], [0, 1, 0, y], [0, 0, -1, z], [0, 0, 0, 1]];

export default {
  id: "iksteps",
  art: () => a.picture("A two-link arm reaching one point two ways, beside a six-axis arm whose wrist centre is marked",
    a.line([[20, 120], [45, 60], [100, 75]], a.INK, 3) + a.line([[20, 120], [85, 125], [100, 75]], a.COOL, 3, "6 4") + a.circle(100, 75, 5, a.ACC, 3, a.ACC)
    + a.line([[140, 130], [140, 80], [180, 70]], a.INK, 4) + a.circle(180, 70, 6, a.ACC, 2)),
  mount(root) {
    const st = { l1: 5, l2: 4, x: 6, y: 5.93, l3: 2, phi: rad(0), X: 350, Y: 100, Z: 250 };
    const ui = { refresh: () => {} };
    const S = (lab, key, v, lo, hi, step) => lengthSlider(lab, "", v, lo, hi, step, x => { st[key] = x; ui.refresh(); }).el;
    const controls = [S("TCP x", "x", 6, -9, 9, 0.01), S("TCP y", "y", 5.93, -9, 9, 0.01), S("Link l1", "l1", 5, 1, 6, 0.1), S("Link l2", "l2", 4, 1, 6, 0.1),
      S("Link l3 (step 2)", "l3", 2, 0.5, 4, 0.1), angleSlider("Tool angle φ (step 2)", 0, -180, 180, v => { st.phi = v; ui.refresh(); }).el,
      lengthSlider("Flange X (step 3)", "mm", 350, 150, 500, 1, v => { st.X = v; ui.refresh(); }).el,
      lengthSlider("Flange Y (step 3)", "mm", 100, -300, 300, 1, v => { st.Y = v; ui.refresh(); }).el,
      lengthSlider("Flange Z (step 3)", "mm", 250, 50, 600, 1, v => { st.Z = v; ui.refresh(); }).el];
    const steps = [
      { name: "Two-link arm: both elbows", draw: p => {
        const s = ik2r(st.l1, st.l2, st.x, st.y), R = st.l1 + st.l2;
        const arms = s.solutions.map((x, k) => { const q = planar2r(st.l1, st.l2, x.t1 * p, x.t2 * p); return [link([[0, 0], q.elbow, q.tip], k ? "second" : ""), joint(q.elbow, k ? "second" : "")]; });
        const [A, B] = s.solutions;
        const onSlide = Math.abs(st.x - 6) < 1e-9 && Math.abs(st.y - 5.93) < 1e-9 && st.l1 === 5 && st.l2 === 4;
        return {
          figure: view([-R - 1, -R - 1, R + 1, R + 1], s.reachable ? `Both solutions swinging out to the TCP (${st.x}, ${st.y})` : `TCP (${st.x}, ${st.y}) out of reach`, [
            ring([0, 0], R, "grid"), Math.abs(st.l1 - st.l2) > 0 ? ring([0, 0], Math.abs(st.l1 - st.l2), "grid") : null,
            s.reachable ? arms : null, ground([0, 0]), dot([st.x, st.y]), label([st.x, st.y], "TCP", 10, -10)]),
          notes: s.reachable ? [["θ2 > 0", `θ1 = ${f2(A.t1)}, θ2 = ${f2(A.t2)}`], ["θ2 < 0", `θ1 = ${f2(B.t1)}, θ2 = ${f2(B.t2)}`, "", "the elbow on the other side"]]
            : [["Reach", `${fmt(s.reach.r2)} outside ${fmt(s.reach.min)} … ${fmt(s.reach.max)}`, "warn", "(l1 − l2)² ≤ x² + y² ≤ (l1 + l2)², ch. 5, p. 17"]],
          sheet: onSlide ? [{ source: "ch. 5, p. 20", sheet: "θ2 = ±41.05°, θ1 = 44.66° ± 18.14°", lab: `θ2 = ±${fmt(deg(A.t2), 4)}°, θ1 = ${fmt(deg(A.t1), 4)}° or ${fmt(deg(B.t1), 4)}°`,
            agree: same([deg(A.t2), deg(A.t1), deg(B.t1)], [41.05, 44.66 - 18.14, 44.66 + 18.14]) }] : [],
          code: ML_IK(st), python: [PY_IK(st), "print(np.round(sols, 2))"].join("\n"),
          pyCheck: s.reachable ? ["sols", s.solutions.map(x => [deg(x.t1), deg(x.t2)])] : null,
          hint: "The slide's θ1 = atan2(y, x) ± atan2(…) pairs the minus with θ2 > 0. Obstacles and joint ranges pick one (p. 10).",
        };
      } },
      { name: "Three-link arm: back off to the wrist", draw: p => {
        const s = ik3r(st.l1, st.l2, st.l3, st.x, st.y, st.phi), R = st.l1 + st.l2 + st.l3, w = s.wrist;
        const arms = p < 0.4 ? [] : s.solutions.map((x, k) => {
          const q = planar2r(st.l1, st.l2, x.t1, x.t2), cls = k ? "second" : "";
          return [link([[0, 0], q.elbow, w, [st.x, st.y]], cls), joint(q.elbow, cls), joint(w, cls)];
        });
        const back = Math.min(1, p / 0.4);
        return {
          figure: view([-R - 1, -R - 1, R + 1, R + 1], `Three-link arm: the wrist ${fmt(st.l3)} back from the TCP along φ = ${fmt(deg(st.phi))}°`, [
            ring([0, 0], st.l1 + st.l2, "grid"), link([[st.x, st.y], [st.x - back * st.l3 * Math.cos(st.phi), st.y - back * st.l3 * Math.sin(st.phi)]], "faint"),
            arms, ground([0, 0]), dot([st.x, st.y]), dot(w, "second"), label(w, "wrist", 8, 14), label([st.x, st.y], "TCP", 10, -10)]),
          notes: [["Wrist", `(${w.map(v => fmt(v)).join("; ")})`, s.reachable ? "" : "warn", s.reachable ? "TCP − l3 (cos φ, sin φ)" : "the wrist lies outside the two-link arm's ring"],
            ...s.solutions.map(x => [x.sign > 0 ? "θ2 > 0" : "θ2 < 0", `${f2(x.t1)}, ${f2(x.t2)}, θ3 = ${f2(x.t3)}`, "", "θ3 = φ − θ1 − θ2"])],
          code: [`l3 = ${num(st.l3)}; phi = ${num(st.phi)};`, ML_IK({ ...st, x: w[0], y: w[1] }).replace("% the TCP", "% the wrist: TCP - l3*[cos(phi) sin(phi)]"),
            "t3 = phi - t1 - t2;"].join("\n"),
          python: [PY_IK({ ...st, x: w[0], y: w[1] }).replace("# the TCP", "# the wrist: TCP - l3*(cos(phi), sin(phi))"), `phi = ${num(st.phi)}`,
            "sols = [[t1d, t2d, np.rad2deg(phi) - t1d - t2d] for t1d, t2d in sols]   # theta3 = phi - theta1 - theta2"].join("\n"),
          pyCheck: s.reachable ? ["sols", s.solutions.map(x => [deg(x.t1), deg(x.t2), deg(x.t3)])] : null,
          hint: "Worked here: the slides show the RRR arm (ch. 5, p. 4) but solve only the two-link one. Fix the tool's angle and the third link is no longer free.",
        };
      } },
      { name: "IRB 120: wrist centre, then the wrist", draw: p => {
        const T = down(st.X, st.Y, st.Z), s = ikIrb120(T, irb120), P = project(rad(30), rad(25));
        const draw = (q, cls) => { const fr = irb120(q), pts = [[0, 0, 0], ...[1, 2, 3, 4, 6].map(i => posOf(fr[i]))];
          return [link(pts.map(P), cls), pts.slice(1, -1).map(x => joint(P(x), cls))]; };
        const err = s.solutions.map(x => Math.max(...irb120(x.q)[6].flat().map((v, i) => Math.abs(v - T.flat()[i]))));
        const within = x => x.q.every((v, i) => v >= IRB120.limits[i][0] && v <= IRB120.limits[i][1]);
        return {
          figure: view([-650, -200, 650, 950], `IRB 120 reaching the flange (${st.X}, ${st.Y}, ${st.Z}) mm, tool down, ${s.solutions.length} elbow solutions`, [
            link([P([-250, 0, 0]), P([250, 0, 0])], "faint"), ground(P([0, 0, 0])),
            s.solutions.map((x, k) => draw(x.q.map(v => v * p), k ? "second" : "")), dot(P(s.wrist), "second"), label(P(s.wrist), "wrist centre", 10, 14),
            frameAxes(T, 80, P, "")]),
          notes: s.reachable ? s.solutions.map((x, k) => [x.sign > 0 ? "Elbow a" : "Elbow b", x.q.map(v => `${fmt(deg(v), 4)}°`).join(", "),
            within(x) ? "" : "warn", `${within(x) ? "inside" : "outside"} the axis ranges of ABB p. 32; round trip error ${err[k].toExponential(1)} mm${x.wristSingular ? "; axis 5 at 0°: wrist singular" : ""}`])
            : [["Reach", "the wrist centre is out of reach", "warn"]],
          code: [matlabTree(IRB120.rows.map(r => ({ a: r.a, alpha: r.alpha, d: r.d, theta: 0 }))),
            `T = [${T.map(r => r.map(num).join(" ")).join("; ")}];   % flange pose, tool down`,
            "w = T(1:3,4) - 72*T(1:3,3);   % the wrist centre, 72 mm back along the flange's z (ABB p. 12)",
            "q1 = atan2(w(2), w(1))",
            "ik = inverseKinematics('RigidBodyTree',robot);",
            "weights = [1 1 1 1 1 1];   % orientation first, then position",
            "[qSol,info] = ik('body6',T,weights,homeConfiguration(robot));",
            "qSol(2) = qSol(2) + pi/2;   % back to the ABB zero of axis 2"].join("\n"),
          python: [PY_HEAD, `T = ${pyMat(T)}   # flange pose, tool down`, "w = T[:3, 3] - 72*T[:3, 2]   # the wrist centre (ABB p. 12)",
            "q1 = np.arctan2(w[1], w[0])", "u, v = np.hypot(w[0], w[1]), w[2] - 290   # in the arm's plane, from the shoulder",
            "a2, a3 = 270, np.hypot(70, 302)   # upper arm and forearm to the wrist", "c = (u**2 + v**2 - a2**2 - a3**2) / (2*a2*a3)",
            "b = np.arctan2(np.sqrt(1 - c**2), c)   # one elbow", "g = np.arctan2(v, u) - np.arctan2(a3*np.sin(b), a2 + a3*np.cos(b))",
            "q2 = pi/2 - g", "q3 = np.arctan2(70, 302) - pi/2 - b", "wc = np.array([q1, q2, q3])"].join("\n"),
          pyCheck: s.reachable ? ["wc", s.solutions[0].q.slice(0, 3)] : null,
          hint: "Worked here for this lab's DH table: axes 4–6 meet at the wrist centre (ch. 5, p. 6), so its place depends on axes 1–3 only. MATLAB's inverseKinematics solves numerically and returns one solution near its start.",
        };
      } },
    ];
    const { steps: s2, panel } = twin(steps);
    Object.assign(ui, stepper(root, s2, { controls }));
    root.append(panel);
  },
};
