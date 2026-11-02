// The discrete Bayes filter on a corridor (Wöber, MuS 1 Basics, pp. 9–21): the belief over 20 cells moves with the
// robot and blurs (prediction), then a door sensor sharpens it (correction, Bayes' rule of p. 10 in every cell).
import { predict, correct, doorLikelihood, uniform, CORRIDOR } from "../core/index.js";
import { h, slider, readout } from "../../../kit/ui/kit.js";
import * as a from "../../../kit/ui/art.js";
import { corridor } from "./draw.js";

export default {
  id: "histogram",
  art: () => a.picture("A corridor with doors and a belief drawn as bars, highest in front of two doors",
    [20, 40, 100, 160].map(x => a.rect(x, 110, 18, 22, a.ACC, 2)).join("") + a.line([[10, 105], [190, 105]], a.DIM, 2) +
      [[20, 50], [40, 45], [100, 70], [160, 80]].map(([x, hgt]) => a.rect(x + 3, 105 - hgt, 12, hgt, a.INK, 2, a.INK)).join("") +
      [60, 80, 120, 140, 180].map(x => a.rect(x + 3, 95, 12, 10, a.DIM, 2)).join("")),
  mount(root) {
    const { cells, doors } = CORRIDOR, isDoor = Array.from({ length: cells }, (_, i) => doors.includes(i));
    let hit = 0.6, falseHit = 0.3, slip = 0.1, bel, belBar, robot, rand, last, eta;
    const box = h("div", {}), rR = readout("Last reading"), rB = readout("Most likely cell"), rE = readout("Normaliser η");
    const reset = () => { rand = uniform(17); robot = 6; bel = new Array(cells).fill(1 / cells); belBar = null; last = "none yet"; eta = null; draw(); };
    const draw = () => {
      box.replaceChildren(corridor({ cells, doors, robot: robot + 0.5, label: "The corridor's belief over its 20 cells, with the doors drawn below",
        bars: [...(belBar ? [{ values: belBar, cls: "prior", name: "prediction bel̄" }] : []), { values: bel, name: "belief bel" }] }));
      const k = bel.indexOf(Math.max(...bel));
      rR.set(last, "", "a door sensor: reports a door with p(s|d) in front of one, and falsely with p(s|¬d) in front of a wall");
      rB.set(`cell ${k} with ${(100 * bel[k]).toFixed(1)} %`, k === robot ? "" : "warn", k === robot ? "the robot is there" : `the robot is in cell ${robot}`);
      rE.set(eta === null ? "—" : eta.toFixed(3), "", "η = 1/Σ p(z|x)·bel̄(x): what makes the belief sum to one again (Basics, p. 7)");
    };
    const moveOn = () => {
      // The true robot slips like the model says: one cell short or long with probability `slip` each.
      const r = rand(), step = r < slip ? 0 : r < 2 * slip ? 2 : 1;
      robot = (robot + step) % cells;
      belBar = predict(bel, 1, slip); bel = belBar; eta = null; draw();
    };
    const sense = () => {
      const seen = rand() < (isDoor[robot] ? hit : falseHit);
      last = seen ? "door" : "wall";
      belBar = bel;
      ({ bel, eta } = correct(bel, doorLikelihood(isDoor, seen, hit, falseHit))); draw();
    };
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      h("div", { class: "buttons" }, h("button", { type: "button", class: "press", onclick: moveOn }, "Move 1 m"),
        h("button", { type: "button", class: "press", onclick: sense }, "Sense"),
        h("button", { type: "button", onclick: reset }, "Start again")),
      slider({ label: "Sensor sees a door at a door, p(s|d)", min: 0.5, max: 0.99, value: hit, step: 0.01, format: v => v.toFixed(2), onInput: v => { hit = v; } }).el,
      slider({ label: "Sensor sees a door at a wall, p(s|¬d)", min: 0.01, max: 0.5, value: falseHit, step: 0.01, format: v => v.toFixed(2), onInput: v => { falseHit = v; } }).el,
      slider({ label: "Wheel slip, one cell short or long", min: 0, max: 0.3, value: slip, step: 0.01, format: v => v.toFixed(2), onInput: v => { slip = v; } }).el,
      rR.el, rB.el, rE.el,
      h("p", { class: "hint" }, "Start knowing nothing: every cell 1/20. Sense, move, sense again. Each move blurs the belief (the prediction, line 3 of the algorithm on p. 21), each reading multiplies it by p(z|x) and normalises (line 4). Four doors in two groups make the belief split into several peaks before it settles: one hypothesis per place that fits what was seen. The corridor is closed into a ring; the robot, its slips and the sensor's answers come from a seeded generator, so a fresh start replays the same run."))));
    reset();
  },
};
