# Architecture

Binds the design rules (UA-SMARTLab/design-rules) to this project's names. Built on the Industrial Handling lab's
skeleton in this kit (its app, tests, layers and record script, copied on 7 Nov 2026) and the kit shared by every lab
here.

## Layers, bottom first

| Layer | Files | May use | Front door |
|---|---|---|---|
| kit-core | `../kit/core/**` (shared) | nothing | `../kit/core/index.js` |
| core | `src/core/**` | kit-core | `src/core/index.js` |
| vendor | `../kit/vendor/*.mjs` (shared) | nothing | Temml, `../kit/vendor/temml.mjs`; only `../kit/ui/math.js` imports it |
| kit | `../kit/ui/**` (shared) | kit-core, vendor | `../kit/ui/kit.js`, `../kit/ui/chart.js`, `../kit/ui/art.js`, `../kit/ui/math.js` |
| labs | `src/labs/**` | kit-core, core, kit | each lab's default export `{ id, art(), mount(element) }`; the list in `src/labs/index.js` |
| app | `src/app.js` | kit-core, core, kit, labs | the page, `index.html` |

The core is pure: no DOM, network, clock or `Math.random` (`forbid` in `architecture.json`). `lti.js` holds
polynomials, matrices, the exponential, Runge–Kutta, Ackermann and Routh; `ss.js` state space as the course writes it
(G(s), RNF and BNF, Q_S and Q_B, pole placement, prefilter, observer, LQ, Butterworth, linearisation, MATLAB-style
stepinfo); `models.js` the exercises' models (circuits, motor, crane), the change into normal-form coordinates, a
closed loop in time with observer, saturation and a nonlinear plant, the PI outer loop and the factor dr;
`practice.js` works out every practice answer.

Inside the labs layer, `view.js` is the frame every lab shares (steps, the player, readouts, the solution sheet beside
the lab's value, the MATLAB panel), `pics.js` the drawings, `matlab.js` the MATLAB text of each view, and `systems.js`
the exercises' systems as the task sheet and as the solution sheets give them; none of them is a lab.

## Data

`data/labs.json` (`"format": "automation-lab labs"`, version 1): seven parts, then each lab's words, its `equations`
(equation, what it is, slide page or sheet page, or empty for a step worked here) with `explore` on those its steps
plot, and practice questions whose `compute` block `src/core/practice.js` works out. `bibliography.json` holds the
slides, the exercise and task sheets and the MathWorks reference pages, with the date read.

## Held by tests

- Layering: `../kit/scripts/check-architecture.js`, run by `tests/unit/architecture.test.js`.
- The core: `lti.test.js`, `ss.test.js`, `models.test.js`, against the solution sheets' values, hand calculations or
  a second route (Ackermann against the RNF route, energy kept by the frictionless crane, the tangent by differences).
- The MATLAB text: `matlab.test.js`, the generated code for known cases against the expected text.
- Every practice answer recomputed: `labs-data.test.js`. Every equation typesets: `labs-math.test.js`. Modules and
  data agree: `labs-modules.test.js`. Explore shows what it plots: `labs-explore.test.js`. README pictures:
  `readme.test.js`. Citations: `design-citations.test.js`.

## Departures

- 7 Nov 2026: `src/core/lti.js` is a copy of the Bachelor lectures aid kit's Automation lab core at commit 6a7abd0,
  not shared with it: the two aid kits are separate projects. A fix to one is carried to the other by hand. Worth
  proposing back: none yet.
- 7 Nov 2026: each lab is a sequence of steps of one exercise rather than one idea, because the course asked for the
  exercises animated; the frame for that lives in `src/labs/view.js`, not in the kit, so the other labs are untouched.
  Worth proposing back: the step player and the MATLAB panel, if a second lab wants them.
