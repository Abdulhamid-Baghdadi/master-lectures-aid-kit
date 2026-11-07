// Lab task 1: the sealed motor (the circuit of Beispiel 20 with the task's values, 1 V of Uh = 500 rpm). Step 1 places
// the controller poles and scores the response by dr, with the ±10 V limit on u; step 2 adds the observer (only Uh is
// measured); step 3 lets C2 grow tenfold while controller and observer keep the old model.
import { slider } from "../../../kit/ui/kit.js";
import * as a from "../../../kit/ui/art.js";
import { circuit20, ackermann, observerGain, prefilter, runLoop, stepinfo, drFactor, poles } from "../core/index.js";
import { stepper, fmt, fmtC, fmtVec } from "./view.js";
import { grow, motorSvg } from "./pics.js";
import { num, poleVec, stepinfoCall } from "./matlab.js";
import * as Py from "./python.js";

// Kubinger and Lang (2021), task 1, p. 1: R1 = 2.75 Ω, L1 = 125 mH, R2 = 1.99 Ω, C2 = 234 µF; ±10 V; 1 V = 500 rpm.
export const P = { R1: 2.75, L1: 0.125, R2: 1.99, C2: 234e-6 };
export const UMAX = 10;
const head = `R_1 = 2.75; R_2 = 1.99; L_1 = 125e-3; C_2 = 234e-6;\nA = [-(R_1+R_2)/L_1 -1/L_1; 1/C_2 0];\nb = [1/L_1; 0];\ncT = 500*[R_2 1];   % rpm: 1 V of Uh = 500 rpm\nd = 0;\nSYS = ss(A,b,cT,d);`;

const pyHead = `${Py.HEAD}\n\nR_1 = 2.75\nR_2 = 1.99\nL_1 = 125e-3\nC_2 = 234e-6\nA = np.array([[-(R_1+R_2)/L_1, -1/L_1], [1/C_2, 0]])\nb = np.array([[1/L_1], [0]])\ncT = 500*np.array([[R_2, 1]])   # rpm: 1 V of Uh = 500 rpm\nd = 0\nSYS = ss(A, b, cT, d)`;

/** One design: controller poles σ ± jω, observer poles k times faster, the step to w rpm, the plant possibly defect. */
export function design({ s, w, k = 3, target = 2500, defect = 1 }) {
  const m = circuit20(P, 500), plant = circuit20({ ...P, C2: P.C2 * defect }, 500), p = [[s, w], [s, -w]];
  const r = ackermann(m.A, m.b, p), Kf = prefilter(m.A, m.b, m.c, r), l = observerGain(m.A, m.c, p.map(([re, im]) => [k * re, k * im]));
  // A larger C2 slows the loop: the run after the defect gets more time, so its last value is the steady one
  // (python-check, 7 Nov 2026: at the healthy span it was still rising).
  const T = Math.min(0.2, 8 / Math.abs(s)) * (defect > 1 ? 4 : 1);
  const lin = runLoop(m, { r, Kf, w: target, T, n: 2000 });
  const sat = runLoop(m, { r, Kf, w: target, T, n: 2000, umax: UMAX });
  const obs = runLoop(m, { r, Kf, l, w: target, T, n: 2000, umax: UMAX, plant });
  const info = stepinfo(lin.t, lin.v, target, { RiseTimeLimits: [0.05, 0.95], SettlingTimeThreshold: 0.01 });
  const info2 = stepinfo(lin.t, lin.v, target, { RiseTimeLimits: [0.05, 0.95] });
  return { m, p, r, Kf, l, lin, sat, obs, info, info2, dr: drFactor(info), umax: Math.max(...lin.u.map(Math.abs)) };
}

export default {
  id: "task1",
  art: () => a.picture("A motor in a sealed housing with a speed curve and the input limited to plus and minus ten volts",
    a.rect(20, 30, 70, 90, a.DIM, 2) + a.circle(55, 75, 22, a.INK, 3) + a.line([[100, 40], [190, 40]], a.HOT, 1, "4 4") + a.path("M100 130 C120 60 140 45 190 45", a.ACC, 2)),
  mount(root) {
    const st = { s: -60, w: 40, k: 3, target: 2500 };
    const sl = (label, key, min, max, step, unit, help) => slider({ label, unit, min, max, step, value: st[key], format: v => `${fmt(v)}${unit ? ` ${unit}` : ""}`, help, onInput: v => { st[key] = v; ui.refresh(); } });
    const controls = [sl("Controller poles: real part σ", "s", -400, -10, 1, "s⁻¹"), sl("Imaginary part ω", "w", 0, 300, 1, "s⁻¹"),
      sl("Observer poles: times the controller's", "k", 1.5, 8, 0.1, ""), sl("Speed step w", "target", 500, 5000, 100, "rpm", "1 V of Uh is 500 rpm, so 10 V of Us gives 5000 rpm.")];
    const code = d => `${head}\np = ${poleVec(d.p)};\nrT = place(A,b,p);\nAr = A - b*rT;\nKf = inv(cT*inv(-A+b*rT)*b);\nSYSrKf = ss(Ar,b*Kf,cT,d);`;
    const pyCode = d => `${pyHead}\np = ${Py.poleList(d.p)}\nrT = place(A, b, p)\nAr = A - b @ rT\nKf = np.linalg.inv(cT @ np.linalg.inv(-A + b @ rT) @ b)\nSYSrKf = ss(Ar, b @ Kf, cT, d)`;
    const steps = [
      { name: "Score the speed: dr", draw: p => {
        const d = design(st), late = d.umax > UMAX * 1.02;
        return {
          figure: [grow({ p, label: "Speed after the step, linear and with u limited to ±10 V", xLabel: "t [s]", yLabel: "n [rpm]",
            lines: [{ x: d.lin.t, y: d.lin.v, name: "linear" }, { x: d.sat.t, y: d.sat.v, name: "u limited", cls: "second" }] }),
            grow({ p, label: "The input u and the ±10 V limit", xLabel: "t [s]", yLabel: "u [V]",
              lines: [{ x: d.lin.t, y: d.lin.u, name: "u, linear" }, { x: d.sat.t, y: d.sat.u, name: "u limited", cls: "second" },
                { x: [0, d.lin.t.at(-1)], y: [UMAX, UMAX], cls: "faint", noTip: true }, { x: [0, d.lin.t.at(-1)], y: [-UMAX, -UMAX], cls: "faint", noTip: true }] })],
          notes: [["dr", fmt(d.dr, 4), "", "(0.85·tr + 0.25·ts)·(1 + 2.2·Xmax/Xmin): smaller is faster"],
            ["tr (5–95 %)", `${fmt(1000 * d.info.RiseTime, 3)} ms`], ["ts (1 %)", `${fmt(1000 * d.info.SettlingTime, 3)} ms`, "", `with stepinfo's default 2 %: ${fmt(1000 * d.info2.SettlingTime, 3)} ms`],
            ["Xmin, Xmax", `${fmt(d.info.SettlingMin, 4)}, ${fmt(d.info.SettlingMax, 4)} rpm`],
            ["Largest |u|", `${fmt(d.umax, 3)} V`, late ? "danger" : "", late ? "over 10 V by more than 2 %: the task deducts points; the limited response is slower" : "within ±10 V"]],
          python: `${pyCode(d)}\n${Py.stepinfoCall("SYSrKf", [0.05, 0.95], 0.01)}   # the task's 1 %, not the default 2 %\nd_r = (0.85*S["RiseTime"] + 0.25*S["SettlingTime"])*(1 + 2.2*S["SettlingMax"]/S["SettlingMin"])\nSYSu = ss(Ar, b @ Kf, -rT, Kf)   # v = u = -rT x + Kf w (task's tip)\ny, t = step(${num(st.target)}*SYSu)\nprint(rT, Kf, d_r)`,
          pyCheck: [["rT", [d.r]], ["Kf", [[d.Kf]]], ["d_r", d.dr, 0.03]],
          code: `${code(d)}\n${stepinfoCall("SYSrKf", [0.05, 0.95], 0.01)}   % the task's 1 %, not the default 2 %\nd_r = (0.85*S.RiseTime + 0.25*S.SettlingTime)*(1 + 2.2*S.SettlingMax/S.SettlingMin)\nSYSu = ss(Ar,b*Kf,-rT,Kf);   % v = u = -rT*x + Kf*w (task's tip)\nstep(${num(st.target)}*SYSu)`,
          hint: "The task asks for a 1 % settling band: pass 'SettlingTimeThreshold',0.01, or stepinfo uses 2 %. dr and stepinfo here are worked on the linear response; the ±10 V check is separate.",
        };
      } },
      { name: "Add the observer", draw: p => {
        const d = design(st), k = Math.min(d.obs.t.length - 1, Math.floor(p * (d.obs.t.length - 1)));
        const est = d.obs.xhat.map(x => d.m.c[0] * x[0] + d.m.c[1] * x[1]);
        return {
          figure: [motorSvg(p * 20, "The motor", `n = ${fmt(d.obs.v[k], 4)} rpm`), grow({ p, label: "True speed and the observer's estimate", xLabel: "t [s]", yLabel: "n [rpm]",
            lines: [{ x: d.obs.t, y: d.obs.v, name: "true" }, { x: d.obs.t, y: est, name: "estimate", cls: "second" }] })],
          notes: [["ℓ", fmtVec(d.l)], ["Observer poles", poles(d.m.A.map((r, i) => r.map((v, j) => v - d.l[i] * d.m.c[j]))).map(fmtC).join(", ")],
            ["Why an observer", "only Uh leaves the housing", "", "iL and uC cannot be measured, so u = −rᵀx̂ + Kf·w uses the estimate"]],
          python: `${pyCode(d)}\nl = place(A.T, cT.T, ${num(st.k)}*np.array(p)).T\nArb = np.block([[A, -b @ rT], [l @ cT, A - l @ cT - b @ rT]])\nbrb = np.vstack([b, b])\ncTrb = np.hstack([cT, [[0, 0]]])\nSYSrb = ss(Arb, brb @ Kf, cTrb, d)\ny, t = step(${num(st.target)}*SYSrb)\nprint(l)`, pyCheck: ["l", d.l.map(v => [v])],
          code: `${code(d)}\nl = place(A',cT',${num(st.k)}*p)';\nArb = [A -b*rT; l*cT A-l*cT-b*rT];\nbrb = [b; b];\ncTrb = [cT 0 0];\nSYSrb = ss(Arb,brb*Kf,cTrb,d);\nstep(${num(st.target)}*SYSrb)`,
        };
      } },
      { name: "The defect: C2 × 10", draw: p => {
        const d = design({ ...st, defect: 10 }), ok = design(st);
        const est = d.obs.xhat.map(x => d.m.c[0] * x[0] + d.m.c[1] * x[1]);
        const plant = circuit20({ ...P, C2: 10 * P.C2 }, 500);
        const loopA = [...plant.A.map((row, i) => [...row, ...d.r.map(rj => -plant.b[i] * rj)]),
          ...d.m.A.map((row, i) => [...plant.c.map(cj => d.l[i] * cj), ...row.map((v, j) => v - d.l[i] * d.m.c[j] - d.m.b[i] * d.r[j])])];
        return {
          figure: grow({ p, label: "Speed before and after the defect, and the observer's estimate after it", xLabel: "t [s]", yLabel: "n [rpm]",
            lines: [{ x: ok.obs.t, y: ok.obs.v, name: "before", cls: "faint" }, { x: d.obs.t, y: d.obs.v, name: "after: true" }, { x: d.obs.t, y: est, name: "after: estimate", cls: "second" }] }),
          notes: [["Poles of the loop after the defect", poles(loopA).map(fmtC).join(", "), poles(loopA).some(([re]) => re > 0) ? "danger" : ""],
            ["Steady error", `${fmt(d.obs.v.at(-1) - st.target, 3)} rpm`, Math.abs(d.obs.v.at(-1) - st.target) > 0.01 * st.target ? "warn" : "", "at the end of the run; Kf was worked for the old C2"]],
          python: `${pyCode(d)}\nl = place(A.T, cT.T, ${num(st.k)}*np.array(p)).T\nA_defect = np.array([[-(R_1+R_2)/L_1, -1/L_1], [1/(10*C_2), 0]])   # the plant changes, the controller and observer do not\nArb = np.block([[A_defect, -b @ rT], [l @ cT, A - l @ cT - b @ rT]])\nSYS_defect = ss(Arb, np.vstack([b, b]) @ Kf, np.hstack([cT, [[0, 0]]]), d)\ny, t = step(${num(st.target)}*SYS_defect)\nprint(pole(SYS_defect))`, pyCheck: [Py.PY_POLES("Arb"), Py.polesKey(poles(loopA)), 1e-5],
          code: `${code(d)}\nl = place(A',cT',${num(st.k)}*p)';\nA_defect = [-(R_1+R_2)/L_1 -1/L_1; 1/(10*C_2) 0];   % the plant changes, the controller and observer do not\nArb = [A_defect -b*rT; l*cT A-l*cT-b*rT];\nSYS_defect = ss(Arb,[b; b]*Kf,[cT 0 0],d);\nstep(${num(st.target)}*SYS_defect)`,
          hint: "The observer still assumes the old C2: its estimate and the true speed part while the speed changes, and meet again once it is steady.",
        };
      } },
    ];
    const ui = stepper(root, steps, { controls });
  },
};
