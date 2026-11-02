// The Kalman filter in one dimension (Wöber, MuS 1 Gaussianfilters, pp. 6–13): a robot told to drive 1 m per step
// slips, a range sensor reads its place with noise now and then; the filter's mean follows, its variance grows with
// every prediction and shrinks with every measurement (EKFLoc, p. 7).
import { kalman, uniform, normal } from "../core/index.js";
import { h, slider, readout } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

const STEPS = 40;

export default {
  id: "kalman",
  art: () => a.picture("A wobbling true path, a smooth estimate following it inside a band that narrows at each measurement",
    a.path("M15 90 C40 70 60 100 85 80 S130 60 185 75", a.DIM, 2) + a.path("M15 90 C50 85 90 80 185 72", a.ACC, 3) +
      a.path("M15 70 C50 60 70 75 100 62 S150 55 185 58", a.INK, 1.5, "4 4") + a.path("M15 110 C50 105 70 98 100 98 S150 88 185 88", a.INK, 1.5, "4 4") +
      [40, 85, 130, 175].map(x => a.circle(x, 76 + (x % 3) * 4, 3, a.HOT, 2)).join("")),
  mount(root) {
    let R = 0.04, Q = 0.25, every = 5, seed = 21;
    const box = h("div", {}), rK = readout("Last Kalman gain K"), rS = readout("Uncertainty at the end, 2σ"), rE = readout("Mean error of the estimate");
    const update = () => {
      const u = 1, gm = normal(uniform(seed)), gz = normal(uniform(seed + 1));
      const t = [0], truth = [0], mu = [0], lo = [0], hi = [0], zt = [], zs = [];
      let x = 0, b = { mu: 0, sigma2: 0.01 }, K = 0, err = 0;
      for (let k = 1; k <= STEPS; k++) {
        x += u + Math.sqrt(R) * gm();
        const z = every && k % every === 0 ? x + Math.sqrt(Q) * gz() : null;
        const s = kalman({ mu: b.mu, sigma2: b.sigma2, u, z, R, Q });
        b = s; if (z !== null) { K = s.K; zt.push(k); zs.push(z - k * u); }
        t.push(k); truth.push(x - k * u); mu.push(b.mu - k * u);
        lo.push(b.mu - 2 * Math.sqrt(b.sigma2) - k * u); hi.push(b.mu + 2 * Math.sqrt(b.sigma2) - k * u);
        err += Math.abs(b.mu - x) / STEPS;
      }
      box.replaceChildren(lineChart({ label: "Where the robot is, against where it was told to be, over 40 steps: the truth, the filter's mean and its 2σ band, and the measurements",
        xLabel: "Step t", yLabel: "Position − commanded travel [m]", xMin: 0, xMax: STEPS,
        lines: [{ x: t, y: truth, name: "true position", cls: "faint" }, { x: t, y: mu, name: "estimate μ", cls: "second" }, { x: t, y: hi, name: "μ ± 2σ", cls: "third" }, { x: t, y: lo, cls: "third" }],
        marks: zt.map((k, i) => ({ x: k, y: zs[i], shape: "o" })) }));
      rK.set(every ? K.toFixed(3) : "no measurement", "", "Σ̄C/(CΣ̄C + Q): near 1 the filter trusts the sensor, near 0 the prediction (p. 12)");
      rS.set(`± ${(2 * Math.sqrt(b.sigma2)).toFixed(2)} m`, "", every ? "it grows by R every step and drops at each measurement" : "with no measurement it only grows: Σ̄ = Σ + R every step");
      rE.set(`${err.toFixed(3)} m`, "", "the mean distance between the estimate and the truth over the run");
    };
    const sl = (label, min, max, v, step, set, format) => slider({ label, min, max, value: v, step, format, onInput: x => { set(x); update(); } }).el;
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      sl("Process noise R, the variance of each move [m²]", 0.001, 0.2, R, 0.001, v => R = v, v => v.toFixed(3)),
      sl("Sensor noise Q, the variance of each reading [m²]", 0.01, 1, Q, 0.01, v => Q = v, v => v.toFixed(2)),
      sl("A measurement every … steps (0: none)", 0, 10, every, 1, v => every = v, v => String(v)),
      sl("Noise seed", 1, 50, seed, 1, v => seed = v, v => String(v)),
      rK.el, rS.el, rE.el,
      h("p", { class: "hint" }, "Here A = B = C = 1: the state is the position, the command moves it by u = 1 m, the sensor reads the position. The chart subtracts the commanded travel, so a robot that did exactly as told stays on zero. Raise Q and the filter trusts each reading less (smaller K); raise R and it trusts its own prediction less. The filter's R and Q are the noise the simulation really has; a filter told the wrong noise is the next thing to try in code."))));
    update();
  },
};
