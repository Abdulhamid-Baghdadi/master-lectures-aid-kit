// Task sheet 2 (Pendel mit Federaufhängung) and 3 (Horizontal angeregtes Pendel): a pendulum pinned to a block on a
// spring, worked here with Lagrange's method of the lecture, since the sheet gives a figure only. Task 2 is the one the
// student group modelled; its labs show their values and, beside the lab's result, the slips in their scripts.
import { h } from "../../../kit/ui/kit.js";
import * as a from "../../../kit/ui/art.js";
import { stepper, fmt, mtx, grow } from "../../../kit/ui/steps.js";
import { cartPendulum, run, VALUES } from "../core/index.js";
import { linkage } from "./pics.js";
import { reveal, memo, sliders, caption, at, deg } from "./view.js";
import { lagrange, ode, eigKM, assign } from "./matlab.js";

const NOTE = "No solution sheet; worked here.";

function make(id, dir) {
  const v = dir === "vertical", s = v ? "y" : "x", T = 3;
  const sim = memo(st => run(cartPendulum({ ...st, dir }), [v ? cartPendulum({ ...st, dir }).rest : 0, 0, 0, 0], T, 6000));
  const P = st => [["m_1", st.m1, "kg, rod"], ["m_2", st.m2, "kg, block"], ["m_3", st.m3, "kg, end mass"], ["l_1", st.l1, "m"], ["g", 9.80665],
    ["k", st.k, "N/m"], ["c", st.c, "N*s/m"], ["k_T", st.kT, "N*m/rad"], ["c_T", st.cT, "N*m*s/rad"], ["F_01", st.F01, "N"], ["M_01", st.M01, "N*m"], ["Om", st.Om, "rad/s"]];
  const T_ = v ? "1/2*(m_1+m_2+m_3)*diff(y,t)^2 - (m_1/2+m_3)*l_1*diff(y,t)*diff(theta,t)*sin(theta) + 1/2*l_1^2*(m_1/3+m_3)*diff(theta,t)^2"
    : "1/2*(m_1+m_2+m_3)*diff(x,t)^2 + (m_1/2+m_3)*l_1*diff(x,t)*diff(theta,t)*cos(theta) + 1/2*l_1^2*(m_1/3+m_3)*diff(theta,t)^2";
  const V_ = v ? "-(m_1+m_2+m_3)*g*y - (m_1/2+m_3)*g*l_1*cos(theta) + 1/2*k*y^2 + 1/2*k_T*theta^2"
    : "-(m_1/2+m_3)*g*l_1*cos(theta) + 1/2*k*x^2 + 1/2*k_T*theta^2";
  const rows = v ? ["x(3)", "x(4)", "Ms(x) \\ [F_01*cos(Om*t) + mg*g - k*x(1) - c*x(3) + ms*l_1*x(4)^2*cos(x(2)); M_01*cos(Om*t) - ms*g*l_1*sin(x(2)) - k_T*x(2) - c_T*x(4)]"]
    : ["x(3)", "x(4)", "Ms(x) \\ [F_01*cos(Om*t) - k*x(1) - c*x(3) + ms*l_1*x(4)^2*sin(x(2)); M_01*cos(Om*t) - ms*g*l_1*sin(x(2)) - k_T*x(2) - c_T*x(4)]"];
  const Ms = v ? "Ms = @(x) [mg -ms*l_1*sin(x(2)); -ms*l_1*sin(x(2)) I];" : "Ms = @(x) [mg ms*l_1*cos(x(2)); ms*l_1*cos(x(2)) I];";
  const figure = (px, th, label) => linkage({ links: [{ angle: th, len: 120, kind: "rod", bob: 11 }], base: v ? [0, 70 + px] : [px, 20],
    block: "m₂", guide: dir, label, pivot: v ? [260, 20] : [260, 60] });
  return {
    id,
    art: () => v ? a.picture("A block hanging from a spring and damper between two guides, a pendulum rod hanging from the block",
      a.line([[70, 10], [70, 140]], a.DIM, 2) + a.line([[130, 10], [130, 140]], a.DIM, 2) + a.path("M100 10 l0 8 l-8 4 l16 6 l-16 6 l16 6 l-8 4 l0 8", a.INK, 2)
      + a.rect(78, 52, 44, 26, a.INK, 3) + a.line([[100, 65], [130, 125]], a.INK, 4) + a.circle(130, 128, 8, a.ACC, 3, a.ACC))
      : a.picture("A block on the floor tied to a wall by a spring and damper, a pendulum hanging from it",
        a.line([[14, 20], [14, 90]], a.INK, 3) + a.path("M14 50 l10 0 l5 -8 l7 16 l7 -16 l7 16 l5 -8 l10 0", a.INK, 2) + a.rect(70, 36, 50, 28, a.INK, 3)
        + a.line([[10, 64], [190, 64]], a.DIM, 2) + a.line([[95, 50], [125, 125]], a.INK, 4) + a.circle(126, 128, 8, a.ACC, 3, a.ACC) + a.arrow(122, 40, 165, 40, a.HOT, 3)),
    mount(root) {
      const st = { ...VALUES[id] };
      const ui = { refresh: () => {} };
      const controls = sliders(st, [["k", "Spring k", 1, 2000, 1, "N/m"], ["kT", "Torsion spring k_T", 0, 60, 0.1, "N·m/rad"], ["l1", "Rod length l₁", 0.05, 0.5, 0.01, "m"],
        ["F01", "Force amplitude F₀₁", 0, 10, 0.1, "N"], ["M01", "Moment amplitude M₀₁", 0, 40, 0.5, "N·m"], ["Om", "Excitation Ω", 1, 100, 1, "rad/s"]], () => ui.refresh());
      const steps = [
        { name: `Coordinates ${s}, θ and T, V term by term`, draw: p => ({
          figure: [figure(0, 0.5 * Math.sin(2 * Math.PI * p), `The block m₂ on its spring, the rod m₁ with end mass m₃ at angle θ from the vertical`),
            reveal([v ? "rod centre: (l₁/2 sin θ, y + l₁/2 cos θ), end mass: (l₁ sin θ, y + l₁ cos θ), y down" : "rod centre: (x + l₁/2 sin θ, l₁/2 cos θ), end mass: (x + l₁ sin θ, l₁ cos θ)",
              v ? "T = ½m_ges ẏ² − m_s l₁ ẏ θ̇ sin θ + ½I θ̇²" : "T = ½m_ges ẋ² + m_s l₁ ẋ θ̇ cos θ + ½I θ̇²",
              "m_ges = m₁ + m₂ + m₃, m_s = m₁/2 + m₃, I = l₁²(m₁/3 + m₃)",
              v ? "V = −m_ges g y − m_s g l₁ cos θ + ½k y² + ½k_T θ²" : "V = −m_s g l₁ cos θ + ½k x² + ½k_T θ²",
              `D = ½c ${s}̇² + ½c_T θ̇²,  Q = (F₁, M₁)`,
              v ? "m_ges ÿ − m_s l₁(θ̈ sin θ + θ̇² cos θ) + c ẏ + k y − m_ges g = F₁" : "m_ges ẍ + m_s l₁(θ̈ cos θ − θ̇² sin θ) + c ẋ + k x = F₁",
              v ? "I θ̈ − m_s l₁ ÿ sin θ + m_s g l₁ sin θ + c_T θ̇ + k_T θ = M₁" : "I θ̈ + m_s l₁ ẍ cos θ + m_s g l₁ sin θ + c_T θ̇ + k_T θ = M₁"], p)],
          notes: [["Source", NOTE, "", "the task sheet (p. " + (v ? "1" : "2") + ") gives the figure only; coordinates, symbols k, c, k_T, c_T chosen here"]],
          sheet: v ? [{ source: "group report eq. 38, 42 (pp. 6–7)", sheet: "the same two equations", lab: "the same", agree: true },
            { source: "group's Jacobian.mlx", sheet: "ÿ with −m_s l₁(ẏ² cos φ − φ̈ sin φ)", lab: "+m_s l₁(θ̇² cos θ + θ̈ sin θ): θ̇, not ẏ, and the sign", agree: false }] : [],
          code: lagrange({ q: [s, "theta"], names: ["m_1", "m_2", "m_3", "l_1", "g", "k", "c", "k_T", "c_T", "F_1", "M_1"], T: T_, V: V_,
            D: `1/2*c*diff(${s},t)^2 + 1/2*c_T*diff(theta,t)^2`, Q: ["F_1", "M_1"] }),
        }) },
        { name: "The motion under F₁ and M₁", draw: p => {
          const m = cartPendulum({ ...st, dir }), r = sim(st), k = at(r, p), off = v ? m.rest : 0;
          const sc = 50 / Math.max(1e-6, ...r.x.map(x => Math.abs(x[0] - off)));
          return {
            figure: [figure(sc * (r.x[k][0] - off), r.x[k][1], `The block and pendulum driven by F₁ = F₀₁ cos Ωt and M₁ = M₀₁ cos Ωt; the block's travel scaled to fit`),
              grow({ p, label: `Block ${s} and angle θ`, xLabel: "t [s]", yLabel: `${s} − ${s}* [mm], θ [°]`,
                lines: [{ x: r.t, y: r.x.map(x => 1000 * (x[0] - off)), name: `${s} [mm]` }, { x: r.t, y: r.x.map(x => deg(x[1])), name: "θ [°]", cls: "second" }] }),
              caption(`Values: ${VALUES[id].source}. ${NOTE}`)],
            notes: [[v ? "Rest y* = m_ges g/k" : "Rest", v ? `${fmt(1000 * m.rest)} mm` : "x = 0, θ = 0"]],
            code: [assign(P(st)), "mg = m_1+m_2+m_3; ms = m_1/2+m_3; I = l_1^2*(m_1/3+m_3);", Ms,
              ode({ params: [], rows, x0: [v ? m.rest : 0, 0, 0, 0], T, plot: `plot(t,x(:,1), t,x(:,2))   % ${s} and theta` }).replace(/^\n/, "")].join("\n"),
          };
        } },
        { name: "Linearise: M, K and the eigenfrequencies", draw: p => {
          const m = cartPendulum({ ...st, dir }), j = p < 0.5 ? 0 : 1, md = m.modes[j], ph = Math.sin(2 * Math.PI * 3 * ((p % 0.5) * 2));
          const amp = md.v.map(c => c / Math.max(...md.v.map(Math.abs)));
          return {
            figure: [figure(40 * amp[0] * ph, 0.4 * amp[1] * ph, `Eigenmode ${j + 1} of the linear model`),
              h("div", { class: "mtx-row" }, mtx("M", m.Ml), mtx("K", m.Kl))],
            notes: m.modes.map((q, i) => [`Mode ${i + 1}`, `f = ${fmt(q.f)} Hz`, "", `shape θ/${s} = ${fmt(q.v[1])} rad/m`]),
            sheet: v ? [{ source: "group report p. 8", sheet: "rest at y = m_ges g/k, θ = 0", lab: `y* = ${fmt(1000 * m.rest)} mm`, agree: true },
              { source: "group report p. 9", sheet: "linearised at y = 0, keeping θ̈·θ and ÿ·θ", lab: "at y* = m_ges g/k; products of small terms dropped: M constant, K diagonal", agree: false }] : [],
            code: eigKM({ params: P(st).slice(0, 8), K: "[k 0; 0 (m_1/2+m_3)*g*l_1+k_T]", M: v ? "[m_1+m_2+m_3 0; 0 l_1^2*(m_1/3+m_3)]" : "[m_1+m_2+m_3 (m_1/2+m_3)*l_1; (m_1/2+m_3)*l_1 l_1^2*(m_1/3+m_3)]" }),
            hint: v ? "Hanging, the coupling term vanishes at θ = 0: block and pendulum swing apart." : "On the floor the block and the pendulum stay coupled through m_s l₁ in M.",
          };
        } },
      ];
      Object.assign(ui, stepper(root, steps, { controls }));
    },
  };
}

export const task2 = make("task2", "vertical");
export const task3 = make("task3", "horizontal");
