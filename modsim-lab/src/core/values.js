// The values each lab starts from, with where they come from. The lecture's worked examples give symbols, not numbers
// (VO pp. 7–45: only the Simulink Fcn blocks carry amplitudes), so most are example values, labelled as such on the page.

export const VALUES = {
  // Example values; the force amplitude and frequency are the Simulink model's 10*sin(2*pi*u) (VO p. 9).
  einmasse: { m: 1, k: 400, c: 4, F0: 10, Om: 2 * Math.PI, source: "example values; F0 and Ω from VO p. 9's Fcn 10*sin(2*pi*u)" },
  // Example values; the moment amplitude is the Simulink model's 1*sin(2*pi*u) (VO p. 18), used here as M̂1 = 1 N·m.
  pendel: { m: 1, L1: 1, kD: 0, cD: 0.5, M0: 0, Om: 2 * Math.PI, phi0: 30, source: "example values" },
  // L1 = 0.5 and L2 = 0.25 are the numbers the sheet substitutes on p. 20 without naming them; the rest are example values.
  rolle: { m1: 1, m2: 0.5, r: 0.1, L1: 0.5, L2: 0.25, k: 200, l0: 0.25, source: "L1, L2 from VO p. 20; the rest example values" },
  rlc: { R: 10, L: 0.1, C: 1e-3, U: 1, source: "example values" },
  // The TM3 note "Bestimmung der Eigenfrequenzen des 2DoF Systems" (Zusatz Material, p. 1): m1=1; m2=1; k1=500*4;
  // k2=500*1.5; c1=0.8*2; c2=0.1*2. Force amplitudes 10 and 5 from the Simulink model's Fcn blocks (VO p. 31).
  zweimasse: { m1: 1, m2: 1, k1: 2000, k2: 750, c1: 1.6, c2: 0.2, F1: 10, F2: 5, Om: 2 * Math.PI, source: "TM3 note p. 1; forces VO p. 31" },
  doppel: { m: 1, L1: 1, kD: 0, cD: 0, phi1: 120, phi2: 120, source: "example values" },
  // Example values of a small DC motor; the load torque 10 of VO p. 42's Constant block would stall it, so it starts at 0.
  motor: { RA: 1, LA: 0.5, kM: 0.05, kT: 0.05, J: 0.01, cL: 1e-3, uA: 12, ML: 0, source: "example values" },
  shaker: { RS: 4, LS: 0.5, hS: 5, mS: 0.5, kS: 2000, dS: 4, US: 4, source: "example values" },
  // The student group's simulation values (report Tab. 1, p. 14; simscape_variables.m lines 1-16).
  task2: { m1: 0.1, m2: 0.1, m3: 0.1, l1: 0.2, k: 10, c: 10, kT: 40, cT: 0.4, F01: 2, M01: 30, Om: 10, source: "the group's Tab. 1 (report p. 14)" },
  task3: { m1: 0.1, m2: 0.1, m3: 0.1, l1: 0.2, k: 10, c: 1, kT: 0.1, cT: 0.01, F01: 2, M01: 0, Om: 10, source: "example values, the masses as task 2's" },
  // Example values of the order of a quarter car (wheel 40 kg, body 300 kg); the sheet gives none.
  task5: { m1: 40, m2: 300, k1: 200000, k2: 20000, c1: 100, c2: 1500, w0: 0.02, Om: 10, source: "example values" },
  task6: { m1: 0.02, m2: 0.05, k1: 50, k2: 80, c1: 0.02, c2: 0.02, w0: 0.1, F01: 0, F02: 0, Om: 30, source: "example values" },
  task7: { m1: 1, m2: 1, k1: 2000, k2: 750, c1: 1.6, c2: 0.2, w0: 0.01, Om: 20, source: "example values: the TM3 note's masses and springs" },
};
