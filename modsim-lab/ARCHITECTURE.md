# Architecture

Binds the design rules (UA-SMARTLab/design-rules) to this project's names. Built on the Advanced Automation lab's
skeleton in this kit (its app, tests, layers and record script, 7 Nov 2026) and the kit shared by every lab here.

## Layers, bottom first

| Layer | Files | May use | Front door |
|---|---|---|---|
| kit-core | `../kit/core/**` (shared) | nothing | `../kit/core/index.js` |
| core | `src/core/**` | kit-core | `src/core/index.js` |
| vendor | `../kit/vendor/*.mjs` (shared) | nothing | Temml, `../kit/vendor/temml.mjs`; only `../kit/ui/math.js` imports it |
| kit | `../kit/ui/**` (shared) | kit-core, vendor | `../kit/ui/kit.js`, `chart.js`, `art.js`, `math.js`, `steps.js`, `matlab.js` |
| labs | `src/labs/**` | kit-core, core, kit | each lab's default (or named) export `{ id, art(), mount(element) }`; the list in `src/labs/index.js` |
| app | `src/app.js` | kit-core, core, kit, labs | the page, `index.html` |

The core is pure: no DOM, network, clock or `Math.random` (`forbid` in `architecture.json`). `models.js` holds each
exercise's equation of motion as ẋ = f(t, x), its linear state space, closed forms (ω₀, ω_D, eigenfrequencies from
det(K − λM) = 0 and from the trace, steady states), energies, and, where the sheet's printed equation differs from a
re-derivation, the sheet's as a variant; `values.js` the starting values with their sources; `practice.js` works out
every practice answer. Integration is the kit core's fixed-step Runge–Kutta (`../kit/core/ode.js`).

Inside the labs layer, `view.js` holds what the views share beyond the kit's step player (lines that arrive one by one,
a run cache, sliders), `pics.js` the drawings (masses on springs and dampers, linkages, the Simulink blocks, a circuit
loop, energy bars), and `matlab.js` the MATLAB text of each view; none of them is a lab. `cart.js` and `chain.js` each
make several task-sheet labs from one model; `sheet.js` makes a three-step task-sheet lab from a spec, and `tasks.js`
holds the specs of tasks 1, 4, 8–13 (10 Nov 2026), whose models reuse the core's: task 13's `manipulator` is the one
copy of the double pendulum (`doppel` calls it), tasks 11–12 use `cartPendulum`, tasks 4, 9, 10 `chain2`.

## Data

`data/labs.json` (`"format": "modsim-lab labs"`, version 1): four parts, then each lab's words, its `equations`
(equation, what it is, VO page or empty for a step worked here) with `explore` on those its charts plot, and practice
questions whose `compute` block `src/core/practice.js` works out. `bibliography.json` holds the lecture, the task sheet,
the group's report, the TM3 note and the MathWorks reference pages, with the date read.

## Held by tests

- Layering: `../kit/scripts/check-architecture.js`, run by `tests/unit/architecture.test.js`.
- The core: `models.test.js`, against closed forms (ω₀, ω_D, the small-angle period, the 90° period, ω₀ of the RLC
  circuit), the TM3 note's λ and f₀, second routes (the trace against det(K − λM), dS/dφ against a difference quotient)
  and energy kept by every undamped model, the double pendulum's chaos included.
- Every view: `matlab-defined.test.js` mounts every lab on a fake page (`fake-dom.js`), plays every step at its start,
  middle and end, and checks that its MATLAB uses no name before assigning it. `matlab.test.js` checks the generated
  text for known cases.
- Every practice answer recomputed: `labs-data.test.js`. Every equation typesets: `labs-math.test.js`. Modules and
  data agree: `labs-modules.test.js`. Explore shows what it plots: `labs-explore.test.js`. README pictures:
  `readme.test.js`. Citations: `design-citations.test.js`.

## Departures

- 7 Nov 2026: the step player, the MATLAB number writer, Runge–Kutta and the recorder moved from the Advanced
  Automation lab into the kit (`ui/steps.js`, `steps.css`, `ui/matlab.js`, `core/ode.js`, `scripts/record-readme.mjs`),
  so both labs import one copy; the Automation lab re-exports them under its old names. Worth proposing back: the step
  player, to the design rules, as the pattern for exercise-by-exercise labs.
- 7 Nov 2026: each lab is a sequence of steps of one exercise rather than one idea, as in the Automation lab, because
  the course asked for the exercises animated.
