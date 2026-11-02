// The EKF's prediction against sampled motion (Wöber, MuS 1 EKF, pp. 3–12; MCMC, pp. 5 and 20): a robot drives an arc
// with noisy wheels; 400 sampled poses spread into a curved cloud, the EKF's linearised Gaussian into an ellipse.
// Where the two part ways is where the linearisation stops holding.
import { ekfPredict, motionNoise, sampleMove, move, uniform, normal } from "../core/index.js";
import { h, slider, readout } from "../../../kit/ui/kit.js";
import * as a from "../../../kit/ui/art.js";
import { plane, polyline, dot, ellipse, robot } from "./draw.js";

const M = 400;

export default {
  id: "ekf",
  art: () => a.picture("A curved, banana-shaped cloud of dots with a straight ellipse laid over it",
    Array.from({ length: 60 }, (_, i) => { const t = (i * 37 % 60) / 60 - 0.5, r = 70 + ((i * 13) % 11) - 5; return a.circle(100 + r * Math.sin(t * 1.6), 130 - r * Math.cos(t * 1.6), 1.6, a.INK, 0, a.INK); }).join("") +
      `<ellipse cx="100" cy="62" rx="58" ry="14" fill="none" stroke="${a.ACC}" stroke-width="3"/>`),
  mount(root) {
    let dd = 0.5, turn = 10, steps = 6, sdD = 0.05, sdTh = 4;
    const box = h("div", {}), rM = readout("EKF mean against the samples' mean"), rS = readout("Spread across the path, 2σ"), rG = readout("Jacobian G of the last step");
    const update = () => {
      const dth = turn * Math.PI / 180, sTh = sdTh * Math.PI / 180, g = normal(uniform(31));
      let mu = [0, 0, 0], Sigma = [[0, 0, 0], [0, 0, 0], [0, 0, 1e-9]], G = null;
      let cloud = Array.from({ length: M }, () => [0, 0, 0]);
      const path = [[0, 0]];
      for (let k = 0; k < steps; k++) {
        const R = motionNoise(mu, dd, dth, sdD, sTh);
        ({ mu, Sigma, G } = ekfPredict(mu, Sigma, dd, dth, R));
        cloud = cloud.map(p => sampleMove(p, dd, dth, sdD, sTh, g));
        path.push([mu[0], mu[1]]);
      }
      const mx = cloud.reduce((s, p) => s + p[0], 0) / M, my = cloud.reduce((s, p) => s + p[1], 0) / M;
      const xs = cloud.map(p => p[0]).concat(0), ys = cloud.map(p => p[1]).concat(0), m = 0.15;
      box.replaceChildren(plane([Math.min(...xs) - m, Math.min(...ys) - m, Math.max(...xs) + m, Math.max(...ys) + m],
        `${M} sampled poses after ${steps} noisy steps, with the EKF's mean and 2σ ellipse`, [
          ...cloud.map(p => dot([p[0], p[1]], "sample", 1.6)), polyline(path, "second"), ellipse([mu[0], mu[1]], [[Sigma[0][0], Sigma[0][1]], [Sigma[1][0], Sigma[1][1]]]),
          dot([mx, my], "hot", 4), robot([0, 0, 0], 0.08)]));
      rM.set(`${(100 * Math.hypot(mu[0] - mx, mu[1] - my)).toFixed(1)} cm apart`, Math.hypot(mu[0] - mx, mu[1] - my) > 0.05 ? "warn" : "",
        "the samples' mean (red dot) lies inside the arc; the EKF carries the mean through g unchanged, so it stays on it");
      const head = mu[2], across = [-Math.sin(head), Math.cos(head)];
      const v = across[0] ** 2 * Sigma[0][0] + 2 * across[0] * across[1] * Sigma[0][1] + across[1] ** 2 * Sigma[1][1];
      rS.set(`± ${(200 * Math.sqrt(v)).toFixed(1)} cm`, "", "the heading's noise, swung through the distance driven, makes the cloud wide across the path");
      rG.set(G ? `[1, 0, ${G[0][2].toFixed(3)}; 0, 1, ${G[1][2].toFixed(3)}; 0, 0, 1]` : "—", "", "∂g/∂(x, y, θ) at the mean: −δd·sin(θ + δθ) and δd·cos(θ + δθ) in the last column");
    };
    const sl = (label, unit, min, max, v, step, set, f) => slider({ label, unit, min, max, value: v, step, format: f, onInput: x => { set(x); update(); } }).el;
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      sl("Distance per step δd", "m", 0.1, 1, dd, 0.05, v => dd = v, v => `${v.toFixed(2)} m`),
      sl("Turn per step δθ", "°", -30, 30, turn, 1, v => turn = v, v => `${v}°`),
      sl("Steps", "", 1, 15, steps, 1, v => steps = v, v => String(v)),
      sl("Noise of δd, σ", "m", 0, 0.2, sdD, 0.01, v => sdD = v, v => `${v.toFixed(2)} m`),
      sl("Noise of δθ, σ", "°", 0, 20, sdTh, 0.5, v => sdTh = v, v => `${v}°`),
      rM.el, rS.el, rG.el,
      h("p", { class: "hint" }, "Raise the turning noise: the samples bend into a banana, as in the course's figures (MCMC, pp. 5 and 20), while the EKF can only draw an ellipse, a Gaussian linearised at its mean by a first-order Taylor series (EKF, p. 8). Raise the distance noise instead and the cloud stretches along the path, where an ellipse fits well. The process noise R in x, y, θ is the noise of δd and δθ carried through the motion's derivative, worked here so both share one noise; the samples come from a seeded generator."))));
    update();
  },
};
