// The stereo camera (Kubinger 2020, Modul 3, pp. 82–91): depth from disparity, its resolution over distance, the
// correspondence search by SAD and SSD, and the invalid depth band of a stereo module (Intel 2018, section 4.7).
// Lengths in m, disparities and focal lengths in pixels unless named otherwise.

/** p. 86 (slide 171): zc = b·f/d, with f and d in the same unit (here pixels; f in pixels is f/pitch). */
export const depth = (b, fPx, d) => b * fPx / d;
/** The same solved for d: the disparity a point at depth z shows. */
export const disparity = (b, fPx, z) => b * fPx / z;

/** p. 85 (slide 169): z ∼ 1/d, so one pixel of disparity spans more depth the farther the point: the step between
 *  d and d − 1, worked here from zc = b·f/d. */
export const depthStep = (b, fPx, z) => {
  const d = disparity(b, fPx, z);
  return d > 1 ? depth(b, fPx, d - 1) - depth(b, fPx, d) : Infinity;
};

/** p. 87 (slide 173): the working range between the largest and smallest disparity searched. */
export const range = (b, fPx, dMin, dMax) => ({ zMin: depth(b, fPx, dMax), zMax: depth(b, fPx, dMin) });

/** p. 87 (slide 174): c_SAD = Σ|I1 − I2| and c_SSD = Σ(I1 − I2)²; the smaller, the better the match. */
export const sad = (a, b) => a.reduce((s, v, i) => s + Math.abs(v - b[i]), 0);
export const ssd = (a, b) => a.reduce((s, v, i) => s + (v - b[i]) ** 2, 0);

/** Along one rectified row (p. 89: corresponding points share v), the window of half-width w around x in the left row
 *  is compared with the right row shifted by every d from 0 to dMax; the best d has the smallest cost. A window that
 *  would leave the row is not compared (Infinity). Ties keep the smaller d. */
export function match(left, right, x, w, dMax, cost = sad) {
  const win = (row, c) => (c - w < 0 || c + w >= row.length) ? null : row.slice(c - w, c + w + 1);
  const ref = win(left, x), costs = [];
  for (let d = 0; d <= dMax; d++) {
    const cand = ref && win(right, x - d);
    costs.push(cand ? cost(ref, cand) : Infinity);
  }
  let best = 0;
  costs.forEach((c, d) => { if (c < costs[best]) best = d; });
  return { costs, best, unique: costs.filter(c => c === costs[best]).length === 1 };
}

/** Intel (2018), section 4.7, p. 57: the share of the left image with no depth, DBR = B/(2·Z·tan(HFOV/2)), and the
 *  band in pixels, HRes·DBR; in terms of the focal length in pixels F, the band is B·F/Z. */
export const bandRatio = (B, Z, hfov) => B / (2 * Z * Math.tan(hfov / 2));
export const bandPixels = (B, F, Z) => B * F / Z;
