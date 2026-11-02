// The time-of-flight camera (Kubinger 2020, Modul 3, pp. 76–78): each pixel measures the phase of modulated light,
// φ = arctan((A1 − A3)/(A2 − A4)), and the distance d = c·φ/(4π·fmod). The phase wraps after one turn, so beyond
// dmax = λmod/2 the camera reports a near distance for a far object.
import { tofSamples, tofPhase, tofDistance, tofRange, modWavelength, si } from "../core/index.js";
import { h, slider, readout } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

export default {
  id: "tof",
  art: () => a.picture("A sine wave sent and the same wave returning shifted in phase",
    a.path("M20 60 C40 20 60 20 80 60 S120 100 140 60 S180 20 190 40", a.ACC, 3) +
      a.path("M20 105 C30 125 50 125 60 105 S100 65 120 105 S160 145 180 105", a.COOL, 3) + a.arrow(60, 82, 80, 82, a.INK, 2)),
  mount(root) {
    let d = 3, f = 20e6;
    const box = h("div", {}), rA = readout("Samples A1 … A4"), rP = readout("Phase φ"), rD = readout("Reported distance"), rM = readout("Unambiguous range dmax");
    const update = () => {
      const A = tofSamples(d, f), phi = tofPhase(...A), dm = tofRange(f);
      const ds = Array.from({ length: 301 }, (_, i) => i * 30 / 300);
      box.replaceChildren(lineChart({ label: "Reported over true distance: a saw tooth that wraps every dmax", xLabel: "True distance [m]", yLabel: "Reported distance [m]",
        xMin: 0, xMax: 30, yMin: 0, lines: [{ x: ds, y: ds.map(x => tofDistance(tofPhase(...tofSamples(x, f)), f)), name: "the camera" }, { x: [0, 30], y: [0, 30], name: "true", cls: "second" }],
        marks: [{ x: d, y: tofDistance(phi, f), shape: "dot" }] }));
      rA.set(A.map(x => x.toFixed(2)).join(", "), "", "offset 1 (ambient light) and amplitude 1, a model; the offset cancels in both differences");
      rP.set(`${(phi * 180 / Math.PI).toFixed(1)}°`, "", "arctan((A1 − A3)/(A2 − A4)), taken with both signs over the full turn");
      const rep = tofDistance(phi, f);
      rD.set(si(rep, "m"), Math.abs(rep - d) > 1e-6 ? "warn" : "", Math.abs(rep - d) > 1e-6 ? `the object is at ${si(d, "m")}: the phase has wrapped` : "c·φ/(4π·fmod)");
      rM.set(si(dm, "m"), "", `λmod/2 with λmod = c/fmod = ${si(modWavelength(f), "m")}`);
    };
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      slider({ label: "True distance d", unit: "m", min: 0.1, max: 30, value: d, step: 0.01, format: q => `${q.toFixed(2)} m`, onInput: q => { d = q; update(); } }),
      slider({ label: "Modulation frequency fmod", unit: "Hz", min: 5e6, max: 100e6, value: f, log: true, onInput: q => { f = q; update(); } }),
      rA.el, rP.el, rD.el, rM.el,
      h("p", { class: "hint" }, "The slide's example is λmod = 15 m at fmod = 20 kHz (p. 78). That frequency is a slip: c/20 kHz is 15 km; 15 m needs 20 MHz, which gives dmax = 7.5 m. A higher fmod resolves finer but wraps sooner."),
      h("p", { class: "hint" }, "No correspondence problem as with stereo, little computing, cheap and fairly independent of ambient light; but active lighting costs energy, may raise eye safety, and the resolution is low (pp. 78–79). A grey object before a grey wall defeats stereo but not ToF (p. 79)."))));
    update();
  },
};
