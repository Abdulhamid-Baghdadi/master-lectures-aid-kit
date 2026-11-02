# Architecture

Binds the design rules (UA-SMARTLab/design-rules) to this project's names. Built on the skeleton of `../handling-lab`
(its app, tests and layers, copied on 2 Nov 2026) and the kit shared by every lab here.

## Layers, bottom first

| Layer | Files | May use | Front door |
|---|---|---|---|
| kit-core | `../kit/core/**` (shared) | nothing | `../kit/core/index.js` |
| core | `src/core/**` | kit-core | `src/core/index.js` |
| vendor | `../kit/vendor/*.mjs` (shared) | nothing | Temml, `../kit/vendor/temml.mjs`; only `../kit/ui/math.js` imports it |
| kit | `../kit/ui/**` (shared) | kit-core, vendor | `../kit/ui/kit.js`, `../kit/ui/chart.js`, `../kit/ui/field.js`, `../kit/ui/art.js`, `../kit/ui/math.js` |
| labs | `src/labs/**` | kit-core, core, kit | each lab's default export `{ id, art(), mount(element) }`; the list in `src/labs/index.js` |
| app | `src/app.js` | kit-core, core, kit, labs | the page, `index.html` |

The core is pure: no DOM, network, clock or unseeded randomness (`forbid` in `architecture.json`). Every noise, particle,
outlier and example image comes from `random.js`, a seeded generator (mulberry32 and Box–Muller, after the Bachelor
kit's measurement lab), so a lab looks the same at every visit and the tests can pin its numbers. `filters.js` holds
Bayes' rule, the histogram filter, the Kalman filter, odometry with its Jacobian and process noise, and the particle
filter (MUS); `vision.js` the example scenes, convolution, box, Gaussian and median filters, Sobel and Canny,
thresholds, the excess colour index, Otsu's criterion and HSV; `cnn.js` the weight counts and output sizes of
convolution layers and one feature map; `pose.js` stereo depth, the pinhole projection, least squares and RANSAC
(MUS2). Inside the labs layer, `draw.js` draws images (with the kit's heatmap), the corridor and the metric plane; it
is not a lab.

## Data

`data/labs.json` (`"format": "mobile-robots-lab labs"`, version 1): two parts (MUS and MUS2), then each lab's words, its
`equations` (equation, what it is, file and PDF page, or empty for a step worked here) and practice questions with a
`compute` block that `src/core/practice.js` works out. `bibliography.json` holds the slide sets of Wöber (2018, 2019,
2019a, 2020, 2021), Thalhammer (2021) and, as the slides cite it, Thrun et al. (2006).

## Where the lab and the slides differ

- Slips corrected, each with its test or its note: the HSV case h = 2 (Segmentation, p. 31), the dense layer's
  weight count (CNN, p. 7), the argument order of atan2 (Edges, p. 7), the minus in Axt−1 − But (Gaussianfilters,
  p. 6). See README.md.
- Worked here, not on the slides, and marked so in the equations table: the Jacobian of the odometry step, the process
  noise R = V·M·Vᵀ, the turning radius δd/δθ and the output size of a convolution.
- Otsu's threshold uses the slide's criterion J (eq. 5), and skips classes under 2 % of the pixels, whose variance is
  nearly zero and would make J large for no reason.

## Held by tests

- Layering: `../kit/scripts/check-architecture.js`, run by `tests/unit/architecture.test.js`.
- The laws: `tests/unit/core.test.js`, against the network summary printed on CNN, p. 10 (9472, 4160, 36928, 16640,
  256, 1024 weights; 486 → 240 → 242 → 120 pixels), or a second route (the product of two Gaussians for the Kalman
  filter, the Kalman filter for the particle filter, numerical derivatives for the Jacobian and R, the HSV round trip,
  two projections for the stereo depth), or by hand.
- Every practice answer recomputed: `tests/unit/labs-data.test.js`. Every equation typesets: `labs-math.test.js` and
  `../kit/tests/math.test.js`. Modules and data agree: `labs-modules.test.js`. Citations: `design-citations.test.js`.
  README pictures: `readme.test.js`.

## Departures

- 2 Nov 2026: none from `../handling-lab`'s design. Worth proposing back: none yet.
