// Runge–Kutta of 4th order with a fixed step (moved here from the Advanced Automation lab's core on 7 Nov 2026, when
// the ModSim lab wanted it too). Fixed steps keep a run the same on every visit: no step-size control, no randomness.

/** One Runge–Kutta step of 4th order for x' = f(t, x). */
export function rk4Step(f, t, x, h) {
  const k1 = f(t, x);
  const k2 = f(t + h / 2, x.map((v, i) => v + h / 2 * k1[i]));
  const k3 = f(t + h / 2, x.map((v, i) => v + h / 2 * k2[i]));
  const k4 = f(t + h, x.map((v, i) => v + h * k3[i]));
  return x.map((v, i) => v + h / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
}
/** x(t) on n + 1 evenly spaced times from 0 to T: { t: [], x: [[…], …] }. */
export function simulate(f, x0, T, n) {
  const h = T / n, t = [0], x = [x0];
  for (let k = 0; k < n; k++) { x.push(rk4Step(f, k * h, x[k], h)); t.push((k + 1) * h); }
  return { t, x };
}
