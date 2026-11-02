// How much an imaging sensor sends (Kubinger 2020, Modul 2, p. 35, and the MC Teil 1, Frage 2): pixels × bytes per
// pixel per image, times images per second. The slides' answer to the flood is to evaluate in the sensor and send
// only features.
import { imageBytes, dataRate, si } from "../core/index.js";
import { h, slider, readout, choice } from "../../../kit/ui/kit.js";
import { lineChart } from "../../../kit/ui/chart.js";
import * as a from "../../../kit/ui/art.js";

const SIZES = [["640x480", "640 × 480"], ["800x600", "800 × 600"], ["1024x768", "1024 × 768"], ["1920x1080", "1920 × 1080"]];

export default {
  id: "imagedata",
  art: () => a.picture("A grid of pixels streaming out of a camera as a wide arrow",
    [0, 1, 2, 3].map(i => a.line([[20 + i * 20, 40], [20 + i * 20, 100]], a.DIM, 2) + a.line([[20, 40 + i * 20], [80, 40 + i * 20]], a.DIM, 2)).join("") +
      a.rect(20, 40, 60, 60, a.INK, 3) + a.arrow(95, 70, 180, 70, a.ACC, 8, 16)),
  mount(root) {
    let size = "800x600", bpp = 3, fps = 25;
    const box = h("div", {}), rB = readout("One image"), rR = readout("The stream");
    const update = () => {
      const [w, ht] = size.split("x").map(Number), fs = Array.from({ length: 61 }, (_, i) => i);
      box.replaceChildren(lineChart({ label: "Data rate over images per second", xLabel: "Images per second", yLabel: "Data rate [Mbit/s]", xMin: 0, xMax: 60, yMin: 0,
        lines: [{ x: fs, y: fs.map(f => dataRate(w, ht, bpp, f) / 1e6) }], marks: [{ x: fps, y: dataRate(w, ht, bpp, fps) / 1e6, shape: "dot" }] }));
      const B = imageBytes(w, ht, bpp);
      rB.set(`${si(B, "B")} (${(B / 1024).toFixed(0)} KiB)`, "", `${w} × ${ht} pixels × ${bpp} byte${bpp > 1 ? "s" : ""}`);
      rR.set(si(dataRate(w, ht, bpp, fps), "bit/s"), "", `${si(B, "B")} × ${fps} per second × 8 bits`);
    };
    root.append(h("div", { class: "stage" }, box, h("div", { class: "controls" },
      choice("Image size", SIZES, size, v => { size = v; update(); }),
      choice("Pixel", [["1", "grey, 8 bit"], ["3", "colour, 3 × 8 bit"]], String(bpp), v => { bpp = Number(v); update(); }),
      slider({ label: "Images per second", unit: "", min: 1, max: 60, value: fps, step: 1, format: x => `${x} /s`, onInput: v => { fps = v; update(); } }),
      rB.el, rR.el,
      h("p", { class: "hint" }, "The slides' example (p. 35): one colour camera of about 0.5 megapixels (800 × 600), about 1.5 MB per image, 25 images a second: about 290 Mbit/s, for one camera. The remedy is a smart sensor that evaluates locally and sends only the features."),
      h("p", { class: "hint" }, "A kilobyte here is 1000 bytes; the MC question counts 1024 (a KiB), so its 1024 × 768 grey image is 768 kB there. The car's buses (p. 36): LIN, CAN, FlexRay, MOST and Ethernet; for cameras also USB, FireWire, CameraLink and Ethernet, with hardly any overlap."))));
    update();
  },
};
