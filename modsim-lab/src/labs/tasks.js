// Task sheet 1, 4, 8, 9–12 and 13 (added 10 Nov 2026), each a spec for sheet.js. The sheet gives a figure only
// (docs/sources/task-sheet.md), so each spec states the reading it takes — the degrees of freedom, where a spring
// holds — and why, and every number is an example value. The models are the core's; task 13 is the double pendulum's
// core (manipulator), tasks 11 and 12 task 3's (cartPendulum), tasks 4, 9 and 10 tasks 5–7's (chain2).
import * as a from "../../../kit/ui/art.js";
import { g, elasticPendulum, unbalance, coupledPendulum, rollingDiscs, rollerPendulum, manipulator, VALUES } from "../core/index.js";
import { elasticFig, unbalanceFig, coupledFig, discsFig, linkage } from "./pics.js";
import { sheetLab, EXAMPLE } from "./sheet.js";

const DEG = 180 / Math.PI;
const zig = d => a.path(d, a.INK, 2);

// ---- Task 1: Elastisches Pendel
const J1 = st => st.hinged ? 0 : st.m1 * (0.1 ** 2 + 0.06 ** 2) / 12;
const e1 = st => elasticPendulum({ ...st, J1: J1(st) });
const p1 = st => [["m_1", st.m1, "kg"], ["J_1", J1(st), st.hinged ? "kg*m^2: block hinged, its turn drops out" : "kg*m^2, block 0.10 m x 0.06 m about its centre"], ["l_0", st.l0, "m, unstretched"],
  ["g", g], ["k", st.k, "N/m"], ["c", st.c, "N*s/m"], ["k_T", st.kT, "N*m/rad"], ["c_T", st.cT, "N*m*s/rad"], ["M_01", st.M01, "N*m"], ["Om", st.Om, "rad/s"]];
export const task1 = sheetLab({
  id: "task1", page: 1, values: VALUES.task1, model: e1, q: ["r", "phi"], qNames: ["r", "φ"],
  art: () => a.picture("A block hanging from a pivot on a spring and damper in line, swinging and bouncing at once",
    a.line([[60, 14], [140, 14]], a.INK, 3) + zig("M100 14 l0 8 l8 4 l-16 6 l16 6 l-16 6 l16 6 l-8 4 l0 30") + a.rect(80, 92, 44, 28, a.ACC, 3) + a.path("M86 30 a20 20 0 0 0 28 0", a.HOT, 2)),
  dof: ["2: r and φ", "the block looks rigidly fixed to the rod's end, so it turns with φ; read as hinged at its centre (the slider) it adds an angle nothing drives, and J₁ drops out of φ's equation"],
  assume: [["J₁ = m₁(a² + b²)/12", `a 0.10 m × 0.06 m block, ${EXAMPLE}`], ["Spring and damper massless, in line", "the rod stays straight; r runs from the pivot to the block's centre"],
    ["Torsion spring k_T, damper c_T at the pivot", "the grey symbol at the pivot read so"]],
  lines: ["Read: the block sits rigidly on the spring–damper rod and turns with it: r and φ", "block centre: (r sin φ, −r cos φ), r = l₀ + stretch",
    "T = ½m₁(ṙ² + r²φ̇²) + ½J₁φ̇²", "V = −m₁g r cos φ + ½k(r − l₀)² + ½k_T φ²", "D = ½c ṙ² + ½c_T φ̇²,  Q = (0, M₁)",
    "m₁r̈ − m₁rφ̇² − m₁g cos φ + k(r − l₀) + c ṙ = 0", "(m₁r² + J₁)φ̈ + 2m₁rṙφ̇ + m₁g r sin φ + k_T φ + c_T φ̇ = M₁"],
  names: ["m_1", "J_1", "l_0", "g", "k", "c", "k_T", "c_T", "M_1"],
  Tq: "1/2*m_1*(diff(r,t)^2 + r^2*diff(phi,t)^2) + 1/2*J_1*diff(phi,t)^2", Vq: "-m_1*g*r*cos(phi) + 1/2*k*(r-l_0)^2 + 1/2*k_T*phi^2",
  Dq: "1/2*c*diff(r,t)^2 + 1/2*c_T*diff(phi,t)^2", Qq: ["0", "M_1"],
  symValues: st => ({ m_1: st.m1, J_1: J1(st), l_0: st.l0, g, k: st.k, c: st.c, k_T: st.kT, c_T: st.cT, M_1: st.M01 }),
  testState: () => [0.58, 0.4, -0.2, 0.5],
  params: p1, Ms: "[m_1 0; 0 m_1*x(1)^2+J_1]",
  rhs: ["m_1*x(1)*x(4)^2 + m_1*g*cos(x(2)) - k*(x(1)-l_0) - c*x(3)", "M_01*cos(Om*t) - 2*m_1*x(1)*x(3)*x(4) - m_1*g*x(1)*sin(x(2)) - k_T*x(2) - c_T*x(4)"],
  x0: st => [e1(st).rest + st.r0, st.phi0, 0, 0], T: 8, rest: (st, m) => [m.rest, 0],
  figure: (st, [r, phi], t, label) => elasticFig({ r: 300 * r, phi, label }),
  figLabel: "The block m₁ on its spring and damper at distance r from the pivot, swung by φ", runLabel: "The elastic pendulum moving: it bounces along the rod and swings at once",
  show: [[1000, "r − r* [mm]"], [DEG, "φ [°]"]], wiggle: [0.03, 0.4], modeW: [1 / 0.05, 1 / 0.4],
  energyNote: "with c = c_T = 0 and M₀₁ = 0, K + V stays: a check on the equations and the integrator",
  linParams: st => [...p1(st).slice(0, 8), ["r_s", "l_0 + m_1*g/k", "m, rest length r*"]], K: "[k 0; 0 m_1*g*r_s+k_T]", M: "[m_1 0; 0 m_1*r_s^2+J_1]",
  linHint: "At rest (r* = l₀ + m₁g/k, φ = 0) the equations part: the spring bounces at √(k/m₁), the pendulum swings at √((m₁g r* + k_T)/(m₁r*² + J₁)). Near a 2 : 1 ratio the nonlinear run passes energy between them.",
  sliders: [["k", "Spring k", 20, 1000, 5, "N/m"], ["l0", "Unstretched length l₀", 0.2, 0.8, 0.01, "m"], ["m1", "Block mass m₁", 0.2, 3, 0.1, "kg"],
    ["kT", "Torsion spring k_T", 0, 20, 0.1, "N·m/rad"], ["M01", "Moment amplitude M₀₁", 0, 3, 0.05, "N·m"], ["Om", "Excitation Ω₁", 0.5, 20, 0.1, "rad/s"],
    ["r0", "Start stretch r(0) − r*", -0.1, 0.1, 0.005, "m"], ["phi0", "Start angle φ(0)", -1.5, 1.5, 0.05, "rad"],
    ["hinged", "Block fixed (0) or hinged at its centre (1)", 0, 1, 1, "", "the other reading of the figure: hinged, the block keeps its own turn and J₁ leaves φ's equation"]],
});

// ---- Task 4: Unwucht erregter Schwinger
const p4 = st => [["m_1", st.m1, "kg"], ["m_2", st.m2, "kg"], ["m_3", st.m3, "kg, rod"], ["m_4", st.m4, "kg, unbalance"], ["l_3", st.l3, "m"],
  ["k_1", st.k1, "N/m"], ["k_2", st.k2, "N/m"], ["c_1", st.c1, "N*s/m"], ["c_2", st.c2, "N*s/m"], ["Om", st.Om, "rad/s, drive speed"]];
export const task4 = sheetLab({
  id: "task4", page: 2, values: VALUES.task4, model: unbalance, q: ["y1", "y2"], qNames: ["y₁", "y₂"],
  art: () => a.picture("Two blocks stacked on springs in a vertical guide, a rod with a mass turning on the lower block",
    a.line([[50, 10], [50, 140]], a.DIM, 2) + a.line([[150, 10], [150, 140]], a.DIM, 2) + zig("M100 140 l0 -6 l-8 -4 l16 -6 l-16 -6 l8 -4 l0 -6") + a.rect(70, 88, 60, 20, a.INK, 3)
    + zig("M100 88 l0 -6 l-8 -4 l16 -6 l-16 -6 l8 -4 l0 -6") + a.rect(76, 36, 48, 20, a.INK, 3) + a.line([[100, 98], [124, 116]], a.ACC, 3) + a.circle(126, 118, 6, a.ACC, 3, a.ACC)),
  dof: ["2: y₁ and y₂", "Ω(t) is read as a prescribed speed (drawn blue like the path excitations of tasks 5–7), so the rod's angle β = Ωt is given; read as a torque, β would be a third degree of freedom"],
  assume: [["Constant drive speed Ω", "Ω(t) = Ω; the drive supplies whatever torque that takes"], ["Rod uniform, m₄ a point mass", EXAMPLE],
    ["y₁, y₂ upward from the static rest", "the weights cancel the springs' preload, so g drops out"]],
  lines: ["Read: β = Ωt is driven, the guide holds m₁, m₂ vertical: y₁ and y₂", "rod centre: (½l₃ sin β, y₁ − ½l₃ cos β), m₄: (l₃ sin β, y₁ − l₃ cos β)",
    "T = ½(m₁+m₃+m₄)ẏ₁² + (m₃/2 + m₄)l₃Ω ẏ₁ sin Ωt + ½m₂ẏ₂² + (terms without y)", "V = ½k₁y₁² + ½k₂(y₂ − y₁)²,  D = ½c₁ẏ₁² + ½c₂(ẏ₂ − ẏ₁)²",
    "(m₁+m₃+m₄)ÿ₁ + c₁ẏ₁ + k₁y₁ − c₂(ẏ₂−ẏ₁) − k₂(y₂−y₁) = −(m₃/2 + m₄)l₃Ω² cos Ωt", "m₂ÿ₂ + c₂(ẏ₂ − ẏ₁) + k₂(y₂ − y₁) = 0"],
  names: ["m_1", "m_2", "m_3", "m_4", "l_3", "k_1", "k_2", "c_1", "c_2", "Om"],
  Tq: "1/2*m_1*diff(y1,t)^2 + 1/2*m_2*diff(y2,t)^2 + 1/2*m_3*((diff(y1,t) + l_3/2*Om*sin(Om*t))^2 + (l_3/2*Om*cos(Om*t))^2) + 1/2*m_3*l_3^2*(1/12)*Om^2 + 1/2*m_4*((diff(y1,t) + l_3*Om*sin(Om*t))^2 + (l_3*Om*cos(Om*t))^2)",
  Vq: "1/2*k_1*y1^2 + 1/2*k_2*(y2-y1)^2", Dq: "1/2*c_1*diff(y1,t)^2 + 1/2*c_2*(diff(y2,t)-diff(y1,t))^2", Qq: ["0", "0"],
  symValues: st => ({ m_1: st.m1, m_2: st.m2, m_3: st.m3, m_4: st.m4, l_3: st.l3, k_1: st.k1, k_2: st.k2, c_1: st.c1, c_2: st.c2, Om: st.Om, t: 0 }),
  testState: () => [0.001, -0.002, 0.05, -0.03],
  params: p4, Ms: "[m_1+m_3+m_4 0; 0 m_2]",
  rhs: ["-(m_3/2+m_4)*l_3*Om^2*cos(Om*t) - c_1*x(3) - k_1*x(1) + c_2*(x(4)-x(3)) + k_2*(x(2)-x(1))", "-c_2*(x(4)-x(3)) - k_2*(x(2)-x(1))"],
  x0: () => [0, 0, 0, 0], T: 2, rest: () => [0, 0],
  figure: (st, [y1, y2], t, label) => unbalanceFig({ y1, y2, beta: st.Om * t, scale: 4000, label }),
  figLabel: "The two blocks in their guide, the unbalance rod on m₁", runLabel: "The unbalance turning at Ω shakes m₁, and m₂ follows; travel scaled ×4 to show",
  show: [[1000, "y₁ [mm]"], [1000, "y₂ [mm]"]], wiggle: [0.004, 0.008], modeW: [100, 100],
  energyNote: "not kept even undamped: the drive feeds energy in through the unbalance force (models test: ΔE = ∫F ẏ₁ dt)",
  linName: "Eigenfrequencies (the model is linear)", linParams: st => p4(st).slice(0, 7), K: "[k_1+k_2 -k_2; -k_2 k_2]", M: "[m_1+m_3+m_4 0; 0 m_2]",
  linHint: "The unbalance force grows with Ω²: set Ω near a mode's ω and the masses answer hardest.",
  sliders: [["m1", "Mass m₁", 0.5, 6, 0.1, "kg"], ["m2", "Mass m₂", 0.2, 4, 0.1, "kg"], ["m4", "Unbalance mass m₄", 0, 0.5, 0.01, "kg"], ["l3", "Rod length l₃", 0.02, 0.3, 0.01, "m"],
    ["k1", "Spring k₁", 200, 6000, 50, "N/m"], ["k2", "Spring k₂", 100, 3000, 25, "N/m"], ["Om", "Drive speed Ω", 1, 100, 1, "rad/s"]],
});

// ---- Task 8: Koppelpendel
const S8 = "sqrt((b + l_2*sin(phi2) - l_1*sin(phi1))^2 + (l_1*cos(phi1) - l_2*cos(phi2))^2)";
const p8 = st => [["m_1", st.m1, "kg, each of rod 1's two segments"], ["l_1", st.l1, "m, each segment"], ["m_2", st.m2, "kg"], ["l_2", st.l2, "m"], ["m_3", st.m3, "kg"], ["m_4", st.m4, "kg"],
  ["b", st.b, "m, pivot distance = spring length at rest"], ["g", g], ["k", st.k, "N/m"], ["c", st.c, "N*s/m"], ["k_T", st.kT, "N*m/rad"], ["c_T", st.cT, "N*m*s/rad"],
  ["M_01", st.M01, "N*m"], ["M_02", st.M02, "N*m"], ["Om_1", st.Om1, "rad/s"], ["Om_2", st.Om2, "rad/s"]];
export const task8 = sheetLab({
  id: "task8", page: 4, values: VALUES.task8, model: coupledPendulum, q: ["phi1", "phi2"], qNames: ["φ₁", "φ₂"],
  art: () => a.picture("Two pendulums side by side joined halfway down by a spring and damper",
    a.line([[40, 14], [160, 14]], a.INK, 3) + a.line([[70, 14], [62, 120]], a.INK, 4) + a.line([[130, 14], [138, 120]], a.INK, 4) + zig("M66 66 l8 0 l4 -6 l6 12 l6 -12 l6 12 l6 -12 l6 12 l4 -6 l8 0")
    + a.circle(62, 124, 9, a.ACC, 3, a.ACC) + a.circle(138, 124, 9, a.ACC, 3, a.ACC)),
  dof: ["2: φ₁ and φ₂", "two rods on fixed pivots; the spring–damper adds no coordinate"],
  assume: [["Each rod = two segments mᵢ, lᵢ", "the sheet labels each rod twice (m₁, l₁ above and below the coupling point): read as the coupling point splitting it, so rod i is 2mᵢ, 2lᵢ and the spring holds at lᵢ"],
    ["Pivots b apart, spring unstretched at rest", `b = the spring's length at rest, ${EXAMPLE}`], ["Spring length exact", "not linearised: it tilts and stretches as the rods swing"],
    ["Torsion k_T, c_T at both pivots", "the grey symbols read so"]],
  lines: ["Read: rod i is two segments mᵢ, lᵢ, the spring–damper at lᵢ: φ₁ and φ₂", "J₁ = (2m₁)(2l₁)²/3 + m₃(2l₁)² = (8/3)m₁l₁² + 4m₃l₁²  (J₂ alike)",
    "T = ½J₁φ̇₁² + ½J₂φ̇₂²", "V = −2g l₁(m₁ + m₃) cos φ₁ − 2g l₂(m₂ + m₄) cos φ₂ + ½k(S − b)² + ½k_T(φ₁² + φ₂²)",
    "S = √[(b + l₂ sin φ₂ − l₁ sin φ₁)² + (l₁ cos φ₁ − l₂ cos φ₂)²],  D = ½c Ṡ² + ½c_T(φ̇₁² + φ̇₂²)",
    "J₁φ̈₁ + 2g l₁(m₁+m₃) sin φ₁ + k_T φ₁ + c_T φ̇₁ + [k(S − b) + cṠ] ∂S/∂φ₁ = M₁", "J₂φ̈₂ + 2g l₂(m₂+m₄) sin φ₂ + k_T φ₂ + c_T φ̇₂ + [k(S − b) + cṠ] ∂S/∂φ₂ = M₂"],
  names: ["m_1", "l_1", "m_2", "l_2", "m_3", "m_4", "b", "g", "k", "c", "k_T", "c_T", "M_1", "M_2"],
  Tq: "1/2*(8/3*m_1*l_1^2 + 4*m_3*l_1^2)*diff(phi1,t)^2 + 1/2*(8/3*m_2*l_2^2 + 4*m_4*l_2^2)*diff(phi2,t)^2",
  Vq: `-2*g*l_1*(m_1+m_3)*cos(phi1) - 2*g*l_2*(m_2+m_4)*cos(phi2) + 1/2*k*(${S8} - b)^2 + 1/2*k_T*(phi1^2 + phi2^2)`,
  Dq: `1/2*c*diff(${S8},t)^2 + 1/2*c_T*(diff(phi1,t)^2 + diff(phi2,t)^2)`, Qq: ["M_1", "M_2"], simplify: false,
  symValues: st => ({ m_1: st.m1, l_1: st.l1, m_2: st.m2, l_2: st.l2, m_3: st.m3, m_4: st.m4, b: st.b, g, k: st.k, c: st.c, k_T: st.kT, c_T: st.cT, M_1: st.M01, M_2: st.M02 }),
  testState: () => [0.3, -0.2, 0.4, 0.1],
  params: p8, pre: ["J_1 = 8/3*m_1*l_1^2 + 4*m_3*l_1^2", "J_2 = 8/3*m_2*l_2^2 + 4*m_4*l_2^2", "G_1 = 2*g*l_1*(m_1+m_3)", "G_2 = 2*g*l_2*(m_2+m_4)",
    "dx = @(x) b + l_2*sin(x(2)) - l_1*sin(x(1))", "dy = @(x) l_1*cos(x(1)) - l_2*cos(x(2))", "S = @(x) sqrt(dx(x)^2 + dy(x)^2)",
    "dS1 = @(x) -l_1*(dx(x)*cos(x(1)) + dy(x)*sin(x(1)))/S(x)", "dS2 = @(x) l_2*(dx(x)*cos(x(2)) + dy(x)*sin(x(2)))/S(x)",
    "Fs = @(x) -k*(S(x)-b) - c*(dS1(x)*x(3) + dS2(x)*x(4))"],
  Ms: "[J_1 0; 0 J_2]",
  rhs: ["M_01*cos(Om_1*t) - G_1*sin(x(1)) - k_T*x(1) - c_T*x(3) + Fs(x)*dS1(x)", "M_02*cos(Om_2*t) - G_2*sin(x(2)) - k_T*x(2) - c_T*x(4) + Fs(x)*dS2(x)"],
  x0: st => [st.phi0, 0, 0, 0], T: 12, rest: () => [0, 0],
  figure: (st, [q1, q2], t, label) => coupledFig({ p1: q1, p2: q2, label }),
  figLabel: "Two pendulums, each rod two segments, the spring and damper between their midpoints (drawn not to scale)", runLabel: "Rod 1 started alone: its swing passes to rod 2 and back, a beat",
  show: [[DEG, "φ₁ [°]"], [DEG, "φ₂ [°]"]], wiggle: [0.2, 0.2], modeW: [1 / 0.3, 1 / 0.3],
  energyNote: "with c = c_T = 0 and no moments, K + V stays: a check on the exact spring geometry",
  linParams: st => p8(st).slice(0, 11), K: "[2*g*l_1*(m_1+m_3)+k_T+k*l_1^2 -k*l_1*l_2; -k*l_1*l_2 2*g*l_2*(m_2+m_4)+k_T+k*l_2^2]",
  M: "[8/3*m_1*l_1^2+4*m_3*l_1^2 0; 0 8/3*m_2*l_2^2+4*m_4*l_2^2]",
  linHint: "Equal pendulums: in phase the spring stays slack, ω₁ = √((G + k_T)/J); against each other it adds 2k l₁², ω₂ = √((G + k_T + 2k l₁²)/J). The beat in the run is ω₂ − ω₁.",
  sliders: [["k", "Coupling spring k", 0, 100, 1, "N/m"], ["c", "Coupling damper c", 0, 1, 0.01, "N·s/m"], ["m3", "End mass m₃", 0.05, 2, 0.05, "kg"], ["m4", "End mass m₄", 0.05, 2, 0.05, "kg"],
    ["M01", "Moment amplitude M̂₀₁", 0, 2, 0.05, "N·m"], ["Om1", "Excitation Ω₁", 0.5, 20, 0.1, "rad/s"], ["phi0", "Start angle φ₁(0)", -1, 1, 0.05, "rad"]],
});

// ---- Tasks 9 and 10: 2-Massen-Schwinger mit Rollen
function discs(id, top) {
  const k2s = top ? "4*" : "", x1s = top ? "2*x1" : "x1";
  const p = st => [["m_1", st.m1, "kg"], ["m_2", st.m2, "kg"], ["r_1", st.r1, "m"], ["r_2", st.r2, "m"], ["k_1", st.k1, "N/m"], ["k_2", st.k2, "N/m"],
    ["c_1", st.c1, "N*s/m"], ["c_2", st.c2, "N*s/m"], ["M_01", st.M01, "N*m"], ["F_01", st.F01, "N"], ["Om", st.Om, "rad/s"]];
  return sheetLab({
    id, page: 5, values: VALUES[id], model: rollingDiscs, q: ["x1", "x2"], qNames: ["x₁", "x₂"],
    art: () => a.picture(top ? "Two discs rolling on the floor, the wall spring holding the top of the first disc" : "Two discs rolling on the floor, tied to the wall and to each other at their axles",
      a.line([[14, 20], [14, 130]], a.INK, 3) + a.line([[14, 130], [190, 130]], a.INK, 3) + zig(top ? "M14 76 l10 0 l5 -6 l6 12 l6 -12 l6 12 l5 -6 l12 0" : "M14 104 l10 0 l5 -6 l6 12 l6 -12 l6 12 l5 -6 l12 0")
      + a.circle(80, 104, 26, a.ACC, 3) + zig("M106 104 l8 0 l4 -6 l6 12 l6 -12 l4 6 l8 0") + a.circle(160, 110, 20, a.COOL, 3)),
    dof: ["2: x₁ and x₂", "rolling without slip ties each disc's turn to its axle's travel, φᵢ = xᵢ/rᵢ"],
    assume: [["Solid discs, J = ½mr²", `${EXAMPLE}; the radii then drop out of T and stay only in M₁/r₁`], ["Rolling without slip", "the floor's friction holds; gravity does no work on the level floor"],
      top ? ["The wall spring holds the top of the rim", "that point moves 2x₁ (first order): keep x₁ small against r₁, since the point leaves the top as the disc turns"] : ["The wall spring holds the axle", "as drawn"],
      ["Disc to disc at axle height", top ? "the figure is unclear whether at the rims; a rim point at axle height moves like the axle to first order, so the axles are used" : "as drawn"]],
    lines: ["Read: each disc rolls without slipping, turning by xᵢ/rᵢ: x₁ and x₂", "T = ½m₁ẋ₁² + ½(½m₁r₁²)(ẋ₁/r₁)² + … = ¾m₁ẋ₁² + ¾m₂ẋ₂²",
      top ? "V = ½k₁(2x₁)² + ½k₂(x₂ − x₁)²: the top of the rim moves twice as far as the axle" : "V = ½k₁x₁² + ½k₂(x₂ − x₁)²: both springs at the axles",
      `D = ½c₁(${top ? "2" : ""}ẋ₁)² + ½c₂(ẋ₂ − ẋ₁)²,  Q = (M₁/r₁, F₁)`,
      `(3/2)m₁ẍ₁ + ${top ? "4" : ""}c₁ẋ₁ + ${top ? "4" : ""}k₁x₁ − c₂(ẋ₂ − ẋ₁) − k₂(x₂ − x₁) = M₁/r₁`, "(3/2)m₂ẍ₂ + c₂(ẋ₂ − ẋ₁) + k₂(x₂ − x₁) = F₁"],
    names: ["m_1", "m_2", "r_1", "r_2", "k_1", "k_2", "c_1", "c_2", "M_1", "F_1"],
    Tq: "1/2*m_1*diff(x1,t)^2 + 1/2*(1/2*m_1*r_1^2)*(diff(x1,t)/r_1)^2 + 1/2*m_2*diff(x2,t)^2 + 1/2*(1/2*m_2*r_2^2)*(diff(x2,t)/r_2)^2",
    Vq: `1/2*k_1*(${x1s})^2 + 1/2*k_2*(x2-x1)^2`, Dq: `1/2*c_1*(${top ? "2*diff(x1,t)" : "diff(x1,t)"})^2 + 1/2*c_2*(diff(x2,t)-diff(x1,t))^2`, Qq: ["M_1/r_1", "F_1"],
    symValues: st => ({ m_1: st.m1, m_2: st.m2, r_1: st.r1, r_2: st.r2, k_1: st.k1, k_2: st.k2, c_1: st.c1, c_2: st.c2, M_1: st.M01, F_1: st.F01 }),
    testState: () => [0.01, -0.02, 0.1, -0.05],
    params: p, Ms: "[3/2*m_1 0; 0 3/2*m_2]",
    rhs: [`M_01/r_1*cos(Om*t) - ${k2s}k_1*x(1) - ${k2s}c_1*x(3) + k_2*(x(2)-x(1)) + c_2*(x(4)-x(3))`, "F_01*cos(Om*t) - k_2*(x(2)-x(1)) - c_2*(x(4)-x(3))"],
    x0: () => [0, 0, 0, 0], T: 4, rest: () => [0, 0],
    figure: (st, [x1, x2], t, label) => discsFig({ xs: [3000 * x1, 3000 * x2], radii: [300 * st.r1, 300 * st.r2], top, label }),
    figLabel: "The two discs on the floor, springs and dampers to the wall and between them", runLabel: "The discs driven by M₁ on disc 1 and F₁ on disc 2; travel scaled ×3",
    show: [[1000, "x₁ [mm]"], [1000, "x₂ [mm]"]], wiggle: [0.005, 0.008], modeW: [100, 100],
    energyNote: "with c₁ = c₂ = 0 and no drive, K + V stays (rolling friction does no work)",
    linName: "Eigenfrequencies (the model is linear)", linParams: st => p(st).slice(0, 6), K: `[${k2s}k_1+k_2 -k_2; -k_2 k_2]`, M: "[3/2*m_1 0; 0 3/2*m_2]",
    linHint: top ? "Held at the top of the rim, the wall spring acts on the axle four times as stiff: twice the stretch, twice the lever." : "Rolling adds half of each disc's mass again: M = 3/2 m.",
    sliders: [["m1", "Disc mass m₁", 0.2, 6, 0.1, "kg"], ["m2", "Disc mass m₂", 0.2, 6, 0.1, "kg"], ["k1", "Wall spring k₁", 20, 2000, 10, "N/m"], ["k2", "Spring k₂", 20, 2000, 10, "N/m"],
      ["c2", "Damper c₂", 0, 10, 0.1, "N·s/m"], ["F01", "Force amplitude F₀₁", 0, 10, 0.1, "N"], ["Om", "Excitation Ω", 1, 60, 0.5, "rad/s"]],
  });
}
export const task9 = discs("task9", false);
export const task10 = discs("task10", true);

// ---- Tasks 11 and 12: Rollen-Pendel
function rollerPend(id, top) {
  const k4 = top ? "4*" : "";
  const p = st => [["m_1", st.m1, "kg, disc"], ["m_2", st.m2, "kg, bob"], ["r", st.r, "m"], ["l", st.l, "m, rod"], ["g", g], ["k", st.k, "N/m"], ["c", st.c, "N*s/m"],
    ["F_01", st.F01, "N"], ["M_01", st.M01, "N*m"], ["Om", st.Om, "rad/s"]];
  return sheetLab({
    id, page: 6, values: VALUES[id], model: rollerPendulum, q: ["x", "phi"], qNames: ["x", "φ"],
    art: () => a.picture(top ? "A disc rolling on the floor, held at the top of its rim by a wall spring, a pendulum hanging from its axle" : "A disc rolling on the floor, tied at axle height to the wall, a pendulum hanging from its axle",
      a.line([[14, 10], [14, 70]], a.INK, 3) + a.line([[14, 70], [190, 70]], a.INK, 3) + zig(top ? "M14 22 l12 0 l5 -6 l6 12 l6 -12 l6 12 l5 -6 l30 0" : "M14 46 l12 0 l5 -6 l6 12 l6 -12 l6 12 l5 -6 l12 0")
      + a.circle(100, 46, 24, a.ACC, 3) + a.line([[100, 46], [120, 128]], a.INK, 3) + a.circle(121, 132, 8, a.COOL, 3, a.COOL)),
    dof: ["2: x and φ", "rolling without slip ties the disc's turn to x/r; the rod swings freely about the axle"],
    assume: [["M₁ turns the disc against the floor", "the sheet does not say whether it acts between disc and rod; read as on the disc, so Q_x = M₁/r"],
      ["Rod massless, bob m₂ a point mass", `rod mass and length are not labelled; ${EXAMPLE}`], ["Solid disc, J₁ = ½m₁r²", EXAMPLE],
      top ? ["The wall spring holds the top of the rim", "that point moves 2x (first order): keep x small against r"] : ["The wall spring at axle height", "the figure is unclear whether at the rim's side or the axle; to first order both move x"]],
    lines: ["Read: the disc rolls without slipping, the rod hangs from its axle: x and φ", "bob: (x + l sin φ, −l cos φ)",
      "T = ½m₁ẋ² + ½(½m₁r²)(ẋ/r)² + ½m₂[(ẋ + lφ̇ cos φ)² + (lφ̇ sin φ)²]",
      top ? "V = −m₂g l cos φ + ½k(2x)²: the top of the rim moves 2x" : "V = −m₂g l cos φ + ½k x²", `D = ½c(${top ? "2" : ""}ẋ)²,  Q = (F₁ + M₁/r, 0)`,
      `(3/2 m₁ + m₂)ẍ + m₂l(φ̈ cos φ − φ̇² sin φ) + ${top ? "4" : ""}cẋ + ${top ? "4" : ""}kx = F₁ + M₁/r`, "m₂l²φ̈ + m₂lẍ cos φ + m₂g l sin φ = 0"],
    names: ["m_1", "m_2", "r", "l", "g", "k", "c", "F_1", "M_1"],
    Tq: "1/2*m_1*diff(x,t)^2 + 1/2*(1/2*m_1*r^2)*(diff(x,t)/r)^2 + 1/2*m_2*((diff(x,t) + l*diff(phi,t)*cos(phi))^2 + (l*diff(phi,t)*sin(phi))^2)",
    Vq: `-m_2*g*l*cos(phi) + 1/2*k*(${top ? "2*x" : "x"})^2`, Dq: `1/2*c*(${top ? "2*diff(x,t)" : "diff(x,t)"})^2`, Qq: ["F_1 + M_1/r", "0"],
    symValues: st => ({ m_1: st.m1, m_2: st.m2, r: st.r, l: st.l, g, k: st.k, c: st.c, F_1: st.F01, M_1: st.M01 }),
    testState: () => [0.02, 0.3, -0.1, 0.4],
    params: p, Ms: "[3/2*m_1+m_2 m_2*l*cos(x(2)); m_2*l*cos(x(2)) m_2*l^2]",
    rhs: [`F_01*cos(Om*t) + M_01/r*cos(Om*t) - ${k4}k*x(1) - ${k4}c*x(3) + m_2*l*x(4)^2*sin(x(2))`, "-m_2*g*l*sin(x(2))"],
    x0: () => [0, 0, 0, 0], T: 6, rest: () => [0, 0],
    figure: (st, [x, phi], t, label) => discsFig({ xs: [1000 * x], radii: [300 * st.r], top, pend: { l: 250 * st.l, phi }, label }),
    figLabel: "The disc on the floor with its spring and damper, the pendulum hanging from the axle", runLabel: "The disc pulled by F₁ and turned by M₁, the pendulum swinging under it",
    show: [[1000, "x [mm]"], [DEG, "φ [°]"]], wiggle: [0.01, 0.3], modeW: [1 / 0.03, 1 / 0.4],
    energyNote: "with c = 0 and no drive, K + V stays",
    linParams: st => p(st).slice(0, 7), K: `[${k4}k 0; 0 m_2*g*l]`, M: "[3/2*m_1+m_2 m_2*l; m_2*l m_2*l^2]",
    linHint: "Linear at x = 0, φ = 0 the two stay coupled through m₂l in M, as task 3's pendulum on a block: the same core model with a rolling disc for the block.",
    sliders: [["m1", "Disc mass m₁", 0.2, 5, 0.1, "kg"], ["m2", "Bob mass m₂", 0.05, 3, 0.05, "kg"], ["l", "Rod length l", 0.1, 0.6, 0.01, "m"], ["k", "Spring k", 10, 1000, 5, "N/m"],
      ["c", "Damper c", 0, 10, 0.1, "N·s/m"], ["F01", "Force amplitude F₀₁", 0, 10, 0.1, "N"], ["Om", "Excitation Ω", 0.5, 40, 0.5, "rad/s"]],
  });
}
export const task11 = rollerPend("task11", true);
export const task12 = rollerPend("task12", false);

// ---- Task 13: Robotermanipulator
const p13 = st => [["m_1", st.m1, "kg, link 1"], ["l_1", st.l1, "m"], ["m_2", st.m2, "kg, link 2"], ["l_2", st.l2, "m"], ["m_3", st.m3, "kg, elbow"], ["m_4", st.m4, "kg, end"],
  ["g", g], ["k_1", st.k1, "N*m/rad"], ["c_1", st.c1, "N*m*s/rad"], ["k_2", st.k2, "N*m/rad"], ["c_2", st.c2, "N*m*s/rad"],
  ["M_01", st.M01, "N*m"], ["M_02", st.M02, "N*m"], ["Om_1", st.Om1, "rad/s"], ["Om_2", st.Om2, "rad/s"]];
const PRE13 = ["a_11 = m_1*l_1^2/3 + (m_2+m_3+m_4)*l_1^2", "a_22 = m_2*l_2^2/3 + m_4*l_2^2", "b_12 = (m_2/2+m_4)*l_1*l_2", "G_1 = (m_1/2+m_2+m_3+m_4)*g*l_1", "G_2 = (m_2/2+m_4)*g*l_2"];
export const task13 = sheetLab({
  id: "task13", page: 7, values: VALUES.task13, model: manipulator, q: ["phi1", "phi2"], qNames: ["φ₁", "φ₂"],
  art: () => a.picture("A two-link arm hanging from a base joint, a motor mass at the elbow and a load at the tip, torques at both joints",
    a.line([[60, 20], [140, 20]], a.INK, 3) + a.line([[100, 20], [130, 74]], a.INK, 5) + a.circle(130, 74, 7, a.INK, 3, a.INK) + a.line([[130, 74], [96, 120]], a.INK, 5)
    + a.circle(96, 122, 7, a.ACC, 3, a.ACC) + a.path("M88 30 a14 14 0 0 0 24 0", a.HOT, 2) + a.path("M120 84 a14 14 0 0 0 22 -4", a.HOT, 2)),
  dof: ["2: φ₁ and φ₂", "absolute angles of the links from the vertical; the motors' torques are inputs, not coordinates"],
  assume: [["Links uniform rods; m₃, m₄ point masses", EXAMPLE], ["Motor torques given", "M₁ at the base, M₂ at the elbow as the sheet writes them; no motor model behind them"],
    ["The double pendulum's core", "VO example 6 is this model with equal rods and m₃ = m₄ = 0 (tested): one copy"]],
  lines: ["Read: two links on driven joints, m₃ (elbow motor) and m₄ (load) as points: φ₁ and φ₂", "T = ½a₁₁φ̇₁² + ½a₂₂φ̇₂² + b φ̇₁φ̇₂ cos(φ₂ − φ₁)",
    "a₁₁ = m₁l₁²/3 + (m₂+m₃+m₄)l₁², a₂₂ = m₂l₂²/3 + m₄l₂², b = (m₂/2 + m₄)l₁l₂",
    "V = −g[(m₁/2+m₂+m₃+m₄)l₁ cos φ₁ + (m₂/2+m₄)l₂ cos φ₂] + ½k₁φ₁² + ½k₂(φ₂ − φ₁)²",
    "D = ½c₁φ̇₁² + ½c₂(φ̇₂ − φ̇₁)²,  Q = (M₁ − M₂, M₂): the elbow motor pushes back on link 1",
    "a₁₁φ̈₁ + b cos(φ₂−φ₁)φ̈₂ − b φ̇₂² sin(φ₂−φ₁) + G₁ sin φ₁ + k₁φ₁ − k₂(φ₂−φ₁) + c₁φ̇₁ − c₂(φ̇₂−φ̇₁) = M₁ − M₂",
    "a₂₂φ̈₂ + b cos(φ₂−φ₁)φ̈₁ + b φ̇₁² sin(φ₂−φ₁) + G₂ sin φ₂ + k₂(φ₂−φ₁) + c₂(φ̇₂−φ̇₁) = M₂"],
  names: ["m_1", "l_1", "m_2", "l_2", "m_3", "m_4", "g", "k_1", "c_1", "k_2", "c_2", "M_1", "M_2"],
  Tq: "1/2*(m_1*l_1^2*(1/3) + (m_2+m_3+m_4)*l_1^2)*diff(phi1,t)^2 + 1/2*(m_2*l_2^2*(1/3) + m_4*l_2^2)*diff(phi2,t)^2 + (m_2/2+m_4)*l_1*l_2*diff(phi1,t)*diff(phi2,t)*cos(phi2-phi1)",
  Vq: "-g*((m_1/2+m_2+m_3+m_4)*l_1*cos(phi1) + (m_2/2+m_4)*l_2*cos(phi2)) + 1/2*k_1*phi1^2 + 1/2*k_2*(phi2-phi1)^2",
  Dq: "1/2*c_1*diff(phi1,t)^2 + 1/2*c_2*(diff(phi2,t)-diff(phi1,t))^2", Qq: ["M_1 - M_2", "M_2"], simplify: false,
  symValues: st => ({ m_1: st.m1, l_1: st.l1, m_2: st.m2, l_2: st.l2, m_3: st.m3, m_4: st.m4, g, k_1: st.k1, c_1: st.c1, k_2: st.k2, c_2: st.c2, M_1: st.M01, M_2: st.M02 }),
  testState: () => [0.3, -0.2, 0.5, 0.1],
  params: p13, pre: PRE13, Ms: "[a_11 b_12*cos(x(2)-x(1)); b_12*cos(x(2)-x(1)) a_22]",
  rhs: ["M_01*cos(Om_1*t) - M_02*cos(Om_2*t) + b_12*x(4)^2*sin(x(2)-x(1)) - G_1*sin(x(1)) - k_1*x(1) + k_2*(x(2)-x(1)) - c_1*x(3) + c_2*(x(4)-x(3))",
    "M_02*cos(Om_2*t) - b_12*x(3)^2*sin(x(2)-x(1)) - G_2*sin(x(2)) - k_2*(x(2)-x(1)) - c_2*(x(4)-x(3))"],
  x0: () => [0, 0, 0, 0], T: 8, rest: () => [0, 0],
  figure: (st, [q1, q2], t, label) => linkage({ pivot: [260, 40], links: [{ angle: q1, len: 160 * st.l1, kind: "rod", bob: 7 }, { angle: q2, len: 160 * st.l2, kind: "rod", bob: 10 }], label }),
  figLabel: "The arm: link 1 from the base, the elbow motor m₃, link 2 with the load m₄", runLabel: "The arm driven by the motor torques M₁ and M₂",
  show: [[DEG, "φ₁ [°]"], [DEG, "φ₂ [°]"]], wiggle: [0.3, 0.5], modeW: [1 / 0.35, 1 / 0.35],
  energyNote: "with c₁ = c₂ = 0 and the motors off, K + V stays",
  linParams: st => [...p13(st).slice(0, 10), ...PRE13.map(s => s.split(" = "))], K: "[G_1+k_1+k_2 -k_2; -k_2 G_2+k_2]", M: "[a_11 b_12; b_12 a_22]",
  linHint: "Hanging at φ₁ = φ₂ = 0: cos(φ₂ − φ₁) → 1, the φ̇² terms drop, sin φ → φ. With point masses only on equal links, λ = (g/l)(2 ∓ √2) (tested).",
  sliders: [["m3", "Elbow mass m₃", 0, 2, 0.05, "kg"], ["m4", "Load m₄", 0, 2, 0.05, "kg"], ["k2", "Elbow spring k₂", 0, 20, 0.5, "N·m/rad"], ["c2", "Elbow damper c₂", 0, 1, 0.01, "N·m·s/rad"],
    ["M01", "Base torque M₀₁", 0, 10, 0.1, "N·m"], ["M02", "Elbow torque M₀₂", 0, 4, 0.05, "N·m"], ["Om1", "Base excitation Ω₁", 0.2, 15, 0.1, "rad/s"]],
});
