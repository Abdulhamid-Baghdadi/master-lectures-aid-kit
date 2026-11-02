// Vacuum and magnet grippers (Berger 2021, ch. 3, pp. 60–69): a suction cup holds by the difference between the outside
// air and the cup's pressure, so it holds less high up; a magnet holds by A·B²/(2μ0)·(1 − 1/μr).
import { airPressure, suctionForce, cupArea, magnetForce } from "../core/index.js";
import { h, slider, readout } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

export default {
  id: "gripper",
  art: () => a.picture("Four suction cups on a beam holding a sheet, air pressing it up",
    a.line([[30, 40], [170, 40]], a.INK, 4) + [50, 83, 117, 150].map(x => a.line([[x, 40], [x, 70]], a.INK, 3) + a.path(`M${x - 14} 85 L${x - 6} 70 L${x + 6} 70 L${x + 14} 85`, a.INK, 3)).join("") +
      a.rect(25, 86, 150, 12, a.ACC, 3) + [60, 100, 140].map(x => a.arrow(x, 135, x, 104, a.COOL, 2)).join("")),
  mount(root) {
    let height = 0, vac = 0.7, d = 40, z = 4, n3 = 0.8, eta = 0.9, S = 2, B = 1, Am = 4, mur = 1000;
    const box = h("div", {}), rP = readout("Outside air pressure po"), rF = readout("Load the gripper may lift F"), rH = readout("Magnet holding force Fh");
    const update = () => {
      const po = airPressure(height), pu = po - vac * 1e5, F = suctionForce({ po, pu, A: cupArea(d / 1000), n3, eta, z, S });
      // With a pump that holds a set vacuum relative to the outside air, F does not change with height; with a pump
      // that reaches a set absolute pressure it does. Both are drawn.
      const hs = Array.from({ length: 41 }, (_, i) => i * 100), pu0 = airPressure(0) - vac * 1e5;
      box.replaceChildren(lineChart({ label: "The gripper's load over the height above sea level", xLabel: "Height above sea level [m]", yLabel: "Load F [N]", xMin: 0, xMax: 4000, yMin: 0,
        lines: [{ x: hs, y: hs.map(x => suctionForce({ po: airPressure(x), pu: pu0, A: cupArea(d / 1000), n3, eta, z, S })), name: "set absolute cup pressure" },
                { x: hs, y: hs.map(() => F), name: "set vacuum below outside air", cls: "second" }],
        marks: [{ x: height, y: suctionForce({ po, pu: pu0, A: cupArea(d / 1000), n3, eta, z, S }), shape: "dot" }] }));
      rP.set(`${(po / 100).toFixed(0)} mbar`, "", "1013 mbar at sea level, 12.5 mbar less per 100 m (p. 60)");
      rF.set(`${F.toFixed(1)} N`, "", `(po − pu)·A·n3·η·z/S with po − pu = ${vac.toFixed(2)} bar, A = ${(cupArea(d / 1000) * 1e4).toFixed(2)} cm² per cup: ${(F / 9.81).toFixed(1)} kg`);
      rH.set(`${magnetForce({ A: Am * 1e-4, B, mur }).toFixed(0)} N`, "", `A·B²/(2μ0)·(1 − 1/μr) with A = ${Am} cm², B = ${B} T`);
    };
    const sl = (name, unit, min, max, v, step, set, format) => slider({ label: name, unit, min, max, value: v, step, format: format ?? (x => `${x} ${unit}`), onInput: x => { set(x); update(); } }).el;
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      sl("Height above sea level", "m", 0, 4000, height, 50, v => height = v),
      sl("Vacuum po − pu at sea level", "bar", 0.2, 0.9, vac, 0.01, v => vac = v, x => `${x.toFixed(2)} bar`),
      sl("Cup diameter d", "mm", 10, 150, d, 1, v => d = v), sl("Cups z", "", 1, 12, z, 1, v => z = v, x => String(x)),
      sl("Deformation factor n3", "", 0.6, 0.9, n3, 0.01, v => n3 = v, x => x.toFixed(2)), sl("Efficiency η", "", 0.5, 1, eta, 0.01, v => eta = v, x => x.toFixed(2)),
      sl("Safety S", "", 2, 3, S, 0.1, v => S = v, x => x.toFixed(1)),
      rP.el, rF.el,
      h("p", { class: "hint" }, "Going from −0.6 to −0.9 bar raises the force 1.5 times but costs about ten times the energy, so the course's rule of thumb is pu = −0.7 bar (p. 63). Which line of the chart holds depends on the vacuum source: one that keeps a set absolute pressure in the cup loses force with height, as the course's 2000 m example shows (763 mbar)."),
      h("h3", {}, "Magnet gripper (p. 69)"),
      sl("Flux density B", "T", 0.1, 1.6, B, 0.01, v => B = v, x => `${x.toFixed(2)} T`), sl("Pole area A", "cm²", 0.5, 20, Am, 0.1, v => Am = v, x => `${x.toFixed(1)} cm²`),
      sl("Relative permeability μr", "", 2, 5000, mur, 1, v => mur = v, x => String(x)),
      rH.el,
      h("p", { class: "hint" }, "The slide gives B in henry (H); flux density is measured in tesla (T = V·s/m²), the henry being the unit of inductance. The formula holds in SI units: A in m², B in T, μ0 = 4π·10⁻⁷ V·s/(A·m)."))));
    update();
  },
};
