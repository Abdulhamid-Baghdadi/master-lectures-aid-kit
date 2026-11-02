// The pinhole camera (Kubinger 2020, Modul 3, pp. 40–44): every scene point reaches the image along a straight ray
// through the projection centre, so u = cx + fx·xc/zc. Seen from above, the ray of the point crosses the image plane;
// moving the point along its ray leaves the image point where it is, which is why one image cannot give depth.
import { project, si } from "../core/index.js";
import { h, s, slider, readout } from "../../../kit/ui/kit.js";
import * as a from "../../../kit/ui/art.js";

const W = 520, H = 360;

export default {
  id: "pinhole",
  art: () => a.picture("Rays from a tree through a pinhole forming an upside-down image behind it",
    a.line([[150, 40], [150, 110]], a.INK, 4) + a.line([[100, 20], [100, 130]], a.INK, 3) + a.line([[40, 55], [40, 95]], a.ACC, 3) +
      a.line([[150, 40], [40, 95]], a.DIM, 2) + a.line([[150, 110], [40, 55]], a.DIM, 2) + a.circle(100, 75, 3, a.ACC, 2, a.ACC)),
  mount(root) {
    let x = 0.6, y = -0.2, z = 3, fx = 800, fy = 800, cx = 512, cy = 384;
    const box = h("div", {}), rU = readout("Image point (u, v)"), rN = readout("On the plane z = 1");
    const update = () => {
      const p = project({ fx, fy, cx, cy }, [x, y, z]);
      // Top view, x across and z up the page, metres; the image plane is drawn one metre out, the plane z = 1.
      const k = 60, ox = W / 2, oy = H - 30, at = (X, Z) => [ox + k * X, oy - k * Z];
      const [px, py] = at(x, z), [ix, iy] = at(x / z, 1), [bx, by] = at(-x / z, -1);
      box.replaceChildren(s("svg", { viewBox: `0 0 ${W} ${H}`, role: "img", class: "chart mech", "aria-label": `Top view: the ray from the point at x = ${x.toFixed(2)} m, z = ${z.toFixed(2)} m through the projection centre` },
        s("line", { x1: at(-4, 1)[0], y1: at(-4, 1)[1], x2: at(4, 1)[0], y2: at(4, 1)[1], class: "axis" }),
        s("text", { x: at(-4, 1)[0] + 4, y: at(-4, 1)[1] - 6, class: "tick" }, "image plane, positive position (z = 1)"),
        s("line", { x1: ox, y1: oy, x2: ox, y2: at(0, 5.3)[1], class: "grid" }),
        s("text", { x: ox + 6, y: at(0, 5.3)[1] + 12, class: "tick" }, "optical axis"),
        s("line", { x1: bx, y1: by, x2: px, y2: py, class: "series" }),
        s("line", { x1: px, y1: py, x2: at(2 * x, 2 * z)[0], y2: at(2 * x, 2 * z)[1], class: "series second" }),
        s("circle", { cx: ox, cy: oy, r: 6, class: "joint" }), s("text", { x: ox + 10, y: oy + 4, class: "tick" }, "Z"),
        s("circle", { cx: px, cy: py, r: 6, class: "mark dot" }), s("text", { x: px + 10, y: py - 8, class: "tick" }, "scene point"),
        s("circle", { cx: ix, cy: iy, r: 5, class: "mark dot" }), s("text", { x: ix + 8, y: iy + 16, class: "tick" }, "xn = x/z")));
      rU.set(p ? `(${p[0].toFixed(1)}, ${p[1].toFixed(1)}) px` : "no image", p ? "" : "warn", p ? `u = ${cx} + ${fx}·${x.toFixed(2)}/${z.toFixed(2)}, v = ${cy} + ${fy}·${y.toFixed(2)}/${z.toFixed(2)}` : "the point is behind the camera");
      rN.set(`(${(x / z).toFixed(3)}, ${(y / z).toFixed(3)})`, "", `scene point ${si(Math.hypot(x, y, z), "m")} from Z`);
    };
    const sl = (label, unit, min, max, v, step, set, fmt) => slider({ label, unit, min, max, value: v, step, format: fmt, onInput: q => { set(q); update(); } });
    const m = q => `${q.toFixed(2)} m`, px = q => `${q.toFixed(0)} px`;
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      sl("Point across xc", "m", -2, 2, x, 0.01, q => x = q, m), sl("Point down yc", "m", -1.5, 1.5, y, 0.01, q => y = q, m),
      sl("Point ahead zc", "m", 0.3, 5, z, 0.01, q => z = q, m),
      sl("Focal length fx", "px", 200, 2000, fx, 10, q => fx = q, px), sl("Focal length fy", "px", 200, 2000, fy, 10, q => fy = q, px),
      sl("Principal point cx", "px", 400, 624, cx, 1, q => cx = q, px), sl("Principal point cy", "px", 300, 468, cy, 1, q => cy = q, px),
      rU.el, rN.el,
      h("p", { class: "hint" }, "Double xc and zc together: the point slides along its ray (dashed) and the image point stays. Every point on that ray gives the same (u, v) (p. 44), so one camera tells the direction, not the distance, unless the object's size is known."),
      h("p", { class: "hint" }, "Behind the pinhole the image stands on its head, mirrored in both axes, a turn of 180° (p. 40); the camera turns it back when reading out, or the sensor is mounted turned. The positive position puts the plane in front of Z and only the signs change (p. 41). fx and fy differ for a rectangular pixel; they hold the focal length in pixels (p. 43)."))));
    update();
  },
};
