// A convolution layer worked by hand (Thalhammer 2021, MuS 2, CNN): its weights, its output size, and one small
// feature map with ReLU and max pooling. The layer counts are checked in the tests against the network summary the
// slides print (p. 10).
import { convolve } from "./vision.js";

/** CNN, p. 7: a convolution layer has ((m·n·d) + 1)·k weights, m × n the kernel, d the depth of the layer before, and
 *  k (not named on the slide) the number of kernels; the +1 is each kernel's bias. */
export const convParams = (m, n, d, k) => (m * n * d + 1) * k;

/** A dense layer has (nL−1 + 1)·nL weights, one bias per node. The slide prints nL−1·nL + 1, one bias for the whole
 *  layer; a 1 × 1 convolution over d inputs, which is a dense layer at every pixel, gives (d + 1)·k by the slide's own
 *  convolution count. */
export const denseParams = (nPrev, n) => (nPrev + 1) * n;

/** Batch normalisation keeps four numbers per channel: the printed 256 for 64 channels and 1024 for 256 (p. 10). */
export const bnParams = channels => 4 * channels;

/** The output size of a convolution or pooling along one axis, ⌊(n + 2p − m)/s⌋ + 1: worked by hand from how the
 *  window slides, and checked against the shapes printed on p. 10 (486 → 240 with a 7-wide kernel and stride 2). */
export const outSize = (n, m, s = 1, p = 0) => Math.floor((n + 2 * p - m) / s) + 1;

/** CNN, p. 9: ReLU, max(0, x). */
export const relu = img => ({ ...img, px: img.px.map(v => Math.max(0, v)) });

/** CNN, p. 8: max pooling over size × size windows with the same stride, the spatial size reduced. */
export function maxPool(img, size = 2) {
  const w = Math.floor(img.w / size), h = Math.floor(img.h / size), px = new Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let m = -Infinity;
    for (let k = 0; k < size; k++) for (let l = 0; l < size; l++) m = Math.max(m, img.px[(y * size + k) * img.w + x * size + l]);
    px[y * w + x] = m;
  }
  return { w, h, px };
}

/** One feature map: the kernel slid with a stride and a bias added, then ReLU and 2 × 2 max pooling. */
export function featureMap(img, kernel, { stride = 1, bias = 0 } = {}) {
  const full = convolve(img, kernel), w = Math.ceil(img.w / stride), h = Math.ceil(img.h / stride), px = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) px.push(full.px[y * stride * img.w + x * stride] + bias);
  const conv = { w, h, px }, act = relu(conv);
  return { conv, act, pooled: maxPool(act, 2) };
}

/** The first layers of the network printed on p. 10, recomputed: a 480 × 640 × 3 image, padded by 3, a 7 × 7 convolution
 *  with 64 kernels and stride 2, batch normalisation, padding 1, a 3 × 3 max pooling with stride 2, then 1 × 1 and 3 × 3
 *  convolutions. Kernel sizes and strides are not printed; they are the ones that give the printed counts and shapes. */
export function resnetStem(H = 480, W = 640) {
  const rows = [];
  let h = H + 6, w = W + 6;
  rows.push({ name: "Padding by 3", shape: [h, w, 3], params: 0 });
  h = outSize(h, 7, 2); w = outSize(w, 7, 2);
  rows.push({ name: "7 × 7 convolution, 64 kernels, stride 2", shape: [h, w, 64], params: convParams(7, 7, 3, 64) });
  rows.push({ name: "Batch normalisation", shape: [h, w, 64], params: bnParams(64) });
  h += 2; w += 2;
  rows.push({ name: "Padding by 1", shape: [h, w, 64], params: 0 });
  h = outSize(h, 3, 2); w = outSize(w, 3, 2);
  rows.push({ name: "3 × 3 max pooling, stride 2", shape: [h, w, 64], params: 0 });
  rows.push({ name: "1 × 1 convolution, 64 kernels", shape: [h, w, 64], params: convParams(1, 1, 64, 64) });
  rows.push({ name: "3 × 3 convolution, 64 kernels, padded", shape: [h, w, 64], params: convParams(3, 3, 64, 64) });
  rows.push({ name: "1 × 1 convolution, 256 kernels", shape: [h, w, 256], params: convParams(1, 1, 64, 256) });
  return rows;
}
