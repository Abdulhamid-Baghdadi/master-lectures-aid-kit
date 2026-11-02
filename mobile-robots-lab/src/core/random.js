// The one seeded generator of this lab, after the Bachelor kit's measurement lab: the same seed always gives the same
// noise, particles and outliers, so a lab looks the same at every visit and a test can pin its numbers.

/** A uniform generator on [0, 1), mulberry32: small, fast and seeded. */
export function uniform(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Standard normal draws from a uniform generator, by Box–Muller, one at a time. */
export function normal(u) {
  let spare = null;
  return () => {
    if (spare !== null) { const s = spare; spare = null; return s; }
    const r = Math.sqrt(-2 * Math.log(1 - u())), a = 2 * Math.PI * u();
    spare = r * Math.sin(a);
    return r * Math.cos(a);
  };
}
