// Beispiel 21: the permanent-magnet DC motor. Step 1 writes the armature mesh and the torque balance into A, b, cᵀ and
// the disturbance input; step 2 starts the motor at the terminal voltage; step 3 adds a load torque.
import { h, slider } from "../../../kit/ui/kit.js";
import * as a from "../../../kit/ui/art.js";
import { motor21, ctrb, obsv, det, simulate, matVec, poles } from "../core/index.js";
import { stepper, fmt, fmtC } from "./view.js";
import { motorSvg, grow, mtx } from "./pics.js";

// Kubinger (2021a), Beispiel 21, p. 22: RA = 0.8 Ω, LA = 125 mH, c = 50 mVs, J = 0.002 kg m², UA,max = 16 V.
const P = { RA: 0.8, LA: 0.125, c: 0.05, J: 0.002 };
const m = motor21(P);
const code = `RA = 0.8; LA = 0.125; c = 0.05; J = 0.002;\nA = [-RA/LA -c*2*pi/LA; c/(J*2*pi) 0];\nb = [1/LA; 0];\nbz = [0; -1/(J*2*pi)];   % load torque ML\ncT = [0 1];   % n in 1/s\nd = 0;\nSYS = ss(A,[b bz],cT,[0 0]);   % inputs UA and ML`;

/** Speed n (1/s) and the shaft angle 2π∫n, for UA from t = 0 and ML from t = tL. */
function run(UA, ML, tL, T = 1.5) {
  const r = simulate((t, x) => matVec(m.A, [x[0], x[1]]).map((v, i) => v + m.b[i] * UA + (t >= tL ? m.bz[i] * ML : 0)).concat(2 * Math.PI * x[1]), [0, 0, 0], T, 600);
  return { t: r.t, i: r.x.map(x => x[0]), n: r.x.map(x => x[1]), angle: r.x.map(x => x[2]) };
}

export default {
  id: "motor",
  art: () => a.picture("A motor shaft with three spokes turning, and its speed rising to a steady value",
    a.circle(70, 75, 45, a.INK, 3) + a.line([[70, 75], [110, 60]], a.ACC, 3) + a.line([[70, 75], [55, 115]], a.ACC, 3) + a.line([[70, 75], [45, 40]], a.ACC, 3) +
    a.path("M130 120 Q150 50 190 45", a.COOL, 2)),
  mount(root) {
    let UA = 16, ML = 0.2;
    const sU = slider({ label: "Terminal voltage UA", unit: "V", min: 0, max: 16, step: 0.5, value: UA, format: v => `${fmt(v)} V`, onInput: v => { UA = v; ui.refresh(); } });
    const sM = slider({ label: "Load torque ML", unit: "N m", min: 0, max: 1, step: 0.05, value: ML, format: v => `${fmt(v)} N m`, onInput: v => { ML = v; ui.refresh(); }, help: "Step 3: applied at t = 0.8 s." });
    const steps = [
      { name: "Write the model", draw: p => ({
        figure: [motorSvg(p * 6, "The motor", "UA = iA·RA + LA·diA/dt + c·2π·n,  J·2π·dn/dt = c·iA − ML"),
          h("div", { class: "mtx-row" }, mtx("A", m.A, { cells: Math.floor(p * 5) }), mtx("b", m.b, { cells: p > 0.8 ? 2 : 0 }), mtx("b_z", m.bz, { cells: p >= 1 ? 2 : 0 }), mtx("cᵀ", m.c, { row: true, cells: p >= 1 ? 2 : 0 }))],
        notes: [["States", "x1 = iA, x2 = n", "", "u = UA, disturbance z = ML, v = n in revolutions per second"],
          ["det Q_S", fmt(det(ctrb(m.A, m.b)), 4), "", "c/(2π·J·LA²) ≠ 0: controllable"], ["det Q_B", fmt(det(obsv(m.A, m.c)), 4), "", "−c/(2π·J) ≠ 0: observable"]],
        sheet: [{ source: "S2, pp. 11–12; M, p. 50", sheet: "A = [−RA/LA −c·2π/LA; c/(J·2π) 0], b = [1/LA; 0], cᵀ = [0 1]; symbolic only", lab: `A = [${fmt(m.A[0][0])} ${fmt(m.A[0][1])}; ${fmt(m.A[1][0])} 0]`, agree: true }],
        code, hint: "The sheets write no disturbance column; from J·2π·dn/dt = c·iA − ML it is b_z = [0; −1/(2πJ)], worked here.",
      }) },
      { name: "Start the motor", draw: p => {
        const r = run(UA, 0, Infinity), k = Math.min(600, Math.floor(p * 600));
        return {
          figure: [motorSvg(r.angle[k], `The shaft after ${fmt(r.t[k], 2)} s`, `n = ${fmt(60 * r.n[k], 4)} rpm`),
            grow({ p, label: "Speed after switching UA on", xLabel: "t [s]", yLabel: "n [rpm]", lines: [{ x: r.t, y: r.n.map(v => 60 * v), name: "n" }] })],
          notes: [["Steady speed", `${fmt(60 * UA / (2 * Math.PI * P.c), 4)} rpm`, "", "UA/(c·2π) once the current has died away (no load, no friction)"], ["Poles", poles(m.A).map(fmtC).join(", ")]],
          code: `${code}\nt = linspace(0,1.5,601);\n[y,t] = lsim(SYS, [${fmt(UA)}*ones(size(t')) zeros(size(t'))], t);\nplot(t, 60*y)   % rpm`,
        };
      } },
      { name: "Add a load torque", draw: p => {
        const r = run(UA, ML, 0.8), k = Math.min(600, Math.floor(p * 600));
        return {
          figure: [motorSvg(r.angle[k], "The shaft under load", `n = ${fmt(60 * r.n[k], 4)} rpm, iA = ${fmt(r.i[k], 3)} A`),
            grow({ p, label: "Speed and current with the load torque from 0.8 s", xLabel: "t [s]", yLabel: "n [rpm], iA [A]",
              lines: [{ x: r.t, y: r.n.map(v => 60 * v), name: "n" }, { x: r.t, y: r.i.map(v => 100 * v), name: "100·iA", cls: "second" }] })],
          notes: [["Speed drop", `${fmt(60 * ML * P.RA / (P.c * P.c * 2 * Math.PI), 3)} rpm`, "", "steady: iA = ML/c, so n falls by RA·ML/(c²·2π)"]],
          code: `${code}\nt = linspace(0,1.5,601)';\nML = ${fmt(ML)}*(t >= 0.8);\n[y,t] = lsim(SYS, [${fmt(UA)}*ones(size(t)) ML], t);\nplot(t, 60*y)`,
        };
      } },
    ];
    const ui = stepper(root, steps, { controls: [sU, sM] });
  },
};
