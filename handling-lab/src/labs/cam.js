// The disc cam (Berger 2021, ch. 6, pp. 28–43): a motion law becomes a cam profile. The base circle sets the
// transmission angle, the pitch curve's smallest radius of curvature limits the roller (rR ≤ 0.7·ρmin, p. 42), and a
// roller as big as ρmin cuts a point into the profile.
import { LAWS, cam, turned, characteristic, deg, rad } from "../core/index.js";
import { h, slider, readout, choice } from "../../../kit/ui/kit.js";
import * as a from "../../../kit/ui/art.js";
import { view, shape, trace, ring, link, joint, ground, label } from "./draw.js";

export default {
  id: "cam",
  art: () => a.picture("A pear-shaped disc cam under a roller follower on a vertical stem",
    a.path("M100 135 C60 135 55 95 70 75 C85 55 115 55 130 75 C145 95 140 135 100 135", a.ACC, 3) + a.circle(100, 105, 4, a.INK) + a.circle(100, 50, 10, a.INK) + a.line([[100, 40], [100, 12]], a.INK, 4)),
  mount(root) {
    let key = "quintic", rG = 40, rR = 10, sH = 30, phiP = 120, phiR = 60, phiN = 120, turn = 60;
    const box = h("div", {}), rM = readout("Smallest transmission angle μmin"), rR2 = readout("Smallest ρ of the pitch curve"), rV = readout("Peak follower slope s′max");
    const update = () => {
      const dims = { rG, rR, sH, phiP: rad(phiP), phiR1: rad(phiR), phiN: rad(phiN) }, c = cam(LAWS[key], dims), C = characteristic(LAWS[key]);
      const t = rad(turn), rot = p => turned(p, t);
      const i = Math.round(turn / 360 * c.pts.length) % c.pts.length, s = c.pts[i].s, R = rG + rR + s;
      const big = rG + rR + sH + 15;
      box.replaceChildren(view([-big, -big, big, big + 40], `A disc cam turned ${turn}°, the roller lifted ${s.toFixed(1)} mm`, [
        shape(c.profile.map(rot), "cam"), trace(c.pts.map(p => rot(p.pitch)), "faint"), ring([0, 0], rG, "grid"),
        ring([0, R], rR, "joint"), link([[0, R], [0, R + 40]]), joint([0, R]), ground([0, 0]), label([0, R + 40], `s = ${s.toFixed(1)} mm`, 10, 0)]));
      rM.set(`${deg(c.muMin.mu).toFixed(1)}°`, deg(c.muMin.mu) < 45 ? "warn" : "", `at a cam angle of ${deg(c.muMin.phi).toFixed(0)}°; a larger base circle raises it`);
      rR2.set(`${c.rhoMin.rho.toFixed(1)} mm`, c.cutsUnder ? "danger" : rR > c.rollerAdvice ? "warn" : "",
        c.cutsUnder ? "the roller is as big as ρmin: the profile gets a point and the lift is lost (p. 42)" : `roller up to 0.7·ρmin = ${c.rollerAdvice.toFixed(1)} mm advised; yours ${rR} mm`);
      rV.set(`${(sH * C.Cv.value / rad(phiP)).toFixed(1)} mm/rad`, "", `sH·Cv/φP = ${sH}·${C.Cv.value.toFixed(3)}/${rad(phiP).toFixed(3)} (p. 35); times ω gives vBmax`);
    };
    const sl = (name, unit, min, max, v, set) => slider({ label: name, unit, min, max, value: v, step: 1, format: x => `${x} ${unit}`, onInput: x => { set(x); update(); } }).el;
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      choice("Law of rise and return", Object.entries(LAWS).map(([k, l]) => [k, l.name.split(",")[0]]), key, v => { key = v; update(); }),
      sl("Cam turned", "°", 0, 359, turn, v => turn = v), sl("Base circle rG", "mm", 10, 100, rG, v => rG = v), sl("Roller rR", "mm", 2, 40, rR, v => rR = v),
      sl("Stroke sH", "mm", 5, 80, sH, v => sH = v), sl("Rise angle φP", "°", 30, 200, phiP, v => phiP = Math.min(v, 360 - phiR - phiN)),
      sl("Dwell at the top", "°", 0, 180, phiR, v => phiR = Math.min(v, 360 - phiP - phiN)), sl("Return angle φN", "°", 30, 200, phiN, v => phiN = Math.min(v, 360 - phiP - phiR)),
      rM.el, rR2.el, rV.el,
      h("p", { class: "hint" }, "A centred roller follower on a straight guide, the simplest of the course's cams. The roller's centre runs on the pitch curve (dashed); the cam's surface lies a roller radius inside it, ρA = ρB − rR. Shorten the rise angle or lengthen the stroke and watch μmin fall and ρmin shrink. The transmission angle here comes from tan α = s′/(rG + rR + s), worked from the definition on p. 32; the course finds rG graphically with the Flocke method (pp. 34–36)."))));
    update();
  },
};
