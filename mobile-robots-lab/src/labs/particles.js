// Monte Carlo localisation on the corridor (Wöber, MuS 1 MCMC, pp. 6–23): particles spread over the whole corridor
// (global localisation), move with noise, are weighted by the door sensor and redrawn in proportion to their weights,
// until they cluster where the robot is.
import { particleStep, histogram, uniform, normal, CORRIDOR } from "../core/index.js";
import { h, slider, readout } from "../../../kit/ui/kit.js";
import * as a from "../../../kit/ui/art.js";
import { corridor } from "./draw.js";

export default {
  id: "particles",
  art: () => a.picture("Dots scattered along a corridor gathering into two clusters in front of doors",
    [30, 120].map(x => a.rect(x, 110, 22, 20, a.ACC, 2)).join("") + a.line([[10, 105], [190, 105]], a.DIM, 2) +
      Array.from({ length: 70 }, (_, i) => { const c = i % 3 ? (i % 2 ? 41 : 131) : 10 + (i * 53) % 180; return a.circle(c + ((i * 7) % 13) - 6, 98 - (i % 9) * 6, 2, a.INK, 0, a.INK); }).join("")),
  mount(root) {
    const { cells, doors } = CORRIDOR, door = x => doors.includes(Math.floor(x) % cells);
    let M = 300, hit = 0.8, falseHit = 0.15, sdMove = 0.2, rand, gauss, robot, parts, steps, last;
    const box = h("div", {}), rN = readout("Steps"), rC = readout("Particles within 1 m of the robot"), rD = readout("Distinct particles after resampling");
    const reset = () => {
      rand = uniform(41); gauss = normal(uniform(42)); robot = 5.5; steps = 0; last = null;
      parts = Array.from({ length: M }, () => cells * rand());
      draw();
    };
    const draw = () => {
      box.replaceChildren(corridor({ cells, doors, robot, particles: parts, bars: [{ values: histogram(parts, cells, cells), name: "share of particles per cell" }],
        label: `${parts.length} particles on the corridor and their share per cell` }));
      const near = parts.filter(x => { const d = Math.abs(x - robot); return Math.min(d, cells - d) <= 1; }).length;
      rN.set(String(steps), "", last ? `last reading: ${last}` : "the particles start spread over the whole corridor: the robot could be anywhere");
      rC.set(`${(100 * near / parts.length).toFixed(0)} %`, near / parts.length > 0.6 ? "" : "warn", near / parts.length > 0.6 ? "localised" : "not yet: several places still fit what was seen");
      rD.set(String(new Set(parts).size), "", "drawn with replacement, heavy particles are copied and light ones vanish");
    };
    const step = () => {
      robot = (robot + 1 + sdMove * gauss() + cells) % cells;
      const seen = rand() < (door(robot) ? hit : falseHit);
      last = seen ? "door" : "wall";
      const sense = x => seen ? (door(x) ? hit : falseHit) : (door(x) ? 1 - hit : 1 - falseHit);
      parts = particleStep(parts, 1, sdMove, sense, cells, rand, gauss).particles;
      steps++; draw();
    };
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      h("div", { class: "buttons" }, h("button", { type: "button", class: "press", onclick: step }, "Move 1 m and sense"),
        h("button", { type: "button", onclick: reset }, "Start again")),
      slider({ label: "Particles M", min: 20, max: 2000, value: M, step: 10, format: v => String(v), onInput: v => { M = v; reset(); } }).el,
      slider({ label: "Motion noise σ [m]", min: 0, max: 0.6, value: sdMove, step: 0.01, format: v => v.toFixed(2), onInput: v => { sdMove = v; } }).el,
      slider({ label: "Sensor sees a door at a door", min: 0.5, max: 0.99, value: hit, step: 0.01, format: v => v.toFixed(2), onInput: v => { hit = v; } }).el,
      slider({ label: "Sensor sees a door at a wall", min: 0.01, max: 0.5, value: falseHit, step: 0.01, format: v => v.toFixed(2), onInput: v => { falseHit = v; } }).el,
      rN.el, rC.el, rD.el,
      h("p", { class: "hint" }, "Each press runs one round of the algorithm on p. 18: sample every particle's move from the motion model (odometry plus noise, p. 20), weight it by p(z|x) of the door sensor, and draw M new particles with replacement, each with probability proportional to its weight (p. 16). Several clusters live side by side, the multiple guess a Kalman filter cannot hold (pp. 4 and 23). With zero motion noise the copies never spread again and the set collapses onto a few values; with very few particles the true place can be lost for good. Changing M starts again; all draws are seeded."))));
    reset();
  },
};
