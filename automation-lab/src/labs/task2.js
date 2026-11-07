// Lab task 2: the crane trolley moved from x = 0 to 2.5 m with the swing within ±2.5°. Step 1 places Butterworth poles,
// step 2 compares an LQ controller, step 3 runs the observer on the nonlinear crane, step 4 replaces the prefilter by a
// PI outer loop.
import { slider } from "../../../kit/ui/kit.js";
import * as a from "../../../kit/ui/art.js";
import { crane, ackermann, butterworth, lqr, prefilter, runLoop, observerGain, piLoop, stepRun, poles } from "../core/index.js";
import { stepper, fmt, fmtC, fmtVec } from "./view.js";
import { grow, craneSvg } from "./pics.js";
import { num, mat } from "./matlab.js";
import * as Py from "./python.js";

// Kubinger (2021b), task 2, p. 2: mK = 24 kg, mL = 160 kg, l = 7.8 m, g = 9.8065 m/s²; 0 → 2.5 m, |φ| ≤ 2.5°.
export const CR = crane({ mK: 24, mL: 160, l: 7.8 });
export const GOAL = 2.5, LIMIT = 2.5;
const deg = v => v * 180 / Math.PI;
const head = `m_K = 24; m_L = 160; l = 7.8; g = 9.8065;\nA = [0 1 0 0; -g/l*(m_K+m_L)/m_K 0 0 0; 0 0 0 1; m_L*g/m_K 0 0 0];\nb = [0; -1/(m_K*l); 0; 1/m_K];\ncT = [0 0 1 0];   % x = [phi; omega; x; v], v = position\nd = 0;\nSYS = ss(A,b,cT,d);`;
const bwCode = r0 => `n = 4; k = 1:n; r0 = ${num(r0)};\np = (r0*exp(1j*(pi/2 + (2*k-1)*pi/(2*n)))).';   % angles ±22.5° and ±67.5° from the negative real axis\nrT = place(A,b,p);`;
const loopCode = "Ar = A - b*rT;\nKf = inv(cT*inv(-A+b*rT)*b);\nSYSrKf = ss(Ar,b*Kf,cT,d);\n[y,t,x] = step(SYSrKf, 30);\ny = 2.5*y; x = 2.5*x;   % the step from 0 to 2.5 m\nplot(t, y, t, x(:,1)*180/pi)";

const pyHead = `${Py.HEAD}\n\nm_K = 24\nm_L = 160\nl = 7.8\ng = 9.8065\nA = np.array([[0, 1, 0, 0], [-g/l*(m_K+m_L)/m_K, 0, 0, 0], [0, 0, 0, 1], [m_L*g/m_K, 0, 0, 0]])\nb = np.array([[0], [-1/(m_K*l)], [0], [1/m_K]])\ncT = np.array([[0, 0, 1, 0]])   # x = [phi, omega, x, v], v = position\nd = 0\nSYS = ss(A, b, cT, d)`;
const pyBw = r0 => `n = 4\nk = np.arange(1, n+1)\nr0 = ${num(r0)}\np = r0*np.exp(1j*(np.pi/2 + (2*k-1)*np.pi/(2*n)))   # angles 22.5 and 67.5 deg from the negative real axis\np = np.round(p, 12)   # scipy's place_poles wants exact conjugate pairs; MATLAB's place takes the rounding\nrT = place(A, b, p)`;
const pyLoop = "Ar = A - b @ rT\nKf = np.linalg.inv(cT @ np.linalg.inv(-A + b @ rT) @ b)\nSYSrKf = ss(Ar, b @ Kf, cT, d)\ny, t, x = step(SYSrKf, 30, return_x=True)\ny = 2.5*y\nx = 2.5*x   # the step from 0 to 2.5 m";

/** A run of the linear loop for the 2.5 m move, with its largest swing, settling and input. */
function move(r, T = 30) {
  const Kf = prefilter(CR.A, CR.b, CR.c, r), run = runLoop(CR, { r, Kf, w: GOAL, T, n: 1500 });
  return { r, Kf, run, swing: Math.max(...run.x.map(x => Math.abs(deg(x[0])))), F: Math.max(...run.u.map(Math.abs)) };
}
const view = (m, p, extra = []) => {
  const k = Math.min(m.run.t.length - 1, Math.floor(p * (m.run.t.length - 1))), x = m.run.x[k];
  return [craneSvg({ x: x[2], phi: x[0], l: 7.8, track: [-0.5, 3.5], label: "The trolley and its load during the move, drawn to scale" }),
    grow({ p, label: "Position x and swing φ during the move", xLabel: "t [s]", yLabel: "x [m], φ [°]",
      lines: [{ x: m.run.t, y: m.run.x.map(z => z[2]), name: "x [m]" }, { x: m.run.t, y: m.run.x.map(z => deg(z[0])), name: "φ [°]", cls: "second" },
        { x: [0, m.run.t.at(-1)], y: [LIMIT, LIMIT], cls: "faint", noTip: true }, { x: [0, m.run.t.at(-1)], y: [-LIMIT, -LIMIT], cls: "faint", noTip: true }, ...extra] })];
};
const verdictNotes = m => [["Largest swing", `${fmt(m.swing, 3)}°`, m.swing > LIMIT ? "danger" : "", m.swing > LIMIT ? "over ±2.5°: the task's limit is broken" : "within ±2.5°"],
  ["Largest force", `${fmt(m.F, 4)} N`, "", "the task asks to keep it moderate"], ["rᵀ", fmtVec(m.r)]];

export default {
  id: "task2",
  art: () => a.picture("A crane trolley carrying a hanging load across, the rope barely swung",
    a.line([[10, 30], [190, 30]], a.INK, 2) + a.rect(120, 18, 36, 16, a.INK, 3) + a.line([[138, 34], [132, 120]], a.ACC, 2) + a.circle(132, 126, 8, a.ACC, 3, a.ACC) +
    a.arrow(30, 140, 110, 140, a.COOL, 2)),
  mount(root) {
    const st = { r0: 0.98, qphi: 1000, qx: 10, k: 3, kp: 0.2, Tn: 20 };
    const sl = (label, key, min, max, opts = {}) => slider({ label, min, max, value: st[key], format: v => fmt(v, 3), onInput: v => { st[key] = v; ui.refresh(); }, ...opts });
    const steps = [
      { name: "Butterworth poles", draw: p => {
        const pb = butterworth(4, st.r0), m = move(ackermann(CR.A, CR.b, pb));
        return { figure: view(m, p), notes: [["Poles", pb.map(fmtC).join(", ")], ...verdictNotes(m)],
          code: `${head}\n${bwCode(st.r0)}\n${loopCode}`, python: `${pyHead}\n${pyBw(st.r0)}\n${pyLoop}\nprint(rT)`, pyCheck: ["rT", [m.r], 1e-5],
          hint: "A larger radius moves faster but swings harder. For n = 4 the poles sit at ±22.5° and ±67.5° from the negative real axis (slides p. 32): π/8 and 3π/8, not π/8 and π/4." };
      } },
      { name: "LQ instead", draw: p => {
        const Q = [[st.qphi, 0, 0, 0], [0, 0, 0, 0], [0, 0, st.qx, 0], [0, 0, 0, 0]], lq = lqr(CR.A, CR.b, Q, 1), m = move(lq.r), bw = move(ackermann(CR.A, CR.b, butterworth(4, st.r0)));
        return { figure: view(m, p, [{ x: bw.run.t, y: bw.run.x.map(z => z[2]), name: "x, Butterworth", cls: "third", noTip: true }]),
          notes: [["Poles", lq.poles.map(fmtC).join(", ")], ...verdictNotes(m)],
          python: `${pyHead}\nQ = ${Py.arr(Q)}   # weights on phi and x\nR = 1\nrT, _, _ = lqr(A, b, Q, R)   # u = -rT x; also returns S and the closed-loop poles E\n${pyLoop}\nprint(rT)`, pyCheck: ["rT", [lq.r], 1e-4],
          code: `${head}\nQ = ${mat(Q)};   % weights on phi and x\nR = 1;\nrT = lqr(A,b,Q,R);   % u = -rT*x (MathWorks, lqr)\n${loopCode}`,
          hint: "A heavier weight on φ trades speed for a calmer load; the weight on x pulls the trolley home faster." };
      } },
      { name: "Observer on the real crane", draw: p => {
        const pb = butterworth(4, st.r0), r = ackermann(CR.A, CR.b, pb), Kf = prefilter(CR.A, CR.b, CR.c, r);
        const l = observerGain(CR.A, CR.c, pb.map(([re, im]) => [st.k * re, st.k * im]));
        const run = runLoop(CR, { r, Kf, l, w: GOAL, T: 30, n: 1500, f: CR.f, x0: [0.02, 0, 0, 0] });
        const m = { r, run, swing: Math.max(...run.x.map(x => Math.abs(deg(x[0])))), F: Math.max(...run.u.map(Math.abs)) };
        return { figure: view(m, p, [{ x: run.t, y: run.xhat.map(z => deg(z[0])), name: "φ̂ [°]", cls: "third" }]),
          notes: [["ℓ", fmtVec(l)], ["Observer poles", `${num(st.k)} × the controller's`], ...verdictNotes(m).slice(0, 1),
            ["Plant", "the nonlinear crane, starting at φ = 1.1°", "", "the controller and observer were designed on the linear model"]],
          python: `${pyHead}\n${pyBw(st.r0)}\nAr = A - b @ rT\nKf = np.linalg.inv(cT @ np.linalg.inv(-A + b @ rT) @ b)\nl = place(A.T, cT.T, ${num(st.k)}*p).T   # from x alone\nArb = np.block([[A, -b @ rT], [l @ cT, A - l @ cT - b @ rT]])\nSYSrb = ss(Arb, np.vstack([b, b]) @ Kf, np.hstack([cT, np.zeros((1, 4))]), d)\ny, t, x = step(SYSrb, 30, return_x=True)   # the linear loop; the nonlinear crane needs solve_ivp\nprint(l)`, pyCheck: ["l", l.map(v => [v]), 1e-5],
          code: `${head}\n${bwCode(st.r0)}\nAr = A - b*rT;\nKf = inv(cT*inv(-A+b*rT)*b);\nl = place(A',cT',${num(st.k)}*p)';   % from x alone; with C = [1 0 0 0; 0 0 1 0] place(A',C',p)' uses phi too\nArb = [A -b*rT; l*cT A-l*cT-b*rT];\nSYSrb = ss(Arb,[b; b]*Kf,[cT zeros(1,4)],d);\n[y,t,x] = step(SYSrb, 30);\nplot(t, 2.5*y, t, 2.5*x(:,1)*180/pi, t, 2.5*x(:,5)*180/pi)`,
          hint: "The task lets you measure x and φ; this lab's observer uses x alone, which already makes the pair observable. The swing here comes from the nonlinear model (ode45 in MATLAB), which step cannot run." };
      } },
      { name: "PI outer loop", draw: p => {
        const r = ackermann(CR.A, CR.b, butterworth(4, st.r0)), M = piLoop(CR.A, CR.b, CR.c, r, st.kp, st.Tn), T = 60;
        const run = stepRun(M.A, M.b, M.c, 0, T, 1500, GOAL), unstable = poles(M.A).some(([re]) => re > 0);
        const x = run.x.map(z => z.slice(0, 4)), u = run.x.map(z => -r.reduce((s, v, i) => s + v * z[i], 0) + st.kp * (GOAL - z[2]) + st.kp / st.Tn * z[4]);
        const m = { r, run: { t: run.t, x, u }, swing: Math.max(...x.map(z => Math.abs(deg(z[0])))), F: Math.max(...u.map(Math.abs)) };
        return { figure: unstable ? view(m, 0.02) : view(m, p),
          notes: [["Poles of the loop", poles(M.A).map(fmtC).join(", "), unstable ? "danger" : "", unstable ? "unstable: take a smaller kp or a longer Tn" : "the PI adds a fifth state, ∫e dt"], ...verdictNotes(m).slice(0, 2)],
          python: `${pyHead}\n${pyBw(st.r0)}\nSYSr = ss(A - b @ rT, b, cT, d)   # the state loop is the PI's plant; no prefilter\n# pidtune has no python-control counterpart: kp and Tn are set by hand, as in the lab\nkp = ${num(st.kp)}\nTn = ${num(st.Tn)}\ns = tf("s")\nC_pi = kp*(1 + 1/(s*Tn))\nT_pi = feedback(C_pi*SYSr, 1)   # unity negative feedback, as MATLAB's\ny, t = step(T_pi, ${T})\nprint(ct.poles(T_pi))`,
          pyCheck: ["[np.sort(ct.poles(T_pi).real), np.sort(np.abs(ct.poles(T_pi).imag))]", Py.polesKey(poles(M.A)), 1e-4],
          code: `${head}\n${bwCode(st.r0)}\nSYSr = ss(A - b*rT, b, cT, d);   % the state loop is the PI's plant; no prefilter\nopts = pidtuneOptions('PhaseMargin',80,'DesignFocus','reference-tracking');\nC_pi = pidtune(SYSr,'PI',opts);\nT_pi = feedback(C_pi*SYSr, 1);   % unity negative feedback\n[y,t] = step(T_pi, ${T});\nplot(t, 2.5*y)`,
          hint: "The PI's integral makes the steady position exact even when the model is off; pidtune picks kp and Tn in MATLAB, here you set them by hand (kp·(1 + 1/(s·Tn)), task sheet Abbildung 2)." };
      } },
    ];
    const ui = stepper(root, steps, { controls: [sl("Butterworth radius", "r0", 0.3, 2.5, { step: 0.01 }), sl("LQ weight on φ", "qphi", 1, 1e5, { log: true }), sl("LQ weight on x", "qx", 0.1, 1e3, { log: true }),
      sl("Observer poles: times the controller's", "k", 1.5, 6, { step: 0.1 }), sl("PI gain kp", "kp", 0.01, 2, { log: true }), sl("PI reset time Tn", "Tn", 1, 100, { log: true, format: v => `${fmt(v, 3)} s` })] });
  },
};
