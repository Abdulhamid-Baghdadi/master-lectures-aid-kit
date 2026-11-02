// The sensors core against a number printed in Kubinger (2020) or Intel (2018), or a second route (a round trip, a
// second formula for the same quantity, a case fixed by definition). Pages are PDF pages of the slides' file.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as T from "../../src/core/index.js";

const near = (a, b, tol, what) => assert.ok(Math.abs(a - b) <= tol, `${what}: ${a} against ${b}`);
const deg = r => r * 180 / Math.PI;
const cam = { fx: 800, fy: 780, cx: 512, cy: 384 };

test("echo ranging: c0 = 331.6 m/s (p. 9); out and back halves the path, both ways round", () => {
  assert.equal(T.C_SOUND, 331.6);
  near(T.echoDistance(T.C_SOUND, T.echoTime(T.C_SOUND, 1.5)), 1.5, 1e-12, "round trip");
  // The ToF formula of p. 77 at one full turn of phase must equal c·t/2 with t one modulation period.
  near(T.tofDistance(2 * Math.PI, 20e6), T.echoDistance(T.C_LIGHT, 1 / 20e6), 1e-12, "same halving");
});

test("ToF: λmod = 15 m at fmod = 20 MHz and dmax = λmod/2 (p. 78; the slide prints 20 kHz, a slip)", () => {
  near(T.modWavelength(20e6), 15, 0.02, "λmod");
  near(T.tofRange(20e6), 7.5, 0.01, "dmax");
  // At the slide's 20 kHz, λmod would be 15 km, not 15 m.
  near(T.modWavelength(20e3), 15e3, 20, "20 kHz");
});

test("ToF: the four samples give the distance back inside dmax, and fold it beyond", () => {
  for (const d of [0.4, 2, 5.5, 7.2]) near(T.tofReported(d, 20e6), d, 1e-9, `d = ${d}`);
  near(T.tofReported(9, 20e6), 9 - T.tofRange(20e6), 1e-9, "9 m reads as 9 − dmax");
  near(T.tofPhase(1, 0, 1, 2), Math.PI, 1e-12, "A2 − A4 < 0, A1 = A3: φ = π");
});

test("image data: 1024 × 768 grey at 8 bit is 768 KiB (MC Teil 1, Frage 2); 800 × 600 colour at 25/s is ca. 290 Mbit/s (p. 35)", () => {
  assert.equal(T.imageBytes(1024, 768, 1), 768 * 1024);
  near(T.imageBytes(800, 600, 3), 1.5e6, 0.1e6, "ca. 1.5 MB per image");
  near(T.dataRate(800, 600, 3, 25), 290e6, 3e6, "ca. 290 Mbit/s");
});

test("pinhole: the scalar form of p. 43 and K of p. 44 agree, and K⁻¹ brings the point back", () => {
  const X = [0.3, -0.2, 2.5], [u, v] = T.project(cam, X);
  const [us, vs, s] = T.mulV(T.K(cam), X);
  near(us / s, u, 1e-9, "u"); near(vs / s, v, 1e-9, "v");
  T.backProject(cam, [u, v], 2.5).forEach((c, i) => near(c, X[i], 1e-12, `axis ${i}`));
  const I = T.mulM(T.K(cam), T.Kinv(cam));
  I.forEach((row, i) => row.forEach((c, j) => near(c, i === j ? 1 : 0, 1e-12, `KK⁻¹[${i}][${j}]`)));
  assert.equal(T.project(cam, [0, 0, -1]), null, "behind the camera");
  // The principal point is the image of the optical axis (p. 42).
  assert.deepEqual(T.project(cam, [0, 0, 3]), [512, 384]);
});

test("extrinsics: P = K·(R|t) gives the same point as R and t then the pinhole, and xw = Rᵀxc − Rᵀt undoes it (pp. 45–46)", () => {
  const R = T.mulM(T.rotY(0.3), T.rotX(-0.1)), t = [0.1, 0.05, 1.2], X = [0.4, 0.2, 3];
  const a = T.projectWorld(cam, R, t, X), b = T.project(cam, T.toCamera(R, t, X));
  near(a[0], b[0], 1e-9, "u"); near(a[1], b[1], 1e-9, "v");
  T.toWorld(R, t, T.toCamera(R, t, X)).forEach((c, i) => near(c, X[i], 1e-12, `axis ${i}`));
  const RtR = T.mulM(T.transpose(R), R);
  RtR.forEach((row, i) => row.forEach((c, j) => near(c, i === j ? 1 : 0, 1e-12, "Rᵀ = R⁻¹")));
});

test("distortion (p. 49): no coefficients, no change; radial keeps the direction; tangential matches the slide's terms", () => {
  assert.deepEqual(T.distort([0.3, -0.2], {}), [0.3, -0.2]);
  const [xd, yd] = T.distort([0.3, -0.2], { k1: -0.25, k2: 0.05 });
  near(xd / yd, 0.3 / -0.2, 1e-12, "radial keeps the ray's direction");
  const r2 = 0.13, f = 1 - 0.25 * r2 + 0.05 * r2 * r2;
  near(xd, 0.3 * f, 1e-12, "by hand");
  const [xt, yt] = T.distort([0.3, -0.2], { p1: 0.01, p2: -0.02 });
  near(xt, 0.3 + 0.01 * 2 * 0.3 * -0.2 - 0.02 * (r2 + 2 * 0.09), 1e-12, "xd by hand");
  near(yt, -0.2 + 0.01 * (r2 + 2 * 0.04) - 0.02 * 2 * 0.3 * -0.2, 1e-12, "yd by hand");
  assert.deepEqual(T.distortedPixel(cam, [512, 384], { k1: -0.3 }), [512, 384], "the principal point never moves");
});

test("field of view: p. 87 prints 75.0° × 59.8°, 28.7° × 21.7° and 99.5° × 83.0° for f = 4, 12 and 2.6 mm on 1024 × 768 px of 6 µm", () => {
  const fv = (n, f) => deg(T.fov(n, 6e-6, f));
  // The slide's vertical values are cut, not rounded (59.86° prints as 59.8°): a tolerance of 0.1°.
  for (const [f, h, v] of [[4e-3, 75.0, 59.8], [12e-3, 28.7, 21.7], [2.6e-3, 99.5, 83.0]]) {
    near(fv(1024, f), h, 0.1, `FOVh at ${f}`); near(fv(768, f), v, 0.1, `FOVv at ${f}`);
  }
});

test("stereo depth: the table of p. 87 is zc = b·f/d with a pixel of 7.68 µm, not the 6 µm it states (a slip, checked here)", () => {
  const rows = [[4e-3, 0.45, 11, 200, 1.17, 21.31], [12e-3, 0.1, 2, 500, 0.31, 78.13], [2.6e-3, 0.1, 10, 100, 0.34, 3.39], [4e-3, 2, 10, 350, 2.98, 104.17]];
  for (const [f, b, dMin, dMax, zMin, zMax] of rows) {
    const r = T.range(b, f / 7.68e-6, dMin, dMax);
    near(r.zMin, zMin, 0.006, `zmin, f = ${f}, b = ${b}`); near(r.zMax, zMax, 0.006, `zmax, f = ${f}, b = ${b}`);
    // With the stated 6 µm every distance is 1.28 times larger.
    near(T.range(b, f / 6e-6, dMin, dMax).zMax / zMax, 1.28, 0.002, "the 6 µm route");
  }
});

test("stereo: triangulating two pinhole images gives the depth back; the depth step grows as z²", () => {
  const b = 0.12, X = [0.2, 0.1, 4];
  const uL = T.project(cam, X)[0], uR = T.project(cam, [X[0] - b, X[1], X[2]])[0];
  near(T.depth(b, cam.fx, uL - uR), 4, 1e-9, "z from d");
  const s2 = T.depthStep(b, 800, 2), s4 = T.depthStep(b, 800, 4);
  near(s4 / s2, 4, 0.1, "twice the distance, four times the step");
});

test("SAD and SSD (p. 87) find the shift of a shifted row; a flat row has no unique match", () => {
  const left = [10, 10, 12, 40, 90, 60, 20, 15, 15, 30, 70, 30, 10, 10, 10, 10];
  const right = [...left.slice(3), 10, 10, 10];
  assert.equal(T.match(left, right, 8, 2, 5).best, 3);
  assert.equal(T.match(left, right, 8, 2, 5, T.ssd).best, 3);
  assert.equal(T.sad([1, 2, 3], [2, 2, 5]), 3); assert.equal(T.ssd([1, 2, 3], [2, 2, 5]), 5);
  assert.equal(T.match(Array(16).fill(50), Array(16).fill(50), 8, 2, 5).unique, false, "a white wall");
});

test("colour (pp. 63–65): primaries and their mixes by definition; HSI and HSV agree on their hue", () => {
  assert.deepEqual(T.hsv(1, 0, 0), { H: 0, S: 1, V: 1 });
  assert.equal(T.hsi(0.5, 0.5, 0.5).H, null, "grey has no hue");
  assert.equal(T.hsi(0, 0, 0).S, null, "black has no saturation");
  for (const [rgb, H] of [[[1, 1, 0], 1 / 6], [[0, 1, 0], 1 / 3], [[0, 1, 1], 1 / 2], [[0, 0, 1], 2 / 3], [[1, 0, 1], 5 / 6]]) {
    near(T.hsi(...rgb).H, H, 1e-12, `HSI ${rgb}`); near(T.hsv(...rgb).H, H, 1e-12, `HSV ${rgb}`);
  }
  near(T.luma(1, 1, 1), 1, 1e-12, "the weights add to 1");
  near(T.hsi(0.2, 0.4, 0.9).I, T.meanGrey(0.2, 0.4, 0.9), 1e-12, "I is the mean grey");
});

test("Bayer (pp. 58–59): a uniform patch comes back exactly through either filter", () => {
  const rgb = [0.7, 0.4, 0.2];
  assert.deepEqual(T.bayerPrimary(T.primaryCell(...rgb)), rgb);
  T.bayerComplementary(T.complementaryCell(...rgb)).forEach((c, i) => near(c, rgb[i], 1e-12, `channel ${i}`));
});

test("invalid depth band (Intel 2018, p. 57): its two formulas agree when F = HRes/(2·tan(HFOV/2))", () => {
  const B = 0.055, Z = 1, hfov = 65 * Math.PI / 180, hres = 1280, F = hres / (2 * Math.tan(hfov / 2));
  near(hres * T.bandRatio(B, Z, hfov), T.bandPixels(B, F, Z), 1e-9, "pixels");
});
