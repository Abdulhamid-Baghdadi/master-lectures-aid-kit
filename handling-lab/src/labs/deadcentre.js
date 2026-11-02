// Dead-centre synthesis of the crank-rocker (Berger 2021, ch. 4, pp. 97–102, 4.3.4.1): choose where the rocker's two
// end positions lie, and the crank and coupler follow, since at the dead centres crank and coupler are in line:
// |A0Ba| = l + r stretched, |A0Bi| = l − r folded. The crank's turn φ0 between them sets the ratio of the strokes.
import { synthesise, deadCentres, minTransmission, deg, rad } from "../core/index.js";
import { h, slider, readout } from "../../../kit/ui/kit.js";
import * as a from "../../../kit/ui/art.js";
import { view, link, ground, joint, label, ring, dot } from "./draw.js";

export default {
  id: "deadcentre",
  art: () => a.picture("A rocker drawn in its two end positions with the crank circle between them",
    a.circle(60, 100, 22, a.DIM, 2) + a.line([[150, 115], [125, 45]], a.INK, 3) + a.line([[150, 115], [170, 50]], a.INK, 3, "6 5") +
      a.line([[60, 100], [125, 45]], a.ACC, 2) + a.line([[60, 100], [170, 50]], a.COOL, 2) + a.circle(150, 115, 5, a.ACC) + a.circle(60, 100, 5, a.ACC)),
  mount(root) {
    let A = 100, c = 60, psiA = rad(70), psi0 = rad(50);
    const box = h("div", {}), rL = readout("Crank r / coupler l"), rP = readout("Crank turn φ0, working stroke"), rQ = readout("Time ratio φ0 : (360° − φ0)"), rM = readout("Smallest transmission angle");
    const update = () => {
      const { r, l, Ba, Bi } = synthesise({ a: A, c, psiA, psi0 });
      const ok = r > 0 && l > r, d = ok ? deadCentres({ a: A, r, l, c }) : null;
      const branch = d && Math.hypot(d.Ba[0] - Ba[0], d.Ba[1] - Ba[1]) < 1e-6 ? 1 : -1, dd = ok ? deadCentres({ a: A, r, l, c }, branch) : null;
      const Ai = ok ? [-r * Bi[0] / Math.hypot(...Bi), -r * Bi[1] / Math.hypot(...Bi)] : null, Aa = ok ? [r * Ba[0] / Math.hypot(...Ba), r * Ba[1] / Math.hypot(...Ba)] : null;
      box.replaceChildren(view([-80, -60, A + c + 30, c + 60], "The crank-rocker in its inner (folded) and outer (stretched) dead centre", [
        ring([A, 0], c), ok ? ring([0, 0], r) : null, link([[0, 0], [A, 0]], "faint"),
        link([[A, 0], Bi], "second"), link([[A, 0], Ba]), ok ? link([Ai, Bi], "second") : null, ok ? link([[0, 0], Aa, Ba]) : null, ok ? link([[0, 0], Ai], "second") : null,
        joint(Ba), joint(Bi), ok ? joint(Aa) : null, ok ? joint(Ai) : null, ground([0, 0]), ground([A, 0]),
        label(Ba, "Ba (outer)"), label(Bi, "Bi (inner)", 8, 16), label([0, 0], "A0", -26, 20), label([A, 0], "B0", 8, 20), dot(Ba)]));
      if (!ok) { [rL, rP, rQ, rM].forEach(x => x.set("—", "warn", "")); rL.set("No crank", "warn", "the inner position must lie closer to A0 than the outer one: swing the other way or shorten the rocker"); return; }
      rL.set(`${r.toFixed(1)} / ${l.toFixed(1)} mm`, "", `(|A0Ba| ∓ |A0Bi|)/2 = (${Math.hypot(...Ba).toFixed(1)} ∓ ${Math.hypot(...Bi).toFixed(1)})/2`);
      rP.set(`${deg(dd.phi0).toFixed(1)}°`, "", `the return takes ${(360 - deg(dd.phi0)).toFixed(1)}°`);
      rQ.set(dd.ratio.toFixed(3), "", dd.ratio > 1 ? "the return stroke is the quicker one" : "the working stroke is the quicker one");
      const m = minTransmission({ a: A, r, l, c }, branch);
      rM.set(`${deg(m.mu).toFixed(1)}°`, "", `at φ = ${deg(m.phi).toFixed(0)}°`);
    };
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      slider({ label: "Frame a = A0B0", unit: "mm", min: 40, max: 160, value: A, step: 1, format: v => `${v} mm`, onInput: v => { A = v; update(); } }).el,
      slider({ label: "Rocker c = B0B", unit: "mm", min: 20, max: 140, value: c, step: 1, format: v => `${v} mm`, onInput: v => { c = v; update(); } }).el,
      slider({ label: "Outer position of the rocker", unit: "°", min: 0, max: 180, value: deg(psiA), step: 1, format: v => `${v}°`, onInput: v => { psiA = rad(v); update(); } }).el,
      slider({ label: "Rocker swing ψ0", unit: "°", min: 5, max: 120, value: deg(psi0), step: 1, format: v => `${v}°`, onInput: v => { psi0 = rad(v); update(); } }).el,
      rL.el, rP.el, rQ.el, rM.el,
      h("p", { class: "hint" }, "The course goes the other way, by drawing: given A0, B0, φ0 and ψ0 it finds the pole P from the angles φ0/2 and ψ0/2 and draws the circles on which Ba may lie (ch. 4, pp. 97–102). Here you place Ba and Bi and read off φ0, so you can search for a target: Kap. 4 Aufgabe 5 asks for φ0 = 160° with ψ0 = 70°. Among the solutions, pick the one with the largest μmin, as the course recommends. The crank turns counter-clockwise; φ0 is measured from the inner to the outer position."))));
    update();
  },
};
