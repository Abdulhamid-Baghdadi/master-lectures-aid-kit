# Architecture

Binds the design rules (UA-SMARTLab/design-rules) to this project's names. Built on the Industrial Handling lab's
skeleton in this repository (`../handling-lab`, its app, tests and layers, copied on 2 Nov 2026) and the kit shared by
every lab here.

## Layers, bottom first

| Layer | Files | May use | Front door |
|---|---|---|---|
| kit-core | `../kit/core/**` (shared) | nothing | `../kit/core/index.js` |
| core | `src/core/**` | kit-core | `src/core/index.js` |
| vendor | `../kit/vendor/*.mjs` (shared) | nothing | Temml, `../kit/vendor/temml.mjs`; only `../kit/ui/math.js` imports it |
| kit | `../kit/ui/**` (shared) | kit-core, vendor | `../kit/ui/kit.js`, `../kit/ui/chart.js`, `../kit/ui/art.js`, `../kit/ui/math.js` |
| labs | `src/labs/**` | kit-core, core, kit | each lab's default export `{ id, art(), mount(element) }`; the list in `src/labs/index.js` |
| app | `src/app.js` | kit-core, core, kit, labs | the page, `index.html` |

The core is pure: no DOM, network, clock or `Math.random` (`forbid` in `architecture.json`). `linalg.js` holds the
small dense solvers (Gaussian elimination with pivoting, Jacobi eigenvalues); `statics.js` the spring system, the
assembly, the bar, the beam element and cantilever, the polygon, the shape functions, Gauss-point extrapolation and
the Newton iteration; `dynamics.js` the natural frequencies of a spring–mass chain and the two time-integration
rules. Inside the labs layer, `draw.js` draws a structure to scale (springs, walls, forces); it is not a lab.

## Data

`data/labs.json` (`"format": "fem-lab labs"`, version 1): three parts, then each lab's words, its `equations`
(equation, what it is, slide set and page, or empty for a step worked here from a definition) and practice questions
with a `compute` block that `src/core/practice.js` works out (times its `scale`, for an answer in µm or ms).
`bibliography.json` holds Krach (2018, 2020a, 2020c, 2021) and Puhwein (2020).

## Where this lab computes what the course names

The slides name implicit and explicit solvers, nonlinearity, Gauss points and shape functions, but print few of their
formulas. The labs compute them and say so: Newton–Raphson, the central difference and its limit 2/ω, the
average-acceleration rule, the Gauss points ±1/√3, the Hermite beam element. Each is checked against a second route.

## Held by tests

- Layering: `../kit/scripts/check-architecture.js`, run by `tests/unit/architecture.test.js`.
- The laws: `tests/unit/core.test.js`, against the printed results of 02 p. 40 (60 MPa), 03 p. 20 (F·l³/3EI), 04
  p. 62 (about 80 and 170) and ModSim pp. 7–8 and 28, or a closed-form route (the analytic bar and beam, convergence
  rates under h-refinement, closed-form chain frequencies, bisection, cos ωt).
- Every practice answer recomputed: `tests/unit/labs-data.test.js`. Every equation typesets: `labs-math.test.js` and
  `../kit/tests/math.test.js`. Modules and data agree: `labs-modules.test.js`. Citations: `design-citations.test.js`.

## Departures

- 2 Nov 2026: none from the Industrial Handling lab's skeleton; the README recording uses port 8784 so it can run
  beside the other labs' servers. Worth proposing back: none yet.
