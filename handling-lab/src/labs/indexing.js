// The indexing cam (Kurvenschrittgetriebe, Berger 2021, ch. 6, pp. 16–21): a turning cam moves a table on by a step
// φS = 360°/n during part of its turn and holds it still for the rest; rollers per plane nR = 360°·ga/φS. Below it, the
// friction-wheel feed of ch. 2, p. 29.
import { LAWS, indexing, indexStep, feedLength } from "../core/index.js";
import { h, slider, readout, choice } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

export default {
  id: "indexing",
  art: () => a.picture("A round table with eight stations and a stepped curve of its angle over time",
    a.circle(65, 75, 45, a.INK) + Array.from({ length: 8 }, (_, k) => a.circle(65 + 32 * Math.cos(k * Math.PI / 4), 75 + 32 * Math.sin(k * Math.PI / 4), 5, k ? a.DIM : a.ACC, 2)).join("") +
      a.line([[125, 125], [140, 125], [150, 100], [160, 100], [170, 75], [185, 75]], a.ACC, 3)),
  mount(root) {
    let n = 8, ga = 1, beta = 120, key = "quintic", phi = 60, r = 20;
    const box = h("div", {}), rS = readout("Step angle φS"), rN = readout("Rollers per plane nR"), rL = readout("Feed length L");
    const update = () => {
      const { phiS, nR } = indexing(n, ga), step = indexStep(LAWS[key], phiS, beta);
      const x = Array.from({ length: 721 }, (_, i) => i), y = x.map(t => Math.floor(t / 360) * phiS + step(t % 360).angle);
      box.replaceChildren(lineChart({ label: "The table's angle over two turns of the cam", lines: [{ x, y, name: "table angle" }],
        xLabel: "Cam angle [°]", yLabel: "Table angle [°]", xMin: 0, xMax: 720, yMin: 0, yMax: 2 * phiS, yFormat: v => v.toFixed(0) }));
      rS.set(`${phiS.toFixed(1)}°`, "", `360°/${n} stations`);
      const whole = Math.abs(nR - Math.round(nR)) < 1e-9;
      rN.set(whole ? `${Math.round(nR)}` : nR.toFixed(2), whole ? "" : "warn", whole ? `360°·${ga}/${phiS.toFixed(1)}°` : "not a whole number: choose other stations or threads");
      rL.set(`${feedLength(phi, r).toFixed(1)} mm`, "", `(360° − ${phi}°)·π/180·${r} mm per turn of the roller`);
    };
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      slider({ label: "Stations n", min: 2, max: 24, value: n, step: 1, format: v => String(v), onInput: v => { n = v; update(); } }).el,
      slider({ label: "Threads of the cam ga", min: 1, max: 3, value: ga, step: 1, format: v => String(v), onInput: v => { ga = v; update(); } }).el,
      slider({ label: "Indexing part of the turn β", unit: "°", min: 60, max: 330, value: beta, step: 5, format: v => `${v}°`, onInput: v => { beta = v; update(); } }).el,
      choice("Law of the step", Object.entries(LAWS).map(([k, l]) => [k, l.name.split(",")[0]]), key, v => { key = v; update(); }),
      rS.el, rN.el,
      h("p", { class: "hint" }, "Ch. 6, p. 19 works an example: two stations and a two-thread cam, φS = 180° and nR = 360·2/180 = 4. The course uses 1 to 8 (12) stations, step angles from 360° down to 45° (30°); for small steps the cam takes more threads. The step itself is a rest-in-rest motion law, as in the motion-laws lab: the table rests while the cam turns through 360° − β."),
      h("h3", {}, "Friction-wheel feed (ch. 2, p. 29)"),
      slider({ label: "Flat of the roller φ", unit: "°", min: 0, max: 300, value: phi, step: 1, format: v => `${v}°`, onInput: v => { phi = v; update(); } }).el,
      slider({ label: "Roller radius r", unit: "mm", min: 5, max: 80, value: r, step: 1, format: v => `${v} mm`, onInput: v => { r = v; update(); } }).el,
      rL.el)));
    update();
  },
};
