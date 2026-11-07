# Architecture

Binds the design rules (UA-SMARTLab/design-rules) to this project's names. Built on the Industrial Handling lab's
skeleton in this repository (`../handling-lab`: its app, tests and layers, copied on 2 Nov 2026) and the kit shared by
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

The core is pure: no DOM, network, clock or `Math.random` (`forbid` in `architecture.json`). `frames.js` holds plane
and spatial rotations, homogeneous transforms, the Euler, Cardan and roll-pitch-yaw sequences and gimbal lock (ch. 2);
`chains.js` Grübler's count (ch. 1), the DH step and chain, the RRT robot, planar arms (ch. 2–3), the IRB 120 and the
Jacobians (ch. 4); `inverse.js` the two-link arm's inverse kinematics by atan2 and by the triangle, and the turning post
of ch. 5, p. 21. Inside the labs layer, `draw.js` (copied from the handling lab's and extended with arrows, a projection
of space onto the page, frames and matrices) draws to scale; it is not a lab.

The four stepped exercise labs (`dhsteps`, `irbsteps`, `jacsteps`, `iksteps`, 7 Nov 2026) use the kit's step player
(`../kit/ui/steps.js`, `../kit/steps.css`) and number writer (`../kit/ui/matlab.js`), imported, not copied.
`src/labs/code.js` writes their Python and MATLAB and adds the Python panel beside the player's MATLAB one; it is not a
lab. `inverse.js` gained the three-link arm and the IRB 120's wrist split; `chains.js` the student's DH table and the
specification's wrist-centre table.

## Data

`data/labs.json` (`"format": "robotics-lab labs"`, version 1): four families, five chapters, then each lab's words, its
`equations` (equation, what it is, chapter and PDF page, or empty for a step worked here) and practice questions with a
`compute` block that `src/core/practice.js` works out. `bibliography.json` holds Ajanović (2020) and ABB (2020).

## Where this lab and the sources differ

- The IRB 120's DH table is not in the slides or the specification. It is built here from the specification's
  dimensions (p. 12) and checked against its wrist-centre table (p. 31), seven of nine rows within 1 mm. Rows D and H
  print Z = 270 mm; the chain gives 290 mm, the base height, for a level forearm (see README).
- The slides cut numbers after three decimals (ch. 2, p. 38: 4.6937 shown as 4.693). The tests say so.
- Two slips in the slides are flagged, with the check, in the README and in `tests/unit/core.test.js`.

## Held by tests

- Layering: `../kit/scripts/check-architecture.js`, run by `tests/unit/architecture.test.js`.
- The laws: `tests/unit/core.test.js`, against the printed results of chapters 1, 2, 3 and 5 and the specification's
  table, or a second route (numerical derivatives for every Jacobian, forward-then-inverse round trips, the DH step as
  the product of its four elementary transforms, orthonormality).
- Every stepped view: `code-defined.test.js` (MATLAB and Python use no name before defining it, on a fake page,
  `fake-dom.js` from the ModSim lab), `python-run.test.js` (the Python run with numpy against the lab's numbers),
  `code.test.js` (the generated text).
- Every practice answer recomputed: `tests/unit/labs-data.test.js`. Every equation typesets: `labs-math.test.js` and
  `../kit/tests/math.test.js`. Modules and data agree: `labs-modules.test.js`. Citations: `design-citations.test.js`.

## Departures

- 2 Nov 2026: as the handling lab, the kit is a copy of the Bachelor kit's, not shared with it. Worth proposing back:
  none yet.
