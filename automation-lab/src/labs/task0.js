// Lab task 0 (the demonstration): six state controllers with prefilter for one third-order plant, compared by their
// step responses. Step 1 checks controllability; step 2 shows each controller's poles and gain; step 3 races all six.
import { choice, slider } from "../../../kit/ui/kit.js";
import * as a from "../../../kit/ui/art.js";
import { ctrb, verdict, poles, ackermann, lqr, butterworth, prefilter, closedLoop, stepRun, stepinfo } from "../core/index.js";
import { stepper, fmt, fmtC, fmtVec } from "./view.js";
import { splane, grow } from "./pics.js";
import { model, placement, stepinfoCall, num } from "./matlab.js";

// Kubinger (2021b), task 0, p. 1.
export const PLANT = { A: [[-7.1, -8.7, 3.15], [2.3, 0, 3.0], [2.3, 2.5, -1]], b: [2, -3.45, 1.75], c: [-0.78, -1.2, -2.0], d: 0 };
const cc = PLANT.c.map(x => PLANT.c.map(y => x * y));

/** The six controllers; own is the reader's choice, lambda the LQ weight on v² (slides p. 15: Q = cᵀλc, R = 1). */
export function controllers({ lambda = 1, own = [[-3, 2], [-3, -2], [-4, 0]] } = {}) {
  const list = [
    { name: "1: s = −2 (triple)", poles: [[-2, 0], [-2, 0], [-2, 0]] },
    { name: "2: −10 ± j4, −10", poles: [[-10, 4], [-10, -4], [-10, 0]] },
    { name: "3: −0.1 ± j1, −0.5", poles: [[-0.1, 1], [-0.1, -1], [-0.5, 0]] },
    { name: "4: LQ", lq: true },
    { name: "5: Butterworth, radius 2", poles: butterworth(3, 2), bw: true },
    { name: "6: own choice", poles: own },
  ];
  return list.map(C => {
    const r = C.lq ? lqr(PLANT.A, PLANT.b, cc.map(row => row.map(v => v * lambda)), 1).r : ackermann(PLANT.A, PLANT.b, C.poles);
    return { ...C, r, Kf: prefilter(PLANT.A, PLANT.b, PLANT.c, r), cl: poles(closedLoop(PLANT.A, PLANT.b, r)) };
  });
}
const codeFor = (C, lambda) => C.lq ? `lambda = ${num(lambda)};\nQ = lambda*(cT'*cT); R = 1;   % slides p. 15\nrT = lqr(A,b,Q,R);\nAr = A - b*rT;\nKf = inv(cT*inv(-A+b*rT)*b);\nSYSrKf = ss(Ar,b*Kf,cT,d);`
  : C.bw ? `n = 3; k = 1:n; r0 = 2;\np = (r0*exp(1j*(pi/2 + (2*k-1)*pi/(2*n)))).';   % Butterworth: 2n equal parts of the circle\nrT = place(A,b,p);\nAr = A - b*rT;\nKf = inv(cT*inv(-A+b*rT)*b);\nSYSrKf = ss(Ar,b*Kf,cT,d);`
  : placement(C.poles).replace("\nstep(SYSrKf)", "");

export default {
  id: "task0",
  art: () => a.picture("Six step responses rising to one, some fast, one slow and swinging",
    a.line([[20, 40], [190, 40]], a.DIM, 1, "4 4") + a.path("M20 130 C30 40 40 40 190 40", a.ACC, 2) + a.path("M20 130 C60 120 70 40 190 40", a.COOL, 2) +
    a.path("M20 130 Q50 0 80 70 T140 40 L190 40", a.HOT, 2)),
  mount(root) {
    let pick = "0", lambda = 1, own = [[-3, 2], [-3, -2], [-4, 0]], T = 5;
    const setOwn = () => { own = [[s1.get(), s2.get()], [s1.get(), -s2.get()], [s3.get(), 0]]; ui.refresh(); };
    const s1 = slider({ label: "Own: real part of the pair", min: -12, max: -0.5, step: 0.1, value: -3, format: v => fmt(v), onInput: setOwn });
    const s2 = slider({ label: "Own: imaginary part", min: 0, max: 8, step: 0.1, value: 2, format: v => fmt(v), onInput: setOwn });
    const s3 = slider({ label: "Own: third pole", min: -15, max: -0.5, step: 0.1, value: -4, format: v => fmt(v), onInput: setOwn });
    const sl = slider({ label: "LQ weight λ", min: 0.01, max: 1000, log: true, value: 1, format: v => fmt(v, 2), onInput: v => { lambda = v; ui.refresh(); } });
    const which = choice("Controller (step 2)", controllers().map((C, i) => [String(i), C.name]), pick, v => { pick = v; ui.refresh(); });
    const span = choice("Time span (step 3)", [["5", "5 s"], ["60", "60 s"]], "5", v => { T = Number(v); ui.refresh(); });
    const steps = [
      { name: "Controllable?", draw: () => {
        const v = verdict(ctrb(PLANT.A, PLANT.b));
        return {
          figure: splane(poles(PLANT.A), { label: "The plant's poles" }),
          notes: [["det Q_S", fmt(v.det, 5)], ["rank Q_S", `${v.rank} of 3`, "", v.full ? "full: every pole can be placed" : "not full"], ["Plant poles", poles(PLANT.A).map(fmtC).join(", ")]],
          code: `${model(PLANT)}\nUncontrollable_states = length(A) - rank(ctrb(A,b))   % slides p. 18`,
          hint: "The plant is stable but slow; the controllers below move its poles.",
        };
      } },
      { name: "Place the poles", draw: p => {
        const C = controllers({ lambda, own })[Number(pick)], run = stepRun(closedLoop(PLANT.A, PLANT.b, C.r), PLANT.b.map(v => v * C.Kf), PLANT.c, 0, T, 600);
        return {
          figure: [splane(C.cl, { second: poles(PLANT.A), label: "The closed loop's poles (crosses) and the plant's (rings)" }),
            grow({ p, label: `Step response of controller ${C.name}`, xLabel: "t [s]", yLabel: "v", lines: [{ x: run.t, y: run.y, name: "v" }] })],
          notes: [["rᵀ", fmtVec(C.r)], ["Kf", fmt(C.Kf)], ["Poles", C.cl.map(fmtC).join(", ")]],
          code: `${model(PLANT)}\n${codeFor(C, lambda)}\nstep(SYSrKf, ${T})`,
          hint: C.name.startsWith("1") ? "place refuses a pole repeated more often than rank(b) = 1: the triple pole needs acker (MathWorks, place)." : "",
        };
      } },
      { name: "Compare all six", draw: p => {
        const all = controllers({ lambda, own }), runs = all.map((C, i) => {
          const r = stepRun(closedLoop(PLANT.A, PLANT.b, C.r), PLANT.b.map(v => v * C.Kf), PLANT.c, 0, T, 1200);
          return { x: r.t, y: r.y, name: String(i + 1), cls: ["", "second", "third", "faint", "", "second"][i], info: stepinfo(r.t, r.y, 1) };
        });
        return {
          figure: grow({ p, label: "The six step responses", xLabel: "t [s]", yLabel: "v", yMax: 1.6, yMin: -0.6, lines: runs }),
          notes: runs.map((r, i) => [`Controller ${all[i].name}`, `tr ${fmt(r.info.RiseTime, 3)} s, ts ${fmt(r.info.SettlingTime, 3)} s, ${fmt(r.info.Overshoot, 3)} %`, "",
            Number.isFinite(r.info.SettlingTime) ? "" : "not settled within the time span"]),
          code: `${model(PLANT)}\n${all.map((C, i) => `% Controller ${i + 1}\n${codeFor(C, lambda)}\nSYS${i + 1} = SYSrKf;\n${stepinfoCall(`SYS${i + 1}`)}`).join("\n")}\nstep(SYS1,SYS2,SYS3,SYS4,SYS5,SYS6, ${T})`,
          hint: "Anregelzeit, Ausregelzeit and Überschwingweite as stepinfo reports them with its defaults (10–90 % rise, 2 % band); the task names no other limits.",
        };
      } },
    ];
    const ui = stepper(root, steps, { controls: [which, sl, s1, s2, s3, span] });
  },
};
