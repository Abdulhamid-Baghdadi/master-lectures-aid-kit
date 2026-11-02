# Architecture

Binds the design rules (UA-SMARTLab/design-rules) to this project's names. Built on `../handling-lab`'s skeleton (its
app, tests and layers, copied on 2 Nov 2026), itself after the Measurement lab of the Bachelor lectures aid kit, and on
the kit shared by every lab here.

## Layers, bottom first

| Layer | Files | May use | Front door |
|---|---|---|---|
| kit-core | `../kit/core/**` (shared) | nothing | `../kit/core/index.js` |
| core | `src/core/**` | kit-core | `src/core/index.js` |
| vendor | `../kit/vendor/*.mjs` (shared) | nothing | Temml, `../kit/vendor/temml.mjs`; only `../kit/ui/math.js` imports it |
| kit | `../kit/ui/**` (shared) | kit-core, vendor | `../kit/ui/kit.js`, `../kit/ui/chart.js`, `../kit/ui/art.js`, `../kit/ui/math.js` |
| labs | `src/labs/**` | kit-core, core, kit | each lab's default export `{ id, art(), mount(element) }`; the list in `src/labs/index.js` |
| app | `src/app.js` | kit-core, core, kit, labs | the page, `index.html` |

The core is pure: no DOM, network, clock or `Math.random` (`forbid` in `architecture.json`). `ranging.js` holds echo
ranging, the ToF camera's phase and range, and image data rates (Modul 2 and 3); `camera.js` the pinhole, K, R and t,
P, lens distortion and the field of view (Modul 3, pp. 39–53); `colour.js` HSI, HSV, grey and the Bayer patterns
(pp. 54–65); `stereo.js` depth from disparity, SAD and SSD, the row search and the invalid depth band (pp. 82–91 and
Intel 2018). The correspondence lab's rows are fixed functions, not random, so every visit shows the same scene.

## Data

`data/labs.json` (`"format": "sensors-lab labs"`, version 1): four parts after the slides' modules, then each lab's
words, its `equations` (equation, what it is, PDF page and slide, or empty for a step worked here from a definition)
and practice questions with a `compute` block that `src/core/practice.js` works out. `bibliography.json` holds
Kubinger (2020), Kubinger (2018) and Intel (2018).

## Where this lab goes beyond the slides

The slides state the laws; the labs also work out what follows from them and say so: the round-trip halving for sound,
the depth step of one pixel of disparity, the field of view, the ToF phase over a full turn with four modelled samples,
and the search along one rectified row. Each is checked against a second route in `tests/unit/core.test.js`.

## Held by tests

- Layering: `../kit/scripts/check-architecture.js`, run by `tests/unit/architecture.test.js`.
- The laws: `tests/unit/core.test.js`, against the printed numbers of the slides (c0 p. 9, 290 Mbit/s p. 35, λmod
  p. 78, the stereo table's fields of view and depths p. 87) and the MC's 768 kB, or a second route (K·K⁻¹, a
  projection round trip, P against R, t and the pinhole, HSI against HSV on pure hues, Bayer round trips, triangulation,
  the datasheet's two band formulas).
- Every practice answer recomputed: `tests/unit/labs-data.test.js`. Every equation typesets: `labs-math.test.js` and
  `../kit/tests/math.test.js`. Modules and data agree: `labs-modules.test.js`. Citations: `design-citations.test.js`.
  README pictures: `readme.test.js`.

## Departures

- 2 Nov 2026: the kit is a copy of the Bachelor kit's (0541bb7), not shared with it, as for `../handling-lab`. Worth
  proposing back: none yet.
