// From pixels to metres (Wöber 2019–2021, MuS 2, Pose estimation): depth from stereo disparity, the pinhole camera's
// projection, the flat object's size, and RANSAC against least squares on points with outliers.
import { uniform, normal } from "./random.js";

/** Pose estimation, p. 10, eq. 3: Z = B·f/D, B the baseline, f the focal length and D the disparity, f and D in pixels. */
export const stereoDepth = (B, f, D) => B * f / D;

/** Pose estimation, p. 23, eqs. 5–6: u = fx·x/z + cx, v = fy·y/z + cy, a point in the camera's frame. */
export const project = ([x, y, z], { fx, fy, cx = 0, cy = 0 }) => [fx * x / z + cx, fy * y / z + cy];

/** Pose estimation, p. 28: for a flat object parallel to the chip, width in the image / f = real width / Z. */
export const flatDepth = (realWidth, imageWidth, f) => realWidth * f / imageWidth;

/** Pose estimation, p. 34, eq. 15: least squares Θ = (XᵀX)⁻¹XᵀY, here for a line y = kx + d. */
export function fitLine(points) {
  const n = points.length;
  if (n < 2) return null;
  let sx = 0, sy = 0, sxx = 0, sxy = 0;
  for (const [x, y] of points) { sx += x; sy += y; sxx += x * x; sxy += x * y; }
  const det = n * sxx - sx * sx;
  if (Math.abs(det) < 1e-12) return null;
  return { k: (n * sxy - sx * sy) / det, d: (sxx * sy - sx * sxy) / det };
}

/** Points on y = kx + d with Gaussian noise and a share of outliers spread over the box: the example data, seeded. */
export function linePoints({ n = 40, k = 0.6, d = 1, noise = 0.15, outliers = 0.3, seed = 3 }) {
  const u = uniform(seed), g = normal(uniform(seed + 1));
  return Array.from({ length: n }, () => {
    const x = 10 * u();
    return u() < outliers ? [x, 10 * u() - 1, true] : [x, k * x + d + noise * g(), false];
  });
}

/** Pose estimation, p. 38: per cycle draw two points, fit the line, count the points within the tolerance, stop when
 *  the share of inliers passes τ; after N cycles or the stop, refit with all inliers of the best line. */
export function ransac(points, { tol = 0.3, tau = 0.6, N = 50, seed = 5 }) {
  const u = uniform(seed), n = points.length;
  let best = null, cycles = 0;
  for (; cycles < N; cycles++) {
    const i = Math.floor(u() * n);
    let j = Math.floor(u() * (n - 1));
    if (j >= i) j++;
    const [x1, y1] = points[i], [x2, y2] = points[j];
    if (x1 === x2) continue;
    const k = (y2 - y1) / (x2 - x1), d = y1 - k * x1;
    const inliers = points.filter(([x, y]) => Math.abs(y - (k * x + d)) <= tol);
    if (!best || inliers.length > best.inliers.length) best = { k, d, inliers, pair: [i, j] };
    if (inliers.length / n > tau) { cycles++; break; }
  }
  return { ...best, cycles, refit: fitLine(best.inliers) };
}
