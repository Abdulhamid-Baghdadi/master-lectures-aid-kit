// Ranging by echo (Kubinger 2020, Modul 2, pp. 9–17 and 69–73): ultrasound, RADAR and LIDAR all time an echo; what
// differs is the speed of the wave, so the same metre takes milliseconds for sound and nanoseconds for light.
import { C_LIGHT, C_SOUND, echoTime, si } from "../core/index.js";
import { h, slider, readout, choice } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

const MEDIA = { sound: { c: C_SOUND, name: "Ultrasound (sound in air)" }, light: { c: C_LIGHT, name: "RADAR or LIDAR (light speed)" } };

export default {
  id: "ranging",
  art: () => a.picture("A sensor sending a pulse to a wall and the echo coming back",
    a.rect(20, 55, 30, 40, a.INK, 3) + a.line([[170, 25], [170, 125]], a.INK, 4) +
      a.arrow(55, 65, 160, 65, a.ACC, 3) + a.arrow(160, 85, 55, 85, a.COOL, 3)),
  mount(root) {
    let medium = "sound", d = 2;
    const box = h("div", {}), rT = readout("Echo time t = 2d/c"), rC = readout("Wave speed c");
    const update = () => {
      const { c } = MEDIA[medium], ds = Array.from({ length: 101 }, (_, i) => i * (medium === "sound" ? 5 : 200) / 100);
      // Microseconds for light and milliseconds for sound keep the axis readable for both.
      const k = medium === "sound" ? 1e3 : 1e6, unit = medium === "sound" ? "ms" : "µs";
      box.replaceChildren(lineChart({ label: "Echo time over the distance to the object", xLabel: "Distance d [m]", yLabel: `Echo time t [${unit}]`,
        xMin: 0, xMax: ds.at(-1), yMin: 0, lines: [{ x: ds, y: ds.map(x => echoTime(c, x) * k) }],
        marks: [{ x: Math.min(d, ds.at(-1)), y: echoTime(c, Math.min(d, ds.at(-1))) * k, shape: "dot" }] }));
      rT.set(si(echoTime(c, d), "s"), "", `out and back: 2 × ${si(d, "m")} at ${si(c, "m/s")}`);
      rC.set(si(c, "m/s"), "", medium === "sound" ? "c0 = 331.6 m/s, changing with temperature, humidity and air pressure (p. 9)" : "the speed of light, by definition of the metre");
    };
    const dist = slider({ label: "Distance to the object d", unit: "m", min: 0.05, max: 200, value: d, log: true, onInput: v => { d = v; update(); } });
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      choice("Sensor", Object.entries(MEDIA).map(([k, m]) => [k, m.name]), medium, v => { medium = v; update(); }),
      dist, rC.el, rT.el,
      h("p", { class: "hint" }, "Ultrasound parks the car: 4 to 6 sensors at 40 to 400 kHz, cheap and simple but short-ranged, one direction at a time and slow (pp. 9–10). Light is a million times faster, so a LIDAR needs very fast electronics: the Velodyne HDL32 reaches about 120 m with 5 ns pulses at 905 nm (p. 73), an echo time under a microsecond. Try 120 m with each sensor."),
      h("p", { class: "hint" }, "A single-head ultrasound sensor sends and then listens with the same transducer, so it is deaf just after sending: a blind zone close up that the two-head kind avoids (p. 9). A LIDAR needs diffuse reflection; mirrors and glass return nothing (p. 70)."))));
    update();
  },
};
