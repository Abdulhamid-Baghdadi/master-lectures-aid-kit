// The Bayes filter and its family (Wöber 2018–2021, MuS 1): Bayes' rule, the discrete (histogram) filter on a corridor,
// the Kalman filter, the odometry motion model with its Jacobian for the EKF, and the particle filter. Pure: noise
// comes from a generator handed in (random.js).

/** Basics, p. 10: p(d|s) = p(s|d)p(d) / (p(s|d)p(d) + p(s|¬d)p(¬d)), the door estimated from one sensor reading. */
export const doorPosterior = ({ hit, falseHit, prior }) => hit * prior / (hit * prior + falseHit * (1 - prior));

/** Basics, p. 21, line 3, as a sum over cells (p. 9: a countable state turns the integral into a sum): the belief moved
 *  by `shift` cells round a closed corridor, a share `slip` landing one cell short and as much one cell long. */
export function predict(bel, shift, slip = 0) {
  const n = bel.length, out = new Array(n).fill(0);
  const kernel = [[shift - 1, slip], [shift, 1 - 2 * slip], [shift + 1, slip]];
  bel.forEach((b, i) => { for (const [s, p] of kernel) out[(((i + s) % n) + n) % n] += b * p; });
  return out;
}

/** Basics, p. 21, line 4: bel = η·p(z|x)·bel̄, η making it sum to one. Returns the belief and η. */
export function correct(belBar, likelihood) {
  const raw = belBar.map((b, i) => b * likelihood[i]), sum = raw.reduce((s, v) => s + v, 0);
  if (!(sum > 0)) throw new Error("The measurement rules out every cell: give the sensor model a non-zero false-alarm rate.");
  return { bel: raw.map(v => v / sum), eta: 1 / sum };
}

/** The door sensor of Basics, p. 10, as p(z|x) over the corridor: it reports a door with p(s|d) in front of one and with
 *  p(s|¬d) elsewhere; reporting a wall has the complements. */
export const doorLikelihood = (doors, seen, hit, falseHit) =>
  doors.map(d => seen ? (d ? hit : falseHit) : (d ? 1 - hit : 1 - falseHit));

/** The Kalman filter (Gaussianfilters, p. 11, after Thrun et al. 2006), scalar: prediction μ̄ = Aμ + Bu, Σ̄ = AΣA + R; with a
 *  measurement, K = Σ̄C/(CΣ̄C + Q), μ = μ̄ + K(z − Cμ̄), Σ = (1 − KC)Σ̄. Without one (z null), the prediction is the belief
 *  (EKFLoc, p. 7: the uncertainty grows until a landmark is seen). */
export function kalman({ mu, sigma2, u, z = null, A = 1, B = 1, C = 1, R, Q }) {
  const muBar = A * mu + B * u, sigBar = A * sigma2 * A + R;
  if (z === null) return { muBar, sigBar, K: 0, mu: muBar, sigma2: sigBar };
  const K = sigBar * C / (C * sigBar * C + Q);
  return { muBar, sigBar, K, mu: muBar + K * (z - C * muBar), sigma2: (1 - K * C) * sigBar };
}

/** EKF, p. 3, footnote: the wheels' turns Δφl, Δφr of radius r on a track b give δd = (Δφl + Δφr)·r/2 and
 *  δθ = (Δφr − Δφl)·r/b. */
export const odometry = (dPhiL, dPhiR, r, b) => ({ dd: (dPhiL + dPhiR) * r / 2, dth: (dPhiR - dPhiL) * r / b });

/** EKF, p. 3, eq. 1: the pose moved by δd along the heading θ + δθ, and turned by δθ. */
export const move = ([x, y, th], dd, dth) => [x + dd * Math.cos(th + dth), y + dd * Math.sin(th + dth), th + dth];

/** The Jacobian G = ∂g/∂(x, y, θ) of that motion (EKF, pp. 8–9), worked from eq. 1 by hand. */
export const jacobian = ([, , th], dd, dth) => [[1, 0, -dd * Math.sin(th + dth)], [0, 1, dd * Math.cos(th + dth)], [0, 0, 1]];

/** MR_Kinematik, p. 24, eq. 15: the instantaneous centre of rotation, a distance L to the robot's left. */
export const icr = ([x, y, th], L) => [x - L * Math.sin(th), y + L * Math.cos(th)];

const mul = (A, B) => A.map(row => B[0].map((_, j) => row.reduce((s, v, k) => s + v * B[k][j], 0)));
const tr = A => A[0].map((_, j) => A.map(row => row[j]));

/** The EKF prediction (EKF, p. 12): μ̄ = g(u, μ), Σ̄ = GΣGᵀ + R. */
export function ekfPredict(mu, Sigma, dd, dth, R) {
  const G = jacobian(mu, dd, dth), S = mul(mul(G, Sigma), tr(G));
  return { mu: move(mu, dd, dth), Sigma: S.map((row, i) => row.map((v, j) => v + R[i][j])), G };
}

/** The process noise R in x, y, θ when δd and δθ carry noise of standard deviations sdD and sdTh: R = V·M·Vᵀ with
 *  M = diag(sdD², sdTh²) and V = ∂g/∂(δd, δθ). The course gives R as a matrix (Gaussianfilters, p. 6) without saying
 *  where it comes from; this route is worked here from eq. 1 of EKF, p. 3, so the EKF and the sampled poses share one
 *  noise. */
export function motionNoise([, , th], dd, dth, sdD, sdTh) {
  const c = Math.cos(th + dth), s = Math.sin(th + dth), V = [[c, -dd * s], [s, dd * c], [0, 1]];
  return mul(mul(V, [[sdD * sdD, 0], [0, sdTh * sdTh]]), tr(V));
}

/** MCMC, p. 20: the simplest sampled motion model, odometry with Gaussian noise of zero mean added to δd and δθ. */
export const sampleMove = (pose, dd, dth, sdD, sdTh, gauss) => move(pose, dd + sdD * gauss(), dth + sdTh * gauss());

/** MCMC, p. 19: a Gaussian sensor model as a particle's weight, p(z|x) ∝ exp(−(z − ẑ)²/(2σ²)); the constant
 *  1/√(2πσ²) is left out, as the weights are normalised. */
export const gaussWeight = (z, zHat, sd) => Math.exp(-((z - zHat) ** 2) / (2 * sd * sd));

/** MCMC, pp. 16 and 18, lines 8–11: draw M new particles with replacement, each with probability ∝ its weight. */
export function resample(particles, weights, u) {
  const total = weights.reduce((s, w) => s + w, 0);
  if (!(total > 0)) throw new Error("Every particle has weight zero: widen the sensor model or add particles.");
  const cum = [];
  weights.reduce((s, w, i) => (cum[i] = s + w / total), 0);
  return particles.map(() => {
    const r = u();
    let lo = 0, hi = cum.length - 1;
    while (lo < hi) { const m = (lo + hi) >> 1; if (cum[m] > r) hi = m; else lo = m + 1; }
    return particles[lo];
  });
}

/** One step of the particle filter on a closed corridor of length `length` (MCMC, p. 18): move every particle by u
 *  with noise, weight it by the sensor model, and resample. `sense(x)` gives p(z|x) for the reading taken. */
export function particleStep(particles, u, sdMove, sense, length, rand, gauss) {
  const moved = particles.map(x => (((x + u + sdMove * gauss()) % length) + length) % length);
  const weights = moved.map(sense);
  return { moved, weights, particles: resample(moved, weights, rand) };
}

/** The share of particles in each of n equal cells: the particle filter's belief drawn as the histogram filter's. */
export function histogram(particles, n, length) {
  const out = new Array(n).fill(0);
  for (const x of particles) out[Math.min(n - 1, Math.floor(x / length * n))] += 1 / particles.length;
  return out;
}
