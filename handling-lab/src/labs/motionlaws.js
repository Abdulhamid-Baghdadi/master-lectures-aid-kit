// Normalised motion laws (Berger 2021, ch. 5, pp. 21–35): the output follows y = yH·f(x/xP), and the law's
// characteristic values Cv, Ca, Cj and CM scale its peak speed, acceleration, jerk and torque. A 5th-order polynomial is
// fitted to any end speed and acceleration (pp. 34–35), as the Übungen 5_1 and 5_2 do.
import { LAWS, quintic, polynomial, characteristic, peaks, rad } from "../core/index.js";
import { h, slider, readout, choice } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

export default {
  id: "motionlaws",
  art: () => a.picture("An S-shaped lift curve with its bell-shaped speed beneath",
    a.path("M20 120 C80 120 120 30 180 30", a.INK, 3) + a.path("M20 125 C60 125 70 70 100 70 C130 70 140 125 180 125", a.ACC, 2) + a.line([[20, 135], [180, 135]], a.DIM, 2)),
  mount(root) {
    let key = "quintic", v1 = 2 / 3, a1 = -32 / 9, yH = 45, xP = 120, rpm = 50;
    const box = h("div", {}), rC = readout("Cv and Ca"), rJ = readout("Cj and CM"), rF = readout("f(z)"), rY = readout("Peak output speed and acceleration");
    const custom = h("div", { class: "sub" },
      slider({ label: "End speed f′(1)", min: 0, max: 3, value: v1, step: 0.01, format: v => v.toFixed(3), onInput: v => { v1 = v; update(); } }).el,
      slider({ label: "End acceleration f″(1)", min: -8, max: 8, value: a1, step: 0.01, format: v => v.toFixed(3), onInput: v => { a1 = v; update(); } }).el);
    const update = () => {
      custom.hidden = key !== "fit";
      const law = key === "fit" ? polynomial(quintic({ f1: 1, v1, a1 })) : LAWS[key], C = characteristic(law);
      const z = Array.from({ length: 201 }, (_, i) => i / 200);
      box.replaceChildren(lineChart({ label: "The law and its first two derivatives over the normalised drive angle", xLabel: "z = x/xP [1]", yLabel: "f, f′, f″/4 [1]", xMin: 0, xMax: 1,
        xFormat: v => v.toFixed(1), lines: [{ x: z, y: z.map(law.f), name: "f" }, { x: z, y: z.map(law.v), name: "f′", cls: "second" }, { x: z, y: z.map(t => law.a(t) / 4), name: "f″/4", cls: "third" }],
        marks: [{ x: C.Cv.z, y: C.Cv.value, shape: "o" }, { x: C.Ca.z, y: law.a(C.Ca.z) / 4, shape: "o" }] }));
      rC.set(`Cv = ${C.Cv.value.toFixed(3)}, Ca = ${C.Ca.value.toFixed(3)}`, "", `at z = ${C.Cv.z.toFixed(3)} and z = ${C.Ca.z.toFixed(3)}`);
      rJ.set(`Cj = ${C.Cj.value.toFixed(2)}, CM = ${C.CM.value.toFixed(3)}`, "", `CM at z = ${C.CM.z.toFixed(4)}`);
      rF.set(key === "fit" ? law.coefficients.slice(1).map((c, i) => `${c >= 0 && i ? "+" : ""}${c.toFixed(3)}z${"¹²³⁴⁵"[i]}`).join(" ") : law.name.split(", ")[1] ?? law.name, "",
        key === "fit" ? `f(0) = f′(0) = f″(0) = 0, f(1) = 1; end values as set` : "");
      const w = 2 * Math.PI * rpm / 60, p = peaks(C, rad(yH), rad(xP), w);
      rY.set(`${p.v.toFixed(2)} s⁻¹, ${p.a.toFixed(1)} s⁻²`, "", `ω = 2π·${rpm}/60 = ${w.toFixed(3)} s⁻¹; Cv·yH/xP·ω and Ca·yH/xP²·ω², angles in radians`);
    };
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      choice("Law", [...Object.entries(LAWS).map(([k, l]) => [k, l.name.split(",")[0]]), ["fit", "5th-order fit to end values"]], key, v => { key = v; update(); }),
      custom,
      slider({ label: "Output stroke yH", unit: "°", min: 5, max: 180, value: yH, step: 1, format: v => `${v}°`, onInput: v => { yH = v; update(); } }).el,
      slider({ label: "Drive angle xP", unit: "°", min: 10, max: 360, value: xP, step: 1, format: v => `${v}°`, onInput: v => { xP = v; update(); } }).el,
      slider({ label: "Drive speed n", unit: "rpm", min: 1, max: 300, value: rpm, step: 1, format: v => `${v} rpm`, onInput: v => { rpm = v; update(); } }).el,
      rF.el, rC.el, rJ.el, rY.el,
      h("p", { class: "hint" }, "Rest-in-rest laws start and end with f′ = 0: the 3rd power jumps in acceleration at its ends (f″ = 6 at z = 0), the 5th and 7th powers and Bestehorn's sine do not. A smaller Cv means a slower peak speed, a smaller Ca smaller forces, a smaller CM a smaller drive torque. The 5th-order fit starts with the data of Übung 5_2 (f′(1) = 2/3, f″(1) = −32/9): it gives 50/9 z³ − 61/9 z⁴ + 20/9 z⁵ and Cv = 1.587. Übung 5_3's solution prints ω = 5.54 s⁻¹ for 50 rpm; 2π·50/60 is 5.236 s⁻¹, so its peaks are 5.24 s⁻¹ and 104.7 s⁻², not 5.54 and 117.23."))));
    update();
  },
};
