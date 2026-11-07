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


## 7 Nov 2026, robotics-lab: IRB 120 against the URDF; stepped-lab GIFs

- `tests/unit/urdf.test.js`: the student's project's `irb120_support/urdf/irb120_2.urdf` (joints lines 209–254, flange
  line 258) composed in the test equals `irb120(q)[6]` at 50 seeded poses within 0.01 mm, mapping the identity (URDF
  angle = lab axis angle); URDF limits = ABB p. 32 ranges. Axes 4–6 agree; no core change. README source note and
  limits, `chains.js` comment updated. robotics 88, kit 29 pass.
- GIFs not recorded: headless Edge did not open its DevTools port from this session (a probe was refused).
  `robotics-lab/scripts/record-steps.mjs` is ready to run by hand. Server stopped. Nothing committed.

## 7 Nov 2026: Python beside the MATLAB in automation-lab and modsim-lab

- Kit: the step player shows a second panel, "In Python", when a view returns `python`; `pyCheck` (what it should
  print) rides on the panel's `data-check`. `kit/ui/python.js` writes numpy input with the MATLAB writer's digits
  (test `kit/tests/python.test.js`, failed first). `kit/tests/code-views.js` (Python name scanner, now splitting `;`
  and knowing `lambda`; view player; parallel runner with `python -P` on a temp copy) and `kit/tests/fake-dom.js`
  (moved from robotics and modsim, one copy). robotics-lab moved onto it: `twin()` removed.
- automation-lab: `src/labs/python.js`; all 44 views, all run and checked (gains, Kf, l, determinants, poles, lsim
  end states, stepinfo rise times to 3 %). modsim-lab: `src/labs/python.js`; 47 views, 41 run (Lagrange accelerations
  at a test state against the lab's f, eigenfrequencies, poles, matrices, solve_ivp end states to 5 % of the run's
  largest value); 6 scan only (5 Simulink views, the chaotic double pendulum).
- New tests `python-defined.test.js` and `python-run.test.js` in both labs failed before the panels existed. The run
  takes about 65 s (automation) and 45 s (modsim): importing python-control takes 4 s, six snippets run at a time.
- Differences found by running: python-control's `acker` returns 1-D (its page: 2-D); scipy's `place_poles` refuses
  Butterworth poles that are not exact conjugates (rounded with `np.round(p, 12)`); `scipy.linalg.eig` returned the
  larger eigenvalue first; the old `bode` return is deprecated (FutureWarning), so `frequency_response`. The ctrbobsv
  lsim check is at 1e-3: the lab's 200 Runge–Kutta steps on a pole near 10.7 are 1.6e-4 off the exact solution.
- Checked at 375 px, light and dark: automation `#placement`, modsim `#zweimasse`; no sideways scroll, no console
  errors. Server stopped. Nothing committed.

## 7 Nov 2026, evening: faster Python run tests (kit runner)

- `kit/tests/code-views.js` runChecks now runs the snippets on long-lived workers (`kit/tests/py-worker.py`, six at
  a time): the lab's modules are imported once per worker, each snippet runs in fresh globals with its own stdout,
  stderr and temporary folder; figures, numpy print options and the working folder are reset after each. Per-snippet
  timeout (120 s, from the worker's ready line) kills a hanging worker; failures still name the view and the snippet.
  Checks and tolerances unchanged. The labs pass `preload` (automation: numpy, control; modsim: numpy, scipy, sympy,
  control; robotics: numpy).
- New `kit/tests/py-worker.test.js` (by definition): a name, numpy print option or file of one snippet is not seen
  by the next; a NameError is reported and the next snippet runs; a hang is stopped at the timeout.
- `python-run.test.js` timed on this PC (busy: python-control's import took up to 30 s), before (HEAD 800375a, a
  clean worktree) and after: automation 150 s to 26 s, modsim 72 s to 41 s, robotics 5 s to 2 s. All suites pass
  (kit 34, automation 109, modsim 64, robotics 88). Nothing committed.

## 7 Nov 2026, evening: Python plots beside the labs' charts

- New `kit/scripts/python-plots.mjs`: per stepped view with a line chart, runs the view's Python (defaults, p = 1)
  on a temp copy with `python -P` and Agg, and draws the lab's own series (caught from `lineChart` by a loader hook)
  in matplotlib; PNGs and numbers in `<lab>/docs/python-check/`, verdict tables in each README there.
- Automation: all agree except task1 step 3, where the defect run stopped at 0.133 s while still rising ("steady
  error −115 rpm"); fixed (defect run 4× longer, ends at 2500 rpm), test `tests/unit/python-check.test.js`, note in
  the README's source notes. task2 step 3 differs by design (nonlinear crane vs the snippet's linear step).
- ModSim: all agree; doppel s2 is chaotic, doppel s3 plots ode45-style energy drift (2.1 J at rtol 1e-3) vs the lab's
  conserved K + V: left for a decision. Robotics: no Python curve to compare (IK and J checked by numbers).
- Automation tests 109/109. Browser screenshots not used (lab series rendered instead). Nothing committed.

## 7 Nov 2026, evening: Advanced Automation past exams

- Five exams in `Prüfungen\` (SS2014 A, B, WH-Klausur A; SS2017 A, B), three calculation tasks each, 15 in all. The
  two "- Copy" PDFs are byte-identical to their originals (SHA-256); theory file skipped.
- `data/labs.json` gains `exams` (by year and group, file and page per task and question, "no solution sheet; worked
  here"); new page per exam (`#exam-ss2014-a` …) listed under "Past exams" on the overview; each lab's Practise tab
  shows the linked exam questions under "From past exams" (one copy, `examQuestions` in the core). The two exam
  questions that sat in the ctrbobsv and placement labs moved into the exams.
- Core: SS2014 B and SS2017 A, B nonlinear systems added to `NONLINEAR`. No new stepped lab: every task is a kind a
  lab already animates (placement, observer, ctrbobsv, normalforms, linearise, circuits).
- New `tests/unit/exams.test.js` (46 tests; failed first): recomputes every answer, eig of the closed loop and the
  observer equal the wanted poles, Q_S/Q_B rank 2, tangents equal the hand-worked A, b, cᵀ, d, G(s) of the resit RB2.
- Automation 153/153, kit 34/34. Checked at 375 px light and dark (exam page, overview list, observer Practise), no
  sideways scroll, no console errors; server stopped. No exam errors beyond small slips (README source notes).
  Nothing committed.

## 7 Nov 2026, evening: Mobile robots past exams surveyed, none added

- Read every exam page: `MMR17\MUS_Klausur_A_2017` (9 JPGs, SS2018 group A, 27.4.2018), `MUS_Klausur_B_2017`
  (10 JPGs, SS2018 group B), `2017\Prüfungen\2019_bb_d.pdf` (scanned, 6 pages, SS2019 group D, 28.3.2019), and
  `3. Semester\MUS2\Prüfungen` (`Prüfung1.jpg` and `test01.jpg`, one MMR-3 exam; `Fragen_MUS2.pdf`, a student's
  memory list; `CVPOAusarbeitung.odt`, a 2013 student study guide, not an exam). No duplicates (SHA-256). The folder
  named 2017 holds the SS2018 exams.
- Every question is theory (explain, sketch, name): about 25 in SS2018 A, 23 in SS2018 B, 17 in SS2019 D, 14 in the
  MUS2 exam and 9 in the memory list, 88 in all. No calculation task with numbers to work, so no "Past exams" set was
  added to `mobile-robots-lab`; nothing in the lab changed. Nothing committed.

## 7 Nov 2026, evening: Industrial Handling past exams

- `IHA\Prüfungen\`: 2015 (photos, with a Musterlösung), 2016 (`.docx` of photos), 2017 (photos in
  `Prüfung 18\Prüfung 17\`), 2018 (`Prüfung_18.pdf`, a graded student's scan). `Old\MMR17\Prüfung 15–18` are all
  byte-identical to these (SHA-256). `Old\Skript_WS19\IHA_Uebungsskript_2019.pdf` has the same tasks as the 2021
  Übungsskript and no solutions: nothing added from it.
- `handling-lab/data/labs.json` gains `exams`: 4 exams, 17 tasks. Those a lab works have 14 questions (dead centre,
  Grashof, poles, motion laws); Kutzbach plans, three-position synthesis, the dwell drive and the lifting-aid rating
  carry a note instead. The motion-plan task repeats in 2016, 2017 and 2018. New laws `quinticCoef`, `swingAtCv`.
- Shared: the past-exams list and page moved to `kit/ui/exams.js`, `examQuestions` to `kit/core/exams.js` (additive);
  automation-lab uses them now (its own copy removed). Kit ARCHITECTURE.md says so.
- Exam errors (README): the 2015 Musterlösung's ω31 = ω21·Cv = 23.56 s⁻¹ leaves out ψH/φP (right: 7.66 s⁻¹) and
  writes 12.556 for 12.566; the 2018 table numbers its M21 row 1.3 (should be 1.5).
- New `tests/unit/exams.test.js` (20 tests; failed first). Handling 66/66, automation 153/153, kit 34/34. Checked at
  375 px light and dark (both labs' exam pages, the overview list, dead-centre Practise): no sideways scroll, no
  console errors; server stopped. Nothing committed.
