# Work log

## Night of 2 to 3 Nov 2026

You asked for all four suggested courses at once, without questions in between: robot kinematics (IRB), mobile
robots and vision (MUS, MUS2), applied sensors (ASENS) and FEM (CAE).

- Four builders started in parallel, one folder each: `robotics-lab`, `mobile-robots-lab`, `sensors-lab`, `fem-lab`.
  Each follows `handling-lab`'s layout and rules; none touches the kit, the start page or another lab.
- When they report: I review each against its sources and tests, add it to the start page and README, run every
  test suite, check every lab in the browser, then commit and push (you asked for this repository to be pushed).

### FEM lab (`fem-lab`), done

- 9 labs in 3 parts after Krach (2018, 2020, 2021) and the ModSim VO-Aufgaben: springs and assembly, the polygon
  circle, the bar under h-refinement, the cantilever beam, shape functions, Gauss-point extrapolation, a nonlinear
  spring by Newton, modal analysis, explicit against implicit time steps. 45 tests pass (I reran them).
- Source errors found: 04 p. 62 gives σ_Mises = √(σx² + σy² + σz²), which is not von Mises; ModSim p. 28 states the
  stability rule Re(λ) < 0 for λ = ω², where it belongs to the state matrix's eigenvalues.
- Not done: no truss (the slides have none), no damping, no 2-D or 3-D elements.
- Kit notes: `si(0.0667, "mm")` prints "66.7 mmm"; the chart legend fits only three names.

### Sensors lab (`sensors-lab`), done

- ASENS turned out to be about the sensors of autonomous cars and camera vision (Kubinger), not PT100 or MEMS, so
  the labs follow the slides: echo ranging, image data rates, the pinhole camera, extrinsics, lens distortion, colour
  spaces and Bayer filters, time of flight, stereo depth, and stereo correspondence (SAD/SSD). 9 labs, 47 tests pass
  (I reran them).
- Source errors found: p. 78 gives λmod = 15 m at 20 kHz; 15 m needs 20 MHz. The stereo table on p. 87 states 6 µm
  pixels, but all its depths fit 7.68 µm; with 6 µm each would be 1.28 times larger.
- Not done: the summary PDF (images only); qualitative topics (SAE levels, GPS, RADAR, SIFT, RANSAC) are not labs.
  The past exams ask for explanations only, so most practice is worked by hand and marked so.

### Robotics lab (`robotics-lab`), done

- 8 labs after the IRB chapters 1–5 and the ABB IRB 120 product spec: degrees of freedom, frames in the plane,
  rotations and Euler/RPY angles, the planar arm, the DH convention, the IRB 120 as a DH chain with its Jacobian,
  Jacobians and singularities, inverse kinematics of the 2R arm. 62 tests pass (I reran them); 36 practice questions,
  most with results printed in the slides.
- The IRB 120 DH table is not in the sources: it was built from the spec's dimensions (p. 12) and checked against its
  wrist-centre table (p. 31), 7 of 9 rows within 1 mm. Axis signs 4–6 are a choice, stated in the lab.
- Source errors found: ch. 2 p. 61 claims z(45)x′(30)z″(−45) = z(0)x′(30)z″(0), which is off by 22.74°; ch. 5 p. 8
  lists two ZX′Z″ rows that are not solutions; ABB p. 31 rows D and H print Z = 270 mm where the geometry gives 290 mm.
- Kit notes: `si()` puts prefixes on dimensionless answers ("104 m1"); an answer of 0 can never be accepted.

### Mobile robots and vision lab (`mobile-robots-lab`), done

- 12 labs in two parts. MUS: discrete Bayes filter, 1-D Kalman filter, odometry, the EKF against sampled poses,
  particle filter. MUS2: denoising, thresholding, HSV, Sobel and Canny edges, a convolution layer, stereo depth,
  RANSAC. 57 tests pass (I reran them). All images are synthetic and labelled as example scenes.
- Source errors found: 2_Segmentation p. 31, eq. 19 has (q, V, t) for h = 2 where it must be (p, V, t); CNN p. 7
  counts dense-layer weights as nL−1·nL + 1 instead of (nL−1 + 1)·nL; Edges p. 7 swaps atan2's arguments;
  Gaussianfilters p. 6 has a minus sign the page's own equations do not; the SGD example on CNN pp. 15–16 is
  internally inconsistent. The slide's "Otsu" criterion is Fisher's; this was not checked against Otsu's paper.
- Not done: SLAM, graphical models, MUS2 sets 5–9 (Hough, contours, features, classification, PCA).

### Kit fix

- `si()` gave a second prefix to pure numbers, angles and already-prefixed units ("104 m1", "66.7 mmm"), reported by
  two builders. Fixed with a test that failed first; all five labs' suites still pass.

### Wrap-up

- The start page, README and PLAN list all five labs. Every test suite passes: kit 25, handling 44, robotics 62,
  mobile robots 57, sensors 47, FEM 45. In the browser all 49 labs mount without errors and none scrolls sideways at
  375 px.
- Committed and pushed to Abdulhamid-Baghdadi/master-lectures-aid-kit; the site updates through GitHub Pages.
- Worth your look: the source errors above (each lab's README lists them with the check), and the IRB 120 DH table,
  which is reconstructed from the spec rather than printed in the course.

## 7 Nov 2026: Automation lab (`automation-lab`)

- Built: 14 labs in 7 parts, the exercises of Advanced Automation rather than the slides. Models from equations
  (Bsp 1–3), normal forms and G(s) (4, 5, 7–9), controllability, observability, stability (6, 10–12 and two exam
  tasks), pole placement with prefilter (13–16 and two exam tasks), observer (17, 18 and two exam tasks), both
  together (19), linearisation (23–26), the R-L-R-C device (20), the DC motor (21), the crane (22), the circuits of 27
  and 28 (worked here, no solution sheet), and the lab tasks 0, 1 and 2. Each lab has 2 to 4 animated steps (a player,
  or a slider under reduced motion), the solution sheet's value beside the lab's own, and a MATLAB panel generated from
  the current values (`src/labs/matlab.js`, tested against expected text).
- Core added: `src/core/models.js` (S into RNF/BNF coordinates, the circuits, motor, crane by Lagrange, a closed loop
  with observer, ±umax and a nonlinear plant, the PI outer loop, dr) and `practice.js`. 100 tests pass in the lab
  (13 before), 25 in the kit. In headless Edge all 14 labs and every step mount without console errors and none
  scrolls sideways at 375 px.
- MATLAB checked on the MathWorks pages (7 Nov 2026): stepinfo, place, lqr, lsim, step, feedback, pidtune,
  pidtuneOptions, tf2ss, ctrb, ode45; acker has no current page (undocumented, per MATLAB Answers).
- Source errors and doubts (README "Source notes"): M p. 53 writes −mL·ω²·l·sin φ in the crane (Lagrange: +; vanishes
  at φ = 0) and drops a21's minus that p. 54 has; S2 p. 9's det Q_B does not follow from the matrices (S1 p. 27 does);
  the sheets give rᵀ, ℓ in RNF/BNF coordinates only (13, 14, 17, 19); M p. 58's b2 sign hard to read. Every other
  sheet value agrees with the lab. In the student's scripts: task 1 used stepinfo's 2 % band where the task asks 1 %;
  task 2 placed Butterworth poles at π/8 and π/4 instead of π/8 and 3π/8, and with the right angles its radius 0.98
  swings the load 3.2°, over the ±2.5° limit.
- Not done: the start page, root README and PLAN do not list the lab yet (left to you, as asked); nothing committed.
  Lab task 2's observer uses the position alone (MIMO place not in the core); pidtune is not reproduced, the PI is
  tuned by hand with sliders; ctrb/obsv argument order was confirmed from a search summary of the ctrb page, not the
  page itself; the solution sheet M pp. 1–39 were not checked for handwriting.

## 7 Nov 2026: ModSim lab (`modsim-lab`)

- Built: 13 labs in 4 parts. One degree of freedom: single-mass oscillator (VO 1), pendulum (VO 2), pendulum with
  roller (VO 3). Two degrees of freedom: two-mass oscillator (VO 5, with the TM3 note's values), double pendulum
  (VO 6). Electrical: RLC (VO 4), DC motor (VO 7), shaker (VO 8). Task sheet, worked here (no solution sheet): tasks 2,
  3, 5, 6, 7. Each lab has 3–4 steps (forces arriving → ODE, T/V/D term by term, the Simulink integrator chain as
  blocks, the state space filling in, the mechanism beside its time plot, eigenmodes, energy and power bars, linear
  against nonlinear, chaos from 0.001 rad) and a MATLAB panel per view (the syms/diff Lagrange recipe,
  odeToVectorField, ode45 with f = @(t,x), ss, eig, eig(K,M), bode, tf, jacobian, Simulink/Simscape blocks in words).
- Kit: `ui/steps.js`, `steps.css`, `ui/matlab.js`, `core/ode.js` and `scripts/record-readme.mjs` moved from the
  Automation lab, which now re-exports them (its 105 tests pass); kit test `steps.test.js` added.
- Sources transcribed with pages in `modsim-lab/docs/sources/`; the disagreements with the lecture and the TM3 note,
  and the slips in the group's scripts, are in the lab's README.
- Checked: every view of every lab mounts and plays in Node on a fake page; in the browser pane every lab and step at
  375 px, light and dark, without sideways scroll. GIFs and stills recorded with the kit's recorder. Nothing committed.
- Not done: tasks 1, 4, 8–13; MATLAB not run (not installed); .slx models not opened.

## 7 Nov 2026: Robot Kinematics extended (`robotics-lab`)

- Built: 4 stepped exercise labs beside the 8 idea labs. `dhsteps` (ch. 3, pp. 22–26: DH table row by row with the
  frames appearing, then ⁰T₁·¹T₂·²T₃ entry by entry against the three printed poses of p. 26); `irbsteps` (the student's
  7-row DH table beside the lab's 6 rows, the home pose against his notebook's printed T and ABB p. 31 row A, then rows
  A–J of p. 31); `jacsteps` (ch. 4, pp. 15, 20, values of ch. 2, p. 38: columns as z × (p − pᵢ) arrows, det J as the
  elbow closes); `iksteps` (ch. 5, p. 20 both elbows, the 3R arm's wrist, the IRB 120's wrist split, worked here).
- Each view has a MATLAB panel (Robotics System Toolbox: rigidBodyTree, setFixedTransform 'dh', getTransform,
  geometricJacobian, inverseKinematics; plus plain atan2 code) and a Python panel (numpy, the student's m0_1 style).
  MathWorks pages read 7 Nov 2026, in `bibliography.json`; the rotz page answered 404, so rotations are written out.
- Core: `ik3r`, `ikIrb120` (wrist split, 200-pose round trip), `irb120Student`, `WRIST_TABLE` moved from the lab.
- Tests: Python and MATLAB undefined-name scanners over every view (`code-defined.test.js`); the Python snippets run
  with numpy on a temp copy and end with the lab's numbers (`python-run.test.js`); code text (`code.test.js`). robotics
  85, automation 105, modsim 61, kit 29 pass. Browser pane at 375 px light and dark: no sideways scroll, no console
  errors; server stopped.
- Not done: README GIF/stills of the new labs; MATLAB not run (not installed); the 3R arm and the IRB 120's wrist split
  have no worked numbers in the slides, so they are checked by round trip only. Nothing committed.

