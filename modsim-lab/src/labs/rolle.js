// VO example 3, the Pendel mit Rolle (pp. 19–24): the spring's length S(φ1) from the geometry, the kinetic energy of rod
// and rolling disc term by term, the motion by the lab's equation beside the sheet's printed one, and the Simulink model
// of p. 24.
import { s } from "../../../kit/ui/kit.js";
import * as a from "../../../kit/ui/art.js";
import { stepper, fmt, grow } from "../../../kit/ui/steps.js";
import { rolle, rolleRest, springS, run, VALUES } from "../core/index.js";
import { linkage, blocks, blockCount } from "./pics.js";
import { reveal, memo, sliders, caption, at, deg } from "./view.js";
import { lagrange, ode, simulink, assign } from "./matlab.js";

const runs = memo(v => ({ lab: run(rolle(v), [0, 0], 4, 2000), sheet: run(rolle({ ...v, variant: "sheet" }), [0, 0], 4, 2000) }));
const SCALE = 380; // px per metre
/** The rod from O at φ1 below the x-axis, the disc at its end, and the spring from the anchor (L1, −L2) to the disc. */
function drawing(v, phi, ghost = null, label = "The rod hinged at O, the disc at its end, the spring from the fixed anchor to the disc's centre") {
  const O = [110, 110], L = v.L1 * SCALE, anchor = [O[0] + L, O[1] - v.L2 * SCALE];
  const end = p => [O[0] + L * Math.cos(p), O[1] + L * Math.sin(p)];
  const e = end(phi), extra = [s("line", { x1: anchor[0] - 20, y1: anchor[1], x2: anchor[0] + 20, y2: anchor[1], class: "wall" }),
    s("line", { x1: anchor[0], y1: anchor[1], x2: e[0], y2: e[1], class: "rope spring-line" }),
    s("circle", { cx: e[0], cy: e[1], r: Math.max(8, v.r * SCALE), class: "disc" }),
    s("text", { x: anchor[0] + 24, y: anchor[1] + 4, class: "tick" }, "anchor"),
    s("text", { x: (anchor[0] + e[0]) / 2 + 8, y: (anchor[1] + e[1]) / 2, class: "tick" }, `S = ${fmt(springS(phi, v.L1, v.L2).S, 3)} m`)];
  return linkage({ pivot: O, links: [{ angle: Math.PI / 2 - phi, len: L, kind: "rod" }], ghost: ghost === null ? null : [Math.PI / 2 - ghost], extra, label });
}

export default {
  id: "rolle",
  art: () => a.picture("A rod hinged at one end with a disc at the other, a spring pulling the disc up to a fixed point",
    a.line([[30, 50], [150, 90]], a.INK, 4) + a.circle(150, 90, 16, a.ACC, 3) + a.line([[150, 20], [150, 74]], a.HOT, 2, "4 3") + a.circle(30, 50, 4, a.INK, 2, a.INK)),
  mount(root) {
    const st = { ...VALUES.rolle };
    const ui = { refresh: () => {} };
    const controls = sliders(st, [["m1", "Rod mass m₁", 0.2, 3, 0.1, "kg"], ["m2", "Disc mass m₂", 0.1, 3, 0.1, "kg"], ["r", "Disc radius r", 0.02, 0.2, 0.01, "m"],
      ["k", "Spring stiffness k", 0, 600, 10, "N/m"], ["l0", "Relaxed spring length l₀", 0.05, 0.6, 0.01, "m"]], () => ui.refresh());
    const steps = [
      { name: "Geometry: the spring's length S(φ₁)", draw: p => {
        const phi = -0.6 + 1.6 * p, { S, dS } = springS(phi, st.L1, st.L2);
        return {
          figure: [drawing(st, phi), reveal(["anchor at (L₁, −L₂), disc centre at (L₁ cos φ₁, L₁ sin φ₁)",
            "S(φ₁) = √({L₁[1 − cos φ₁]}² + [L₂ + L₁ sin φ₁]²)", "dS/dφ₁ = [L₁²(1 − cos φ₁) sin φ₁ + (L₂ + L₁ sin φ₁) L₁ cos φ₁]/S",
            "for L₁ = 0.5, L₂ = 0.25: dS/dφ₁ = (2 sin φ₁ + cos φ₁)/(8S)"], p)],
          notes: [["φ₁", `${fmt(deg(phi), 3)}°`], ["S, dS/dφ₁", `${fmt(S, 4)} m, ${fmt(dS, 4)} m`]],
          sheet: [{ source: "VO p. 20", sheet: "S(φ₁) = √({L₁[1 − cos φ₁]}² + [0.25 + L₁ sin φ₁]²), cos ψ = (1 − cos φ₁)/(2S)", lab: "the same with L₁ = 0.5, L₂ = 0.25, which the sheet substitutes without naming", agree: true }],
          code: [assign([["L_1", st.L1, "m (VO p. 20)"], ["L_2", st.L2, "m"]]), "syms phi1", "S = sqrt((L_1*(1-cos(phi1)))^2 + (L_2 + L_1*sin(phi1))^2);", "dS = simplify(diff(S,phi1))"].join("\n"),
        };
      } },
      { name: "Lagrange: K of rod and rolling disc", draw: p => ({
        figure: [drawing(st, 0.4 * Math.sin(2 * Math.PI * p)), reveal(["Θ^(O) = m₁L₁²/3 (rod about O), Θ^(S₂) = m₂r²/2 (disc)", "rolling: v_S2 = L₁φ̇₁ = r φ̇₂, so φ̇₂ = (L₁/r) φ̇₁",
          "K = ½[(m₁L₁²/3)φ̇₁² + m₂(L₁φ̇₁)² + (m₂r²/2)(L₁φ̇₁/r)²] = ½(m₁L₁²/3 + (3/2)m₂L₁²) φ̇₁²",
          "V = −m₁g(L₁/2) sin φ₁ − m₂gL₁ sin φ₁ + ½k(S − l₀)²",
          "(m₁L₁²/3 + (3/2)m₂L₁²) φ̈₁ = (m₁/2 + m₂) g L₁ cos φ₁ − k(S − l₀) dS/dφ₁"], p)],
        sheet: [{ source: "VO p. 22", sheet: "K = ½[(m₁L₁²/3)φ̇₁² + m₂(L₁φ̇₁)² + (m₂r²/2)((L₁/r)φ̇₁)²]", lab: "the same", agree: true },
          { source: "VO pp. 21, 23", sheet: "(m₁L₁²/3 + (3/2)m₂ r) φ̈₁ … + k(S − l₀)(2 sin φ₁ + cos φ₁)/(4S) = 0", lab: "(3/2)m₂L₁² (kg·m², not kg·m) and the spring moment twice as large: the lever L₁ is missing", agree: false },
          { source: "VO p. 23", sheet: "L with (m₂r²/3)", lab: "m₂r²/2, as p. 22", agree: false }],
        code: lagrange({ q: ["phi1"], names: ["m_1", "m_2", "r", "L_1", "L_2", "g", "k", "l_0"],
          T: "1/2*(m_1*L_1^2/3*diff(phi1,t)^2 + m_2*(L_1*diff(phi1,t))^2 + m_2*r^2/2*(L_1/r*diff(phi1,t))^2)",
          V: "-m_1*g*L_1/2*sin(phi1) - m_2*g*L_1*sin(phi1) + 1/2*k*(sqrt((L_1*(1-cos(phi1)))^2 + (L_2 + L_1*sin(phi1))^2) - l_0)^2", Q: ["0"] }),
      }) },
      { name: "The motion: the lab's equation and the sheet's", draw: p => {
        const r = runs(st), k = at(r.lab, p), rest = rolleRest(rolle(st));
        return {
          figure: [drawing(st, r.lab.x[k][0], r.sheet.x[k][0], "The rod and disc by the lab's equation; by the sheet's printed one, faint"),
            grow({ p, label: "Angle φ₁ from the horizontal, released at 0", xLabel: "t [s]", yLabel: "φ₁ [°]",
              lines: [{ x: r.lab.t, y: r.lab.x.map(x => deg(x[0])), name: "lab" }, { x: r.sheet.t, y: r.sheet.x.map(x => deg(x[0])), name: "sheet p. 21", cls: "second" }] }),
            caption(`Values: ${VALUES.rolle.source}. No damping: it swings about its rest angle for ever.`)],
          notes: [["Rest angle (lab)", rest === null ? "none in ±90°" : `${fmt(deg(rest), 4)}°`, "", "gravity's moment equals the spring's"],
            ["Inertia", `lab ${fmt(rolle(st).J, 4)}, sheet ${fmt(rolle({ ...st, variant: "sheet" }).J, 4)} kg·m²`]],
          code: ode({ params: [["m_1", st.m1], ["m_2", st.m2], ["r", st.r], ["L_1", st.L1], ["L_2", st.L2], ["g", 9.80665], ["k", st.k], ["l_0", st.l0]],
            rows: ["x(2)", "((m_1/2+m_2)*g*L_1*cos(x(1)) - k*(S(x(1))-l_0)*dS(x(1)))/(m_1*L_1^2/3 + 3/2*m_2*L_1^2)"], x0: [0, 0], T: 4,
            plot: "plot(t,x(:,1)*180/pi)" }).replace("f = @(t,x)", "S = @(p) sqrt((L_1*(1-cos(p))).^2 + (L_2 + L_1*sin(p)).^2);\ndS = @(p) (L_1^2*(1-cos(p)).*sin(p) + (L_2 + L_1*sin(p))*L_1.*cos(p))./S(p);\nf = @(t,x)"),
        };
      } },
      { name: "The Simulink model of p. 24", draw: p => {
        const row = { input: "Constant 0", signs: "+ + + −", gain: "1/J", states: ["φ̈", "φ̇", "φ"], ics: ["0", "0"],
          feedback: [{ from: 2, gain: "Fcn cos u · (m₁/2 + m₂)gL₁" }, { from: 2, gain: "Fcn: k(S(u) − l₀)·dS(u)" }] };
        return {
          figure: blocks([row], { show: Math.ceil(p * blockCount([row])), label: "The Simulink model: the gravity and spring moments as Fcn blocks of φ, summed, times 1/J, integrated twice" }),
          sheet: [{ source: "VO p. 24", sheet: "Gain 1/(m1*L1^2/3+3/2*m2*r); Sum of L0 and S drawn + +; Fcn 2*sin(u)+cos(u) over 4·S", lab: "1/(m1*L1^2/3+3/2*m2*L1^2); S − l₀; L₁(2 sin u + cos u)/(4S)", agree: false }],
          code: simulink({ params: [["m1", st.m1], ["m2", st.m2], ["r", st.r], ["L1", st.L1], ["k", st.k], ["L0", st.l0], ["g", 9.80665]],
            rows: [{ ...row, gain: "1/(m1*L1^2/3+3/2*m2*L1^2)", feedback: [{ from: 2, gain: "Fcn cos(u) -> Gain (m1/2+m2)*g*L1" }, { from: 2, gain: "Fcn k*(sqrt((L1*(1-cos(u)))^2+(0.25+L1*sin(u))^2)-L0)*L1*(2*sin(u)+cos(u))/(4*sqrt((L1*(1-cos(u)))^2+(0.25+L1*sin(u))^2))" }] }] }),
        };
      } },
    ];
    Object.assign(ui, stepper(root, steps, { controls }));
  },
};
