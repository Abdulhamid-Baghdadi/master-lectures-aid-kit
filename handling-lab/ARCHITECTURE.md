# Architecture

Binds the design rules (UA-SMARTLab/design-rules) to this project's names. Built on the Measurement lab's skeleton of
the Bachelor lectures aid kit (its app, tests and layers, copied on 2 Nov 2026) and the kit shared by every lab here.

## Layers, bottom first

| Layer | Files | May use | Front door |
|---|---|---|---|
| kit-core | `../kit/core/**` (shared) | nothing | `../kit/core/index.js` |
| core | `src/core/**` | kit-core | `src/core/index.js` |
| vendor | `../kit/vendor/*.mjs` (shared) | nothing | Temml, `../kit/vendor/temml.mjs`; only `../kit/ui/math.js` imports it |
| kit | `../kit/ui/**` (shared) | kit-core, vendor | `../kit/ui/kit.js`, `../kit/ui/chart.js`, `../kit/ui/art.js`, `../kit/ui/math.js` |
| labs | `src/labs/**` | kit-core, core, kit | each lab's default export `{ id, art(), mount(element) }`; the list in `src/labs/index.js` |
| app | `src/app.js` | kit-core, core, kit, labs | the page, `index.html` |

The core is pure: no DOM, network, clock or `Math.random` (`forbid` in `architecture.json`). `mechanisms.js` holds the
mobility count, Grashof's rule, the four-bar's position, transmission angle, dead centres, the pole of two positions,
the Roberts–Chebyshev cognates and the speed ratio by poles (chapters 3–4); `motion.js` the motion laws, their
characteristic values, the disc cam and the indexing cam (chapters 5–6, and the feed of chapter 2); `grippers.js` the
suction and magnet grippers (chapter 3). Inside the labs layer, `draw.js` draws a mechanism to scale and `fourbar.js`
shares the four-bar's sliders and drawing among four labs; neither is a lab.

## Data

`data/labs.json` (`"format": "handling-lab labs"`, version 1): three parts, then each lab's words, its `equations`
(equation, what it is, chapter and page, or empty for a step worked here from a definition) and practice questions
with a `compute` block that `src/core/practice.js` works out. `bibliography.json` holds Berger (2021) and Berger (2021a).

## Where this lab computes what the course draws

The course solves most linkage tasks by construction. The labs compute instead, and say so: the transmission angle by
the cosine rule, the dead-centre synthesis from the stretched and folded lengths, the speed ratio by the pole P13, the
cam's pressure angle for a centred translating follower. Each is checked against a second route in
`tests/unit/core.test.js`.

## Held by tests

- Layering: `../kit/scripts/check-architecture.js`, run by `tests/unit/architecture.test.js`.
- The laws: `tests/unit/core.test.js`, against the printed results of ch. 3, p. 113, ch. 6, p. 19, ch. 3, p. 60 and
  the Übungen 5_1–5_3, or a second route (numerical derivatives, link lengths held over a turn, a synthesis round trip).
- Every practice answer recomputed: `tests/unit/labs-data.test.js`. Every equation typesets: `labs-math.test.js` and
  `../kit/tests/math.test.js`. Modules and data agree: `labs-modules.test.js`. Citations: `design-citations.test.js`.

## Departures

- 2 Nov 2026: the kit is a copy of the Bachelor kit's (0541bb7), not shared with it: the two aid kits are separate
  projects. A fix to one kit is carried to the other by hand. Worth proposing back: none yet.
