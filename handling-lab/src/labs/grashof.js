// Grashof's rule (Berger 2021, ch. 4, p. 26, Blatt 30): lmin + lmax < l′ + l″ and some link turns fully; which one
// depends on where the shortest link sits. The path of B shows it: a whole loop, or an arc that turns back.
import { grashof, fourBar, rad } from "../core/index.js";
import { h, readout } from "../../../kit/ui/kit.js";
import * as a from "../../../kit/ui/art.js";
import { lengthSliders, drawing } from "./fourbar.js";

const NAME = { "double crank": "Double crank: crank and rocker both turn fully", "crank-rocker": "Crank-rocker: the shortest link, beside the frame, turns; the other swings",
  "double rocker": "Double rocker: only the coupler, the shortest, turns relative to the others", "triple rocker": "Triple rocker: no link turns fully against any other" };

export default {
  id: "grashof",
  art: () => a.picture("A crank turning a full circle beside a rocker that swings through an arc",
    a.circle(55, 95, 25, a.DIM, 2) + a.line([[55, 95], [72, 77], [140, 55], [150, 110]], a.INK, 3) + a.path("M118 60 A45 45 0 0 1 170 80", a.ACC, 2) +
      a.circle(55, 95, 5, a.ACC) + a.circle(150, 110, 5, a.ACC)),
  mount(root) {
    const dims = { a: 100, r: 30, l: 90, c: 70, phi: rad(60) };
    const box = h("div", {}), rG = readout("lmin + lmax against l′ + l″"), rK = readout("Mechanism"), rT = readout("Does the crank turn?");
    const update = () => {
      const g = grashof([dims.a, dims.r, dims.l, dims.c]);
      box.replaceChildren(drawing(dims).svg);
      rG.set(`${g.lhs.toFixed(0)} ${g.kind === "rotating" ? "<" : g.kind === "rocking" ? ">" : "="} ${g.rhs.toFixed(0)} mm`, g.kind === "change-point" ? "warn" : "",
        g.kind === "rotating" ? "rotating (umlaufend)" : g.kind === "rocking" ? "rocking (nicht umlaufend, schwingend)" : "change point (durchschlagend): the chain can fold flat and go either way");
      rK.set(g.kind === "change-point" ? "Change-point linkage" : g.mechanism, "", g.kind === "change-point" ? "for example the parallel and antiparallel crank" : NAME[g.mechanism]);
      let turns = true;
      for (let i = 0; i < 360 && turns; i++) turns = !!fourBar(dims, rad(i));
      rT.set(turns ? "Yes, all the way" : "No, it stops", turns ? "" : "warn", turns ? "the path of B (dashed) closes" : "past the limits the chain cannot close: the crank has to turn back");
    };
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      ...lengthSliders(dims, update).map(s => s.el), rG.el, rK.el, rT.el,
      h("p", { class: "hint" }, "When the rule holds, fixing each link in turn as the frame gives two crank-rockers, one double crank and one double rocker (ch. 4, p. 26). Try the frame as the shortest link (a double crank, the Zweilagensynthese solutions choose D0 this way) and the coupler as the shortest (a double rocker). For the slider-crank chain the test is the offset: it turns fully when e < lmax − lmin, crank and coupler being the two links (ch. 3, p. 81)."))));
    update();
  },
};
