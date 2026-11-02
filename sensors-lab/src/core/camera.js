// The camera model (Kubinger 2020, Modul 3, pp. 39–53): the pinhole in its positive position, the calibration matrix K,
// the extrinsic R and t, radial and tangential lens distortion, and the field of view. Lengths in m, image
// coordinates in pixels, angles in radians. A camera is { fx, fy, cx, cy } in pixels.

/** p. 43 (slide 86): u = cx + fx·xc/zc, v = cy + fy·yc/zc. A point behind the camera (zc ≤ 0) has no image: null. */
export function project({ fx, fy, cx, cy }, [x, y, z]) {
  if (!(z > 0)) return null;
  return [cx + fx * x / z, cy + fy * y / z];
}

/** p. 44 (slide 87): the calibration matrix K and its inverse. */
export const K = ({ fx, fy, cx, cy }) => [[fx, 0, cx], [0, fy, cy], [0, 0, 1]];
export const Kinv = ({ fx, fy, cx, cy }) => [[1 / fx, 0, -cx / fx], [0, 1 / fy, -cy / fy], [0, 0, 1]];

/** A 3 × 3 matrix times a vector, and two matrices multiplied. */
export const mulV = (M, v) => M.map(row => row[0] * v[0] + row[1] * v[1] + row[2] * v[2]);
export const mulM = (A, B) => A.map(row => [0, 1, 2].map(j => row[0] * B[0][j] + row[1] * B[1][j] + row[2] * B[2][j]));
export const transpose = M => [0, 1, 2].map(i => [0, 1, 2].map(j => M[j][i]));

/** p. 44: (xc, yc, zc) = K⁻¹·(u·zc, v·zc, zc). The image point alone fixes only the ray; its depth zc must be given. */
export const backProject = (cam, [u, v], z) => mulV(Kinv(cam), [u * z, v * z, z]);

/** Rotations about the camera's y axis (pan) and x axis (tilt), angles in radians. */
export const rotY = a => [[Math.cos(a), 0, Math.sin(a)], [0, 1, 0], [-Math.sin(a), 0, Math.cos(a)]];
export const rotX = a => [[1, 0, 0], [0, Math.cos(a), -Math.sin(a)], [0, Math.sin(a), Math.cos(a)]];

/** p. 45 (slide 89): xc = R·xw + t, and back xw = Rᵀ·xc − Rᵀ·t. */
export const toCamera = (R, t, xw) => mulV(R, xw).map((v, i) => v + t[i]);
export const toWorld = (R, t, xc) => mulV(transpose(R), xc.map((v, i) => v - t[i]));

/** p. 46 (slide 91): (u·s, v·s, s) = P·(x, y, z, 1) with P = K·(R|t). Returns the image point, or null behind. */
export function projectWorld(cam, R, t, xw) {
  const KR = mulM(K(cam), R), Kt = mulV(K(cam), t);
  const [us, vs, s] = mulV(KR, xw).map((v, i) => v + Kt[i]);
  return s > 0 ? [us / s, vs / s] : null;
}

/** p. 49 (slide 97): the image point on the plane z = 1, xn = (u − cx)/fx, yn = (v − cy)/fy, and back. */
export const normalise = ({ fx, fy, cx, cy }, [u, v]) => [(u - cx) / fx, (v - cy) / fy];
export const toPixels = ({ fx, fy, cx, cy }, [x, y]) => [cx + fx * x, cy + fy * y];

/** p. 49 (slides 97–98): radial (1 + k1·r² + k2·r⁴ + k3·r⁶)·xn and tangential xn + p1·2xn·yn + p2·(r² + 2xn²),
 *  yn + p1·(r² + 2yn²) + p2·2xn·yn, with r² = xn² + yn². The slides combine the two; here the tangential shift is
 *  added to the radially scaled point, so with p1 = p2 = 0 it is the radial model and with k = 0 the tangential. */
export function distort([xn, yn], { k1 = 0, k2 = 0, k3 = 0, p1 = 0, p2 = 0 } = {}) {
  const r2 = xn * xn + yn * yn, radial = 1 + k1 * r2 + k2 * r2 * r2 + k3 * r2 * r2 * r2;
  return [radial * xn + p1 * 2 * xn * yn + p2 * (r2 + 2 * xn * xn),
          radial * yn + p1 * (r2 + 2 * yn * yn) + p2 * 2 * xn * yn];
}

/** p. 50 (slide 99): the corrected image is built from the target side, each (u, v) looking up its (ud, vd) in the
 *  distorted image; this is that look-up for one pixel. */
export const distortedPixel = (cam, uv, coeffs) => toPixels(cam, distort(normalise(cam, uv), coeffs));

/** The angle the sensor sees across n pixels of pitch p behind a lens of focal length f: 2·arctan(n·p/(2f)). The
 *  slides tabulate it (p. 87, slide 173: 75.0° and 59.8° for f = 4 mm on 1024 × 768 pixels of 6 µm); the formula is
 *  the pinhole of p. 41 at the sensor's edge. */
export const fov = (n, pitch, f) => 2 * Math.atan(n * pitch / (2 * f));
