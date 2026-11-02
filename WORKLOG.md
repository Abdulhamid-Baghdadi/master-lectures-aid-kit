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
