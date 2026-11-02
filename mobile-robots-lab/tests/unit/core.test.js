// The mobile-robots core against a number printed in the sources (the network summary of CNN, p. 10) or a second route
// (a product of Gaussians, a numerical derivative, a round trip, a Kalman filter for the particles), or by hand.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as T from "../../src/core/index.js";

const near = (a, b, tol, what) => assert.ok(Math.abs(a - b) <= tol, `${what}: ${a} against ${b}`);
const img = rows => ({ w: rows[0].length, h: rows.length, px: rows.flat() });

test("Bayes' rule for the door (Basics, p. 10), worked by hand: 0.6·0.5/(0.6·0.5 + 0.3·0.5) = 2/3", () => {
  near(T.doorPosterior({ hit: 0.6, falseHit: 0.3, prior: 0.5 }), 2 / 3, 1e-12, "p(d|s)");
  near(T.doorPosterior({ hit: 0.5, falseHit: 0.5, prior: 0.3 }), 0.3, 1e-12, "a sensor that cannot tell leaves the prior");
});

test("the histogram filter: prediction keeps the total, correction from a flat belief is Bayes' rule per cell", () => {
  const n = 20, doors = Array.from({ length: n }, (_, i) => [2, 3, 8, 14].includes(i));
  const bel = T.predict(new Array(n).fill(0).map((_, i) => (i === 5 ? 1 : 0)), 3, 0.1);
  near(bel.reduce((s, v) => s + v, 0), 1, 1e-12, "sum");
  near(bel[8], 0.8, 1e-12, "moved 3 cells"); near(bel[7], 0.1, 1e-12, "one short"); near(bel[9], 0.1, 1e-12, "one long");
  const { bel: post } = T.correct(new Array(n).fill(1 / n), T.doorLikelihood(doors, true, 0.6, 0.3));
  // At a door: p(s|d)·(1/n) / (4·0.6/n + 16·0.3/n) = 0.6/7.2.
  near(post[2], 0.6 / 7.2, 1e-12, "door cell"); near(post[0], 0.3 / 7.2, 1e-12, "wall cell");
  assert.throws(() => T.correct([1, 0], [0, 1]), /non-zero false-alarm/);
});

test("the Kalman filter against the product of two Gaussians, worked by hand: μ = 1.12, Σ = 0.6", () => {
  const k = T.kalman({ mu: 0, sigma2: 1, u: 1, z: 1.2, R: 0.5, Q: 1 });
  near(k.muBar, 1, 1e-12, "μ̄"); near(k.sigBar, 1.5, 1e-12, "Σ̄"); near(k.K, 0.6, 1e-12, "K");
  near(k.mu, (1 * 1 + 1.5 * 1.2) / (1.5 + 1), 1e-12, "μ as the product's mean");
  near(k.sigma2, 1.5 * 1 / (1.5 + 1), 1e-12, "Σ as the product's variance");
  const blind = T.kalman({ mu: 0, sigma2: 1, u: 1, z: null, R: 0.5, Q: 1 });
  near(blind.sigma2, 1.5, 1e-12, "without a measurement the variance only grows (EKFLoc, p. 7)");
});

test("odometry (EKF, p. 3): equal wheels drive straight, opposite wheels turn on the spot, worked by hand", () => {
  const o = T.odometry(10, 12, 0.05, 0.3);
  near(o.dd, 0.55, 1e-12, "δd"); near(o.dth, 1 / 3, 1e-12, "δθ");
  const s = T.odometry(5, 5, 0.1, 0.4); near(s.dth, 0, 0, "straight");
  const t = T.odometry(-5, 5, 0.1, 0.4); near(t.dd, 0, 0, "on the spot"); near(t.dth, 2.5, 1e-12, "turn");
  const p = T.move([1, 2, 0], 1, 0); near(p[0], 2, 1e-12, "x"); near(p[1], 2, 1e-12, "y");
  const c = T.icr([0, 0, Math.PI / 2], 2); near(c[0], -2, 1e-12, "ICR x (MR_Kinematik, eq. 15)"); near(c[1], 0, 1e-12, "ICR y");
});

test("the EKF's Jacobian against a numerical derivative of the motion", () => {
  const mu = [0.3, -0.2, 0.7], dd = 0.4, dth = 0.25, G = T.jacobian(mu, dd, dth), h = 1e-6;
  for (let j = 0; j < 3; j++) {
    const a = [...mu], b = [...mu]; a[j] += h; b[j] -= h;
    const ga = T.move(a, dd, dth), gb = T.move(b, dd, dth);
    for (let i = 0; i < 3; i++) near(G[i][j], (ga[i] - gb[i]) / (2 * h), 1e-8, `G${i + 1}${j + 1}`);
  }
  const p = T.ekfPredict(mu, [[0.01, 0, 0], [0, 0.01, 0], [0, 0, 0.02]], dd, dth, [[0, 0, 0], [0, 0, 0], [0, 0, 0]]);
  near(p.Sigma[0][1], p.Sigma[1][0], 1e-15, "symmetric");
});

test("the particle filter, in the linear Gaussian case, agrees with the Kalman filter (μ = 1.12, Σ = 0.6)", () => {
  const u = T.uniform(1), g = T.normal(T.uniform(2)), L = 1000, M = 20000;
  const start = Array.from({ length: M }, () => 500 + g());
  const step = T.particleStep(start, 1, Math.sqrt(0.5), x => T.gaussWeight(501.2, x, 1), L, u, g);
  const m = step.particles.reduce((s, x) => s + x, 0) / M, v = step.particles.reduce((s, x) => s + (x - m) ** 2, 0) / M;
  near(m - 500, 1.12, 0.03, "mean"); near(v, 0.6, 0.03, "variance");
  const again = T.particleStep(start, 1, Math.sqrt(0.5), x => T.gaussWeight(501.2, x, 1), L, T.uniform(1), T.normal(T.uniform(2)));
  assert.notEqual(again.particles[0], undefined);
  assert.throws(() => T.resample([1, 2], [0, 0], u), /weight zero/);
});

test("the seeded generator gives the same numbers every time", () => {
  const a = T.uniform(42), b = T.uniform(42);
  for (let k = 0; k < 5; k++) assert.equal(a(), b());
  const xs = Array.from({ length: 20000 }, T.normal(T.uniform(9)));
  near(xs.reduce((s, x) => s + x, 0) / xs.length, 0, 0.03, "mean 0");
});

test("smoothing (Entrauschen, pp. 7–9): the weights sum to one, the median by eq. 3 for odd and even n", () => {
  near(T.boxKernel(3)[1][1], 1 / 9, 1e-15, "1/(Kw·Kh)");
  near(T.gaussKernel(5, 1.2).flat().reduce((s, v) => s + v, 0), 1, 1e-12, "Gauss");
  assert.equal(T.median([9, 1, 5]), 5); assert.equal(T.median([4, 1, 3, 2]), 2.5);
  const clean = T.scene(), dirty = T.noisy(clean, { salt: 0.1 });
  assert.ok(T.meanError(T.medianFilter(dirty, 3), clean) < T.meanError(T.convolve(dirty, T.boxKernel(3)), clean),
    "the median beats the box on salt-and-pepper noise");
});

test("Sobel (Edges, p. 9) on a ramp of slope 1 gives 8 in x and 0 in y, by hand", () => {
  const ramp = img(Array.from({ length: 5 }, () => [0, 1, 2, 3, 4]));
  const g = T.sobel(ramp);
  assert.equal(g.gx.px[2 * 5 + 2], 8); assert.equal(g.gy.px[2 * 5 + 2], 0);
  near(g.dir.px[12], 0, 1e-15, "the gradient points along +x");
});

test("Canny thins a straight step to an edge at most two pixels wide", () => {
  const step = img(Array.from({ length: 12 }, () => Array.from({ length: 16 }, (_, x) => (x < 8 ? 40 : 200))));
  const c = T.canny(step, { minVal: 100, maxVal: 300 });
  for (let y = 2; y < 10; y++) {
    const row = c.edges.px.slice(y * 16, y * 16 + 16).filter(v => v).length;
    assert.ok(row >= 1 && row <= 2, `row ${y} has ${row} edge pixels`);
  }
});

test("Otsu's idea (Segmentation, pp. 14–15) puts the threshold between the two classes of the noisy scene", () => {
  const two = img([[50, 50, 60, 60, 200, 210, 200, 210]]);
  const h = T.histogramOf(two), f = T.fisherJ(h, 100);
  // μ1 = 55, μ2 = 205, σ1² = σ2² = 25: J = 150²/50 = 450, by hand.
  near(f.J, 450, 1e-9, "J");
  const o = T.otsu(T.histogramOf(T.noisy(T.scene(), { sd: 12 })));
  assert.ok(o.th > 70 && o.th < 180, `threshold ${o.th}`);
});

test("HSV (Segmentation, pp. 24–31): red, green and blue at 0°, 120° and 240°, and every colour comes back", () => {
  assert.equal(T.rgbToHsv(1, 0, 0).H, 0); assert.equal(T.rgbToHsv(0, 1, 0).H, 120); assert.equal(T.rgbToHsv(0, 0, 1).H, 240);
  near(T.rgbToHsv(0.2, 0.4, 0.8).H, 220, 1e-9, "60·(4 + (0.2 − 0.4)/0.6) by hand");
  for (let r = 0; r <= 1; r += 0.25) for (let g = 0; g <= 1; g += 0.25) for (let b = 0; b <= 1; b += 0.25) {
    const { H, S, V } = T.rgbToHsv(r, g, b), back = T.hsvToRgb(H, S, V);
    [r, g, b].forEach((c, i) => near(back[i], c, 1e-12, `(${r}, ${g}, ${b}) channel ${i}`));
  }
  assert.equal(T.excess(190, 40, 70), 270, "2·190 − 40 − 70");
});

// The slide's eq. 19 (Segmentation, p. 31) prints (q, V, t) for h = 2. This is the test that fails with it: a green
// turning cyan, (0, 1, 0.5), would come back with red at 1.
test("the slide's case h = 2 of eq. 19 does not return the colour; (p, V, t) does", () => {
  const { H, S, V } = T.rgbToHsv(0, 1, 0.5);
  const f = H / 60 - 2, q = V * (1 - S * f), p = V * (1 - S);
  assert.ok(Math.abs(q - 0) > 0.4, `with q, red comes back as ${q}`);
  near(p, 0, 1e-12, "with p, red is 0");
  near(T.hsvToRgb(H, S, V)[0], 0, 1e-12, "the lab's eq. 19");
});

test("the motion noise R = V·M·Vᵀ against a numerical derivative of the motion in δd and δθ", () => {
  const mu = [0.2, 0.1, 0.4], dd = 0.5, dth = 0.2, sd = [0.03, 0.05], h = 1e-6;
  const V = [0, 1].map(j => { const e = [0, 0]; e[j] = h; const a = T.move(mu, dd + e[0], dth + e[1]), b = T.move(mu, dd - e[0], dth - e[1]); return a.map((v, i) => (v - b[i]) / (2 * h)); });
  const R = T.motionNoise(mu, dd, dth, sd[0], sd[1]);
  for (let i = 0; i < 3; i++) for (let k = 0; k < 3; k++) near(R[i][k], V[0][i] * V[0][k] * sd[0] ** 2 + V[1][i] * V[1][k] * sd[1] ** 2, 1e-8, `R${i}${k}`);
});

test("the convolution layer: the counts and shapes printed in the network summary of CNN, p. 10", () => {
  assert.equal(T.convParams(7, 7, 3, 64), 9472); assert.equal(T.convParams(1, 1, 64, 64), 4160);
  assert.equal(T.convParams(3, 3, 64, 64), 36928); assert.equal(T.convParams(1, 1, 64, 256), 16640);
  assert.equal(T.bnParams(64), 256); assert.equal(T.bnParams(256), 1024);
  const rows = T.resnetStem();
  assert.deepEqual(rows[0].shape, [486, 646, 3]); assert.deepEqual(rows[1].shape, [240, 320, 64]);
  assert.deepEqual(rows[3].shape, [242, 322, 64]); assert.deepEqual(rows[4].shape, [120, 160, 64]);
  assert.equal(T.denseParams(64, 10), T.convParams(1, 1, 64, 10), "a dense layer is a 1 × 1 convolution");
  const f = T.featureMap(img([[0, 0, 9, 9], [0, 0, 9, 9], [0, 0, 9, 9], [0, 0, 9, 9]]), T.SOBEL_X);
  assert.ok(f.pooled.px.every(v => v >= 0) && f.pooled.w === 2, "ReLU then pooling halves the size");
});

test("stereo and the pinhole (Pose estimation, pp. 10, 23, 27): two projections give the disparity back as depth", () => {
  const cam = { fx: 700, fy: 700 }, X = [0.3, 0.1, 2.5], B = 0.12;
  const uL = T.project(X, cam)[0], uR = T.project([X[0] - B, X[1], X[2]], cam)[0];
  near(T.stereoDepth(B, 700, uL - uR), 2.5, 1e-12, "Z = B·f/D");
  near(T.stereoDepth(0.12, 700, 42), 2, 1e-12, "by hand");
  near(T.flatDepth(0.1, 35, 700), 2, 1e-12, "width/f = real width/Z");
});

test("RANSAC (Pose estimation, p. 38) finds the line through outliers that pull least squares away", () => {
  const pts = T.linePoints({ k: 0.6, d: 1, noise: 0, outliers: 0.3 });
  const r = T.ransac(pts, { tol: 0.05, tau: 0.6, N: 200 });
  near(r.refit.k, 0.6, 1e-9, "k"); near(r.refit.d, 1, 1e-9, "d");
  const ls = T.fitLine(pts);
  assert.ok(Math.abs(ls.k - 0.6) > 0.02 || Math.abs(ls.d - 1) > 0.1, "least squares over all points misses");
});
