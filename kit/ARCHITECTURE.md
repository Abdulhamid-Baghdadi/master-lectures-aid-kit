# The shared kit

Every lab of the Master lectures aid kit imports (copied on 2 Nov 2026 from the Bachelor lectures aid kit at 0541bb7) this folder by relative path; each lab's own ARCHITECTURE.md and
architecture.json name its layers, bottom first:

| Layer | Files | May use | Front door |
|---|---|---|---|
| vendor | `vendor/*.mjs` | nothing | Temml, `vendor/temml.mjs`, imported only by `ui/math.js` |
| kit-core | `core/**` | nothing | `core/index.js` |
| kit | `ui/**` | kit-core, vendor | `ui/kit.js`, `ui/chart.js`, `ui/field.js`, `ui/art.js`, `ui/math.js`, `ui/steps.js`, `ui/matlab.js`, `ui/python.js`, `ui/exams.js`, `ui/backdrop.js` |

The start page's moving background (`ui/backdrop.js`, copied on 13 Nov 2026 from the Mill and lathe kit): the
seeded "linkage" scene, four-bar linkages tracing their coupler curves (the Bachelor kit has the "field" scene), at most 30 frames per second, stopped while the tab is hidden, a pause button (WCAG 2.2.2) and a
still frame for reduced motion (WCAG 2.3.3). Its tests: `tests/backdrop.test.js`. The start page's course pictures
are inline SVG drawn with the `.em` classes of `style.css`, coloured by the theme's tokens.

Tests: `node --test "kit/tests/*.test.js"` from the repository root. The layering of each lab, the kit within it, is
checked by `scripts/check-architecture.js`, run from every lab's `tests/unit/architecture.test.js`.

## The step player

`ui/steps.js` (the exercise in animated steps, with the source beside the lab and the MATLAB panel; look in
`steps.css`), `ui/matlab.js` (numbers and matrices as MATLAB input) and `core/ode.js` (fixed-step Runge–Kutta) came
from the Advanced Automation lab on 7 Nov 2026, when the ModSim lab needed the same: one copy, imported by both.
Later that day the step player took the Robotics lab's Python panel: a view that returns `python` (and `pyCheck`, what
the snippet should print) gets a second panel beside the MATLAB, `ui/python.js` writes numpy input with the MATLAB
writer's digits, and `tests/code-views.js` and `tests/fake-dom.js` (not tests themselves) hold the Python name scanner,
the view player and the runner the three labs' Python tests share.

The runner (since 7 Nov 2026, evening) does not start one `python -P` per snippet: importing python-control took
4 s to 30 s each, so a test file starts a few long-lived workers (`tests/py-worker.py`) that import the lab's modules
once and run each snippet as if pasted alone: fresh globals, its own stdout and stderr, its own temporary folder, and
matplotlib figures, numpy print options and the working folder reset after it. A per-snippet timeout, counted from the
worker's ready line, kills a hanging worker and the next snippet gets a new one. `tests/py-worker.test.js` holds this
(no name leaks into the next snippet, an error is named, a hang is stopped). The checks and tolerances are unchanged.

The MATLAB runs too (10 Nov 2026), in GNU Octave: `tests/octave-run.js` finds octave-cli (env `OCTAVE_CLI`, else
Octave 11.3.0's install path, else the PATH; without it a lab's test is skipped and says so) and starts a few
long-lived workers (`tests/octave-worker.m`: control and signal loaded once, each snippet inside a function so its
workspace starts empty, figures invisible, format, globals, figures and folder reset after it; the symbolic package,
which starts a SymPy, only once a snippet declares `syms`). Octave reads a piped
stdin in blocks, so requests go through a per-worker inbox file and replies come back as `@@` lines on stdout. A lab's
`tests/unit/matlab-run.test.js` gives each view at the end of its step either MATLAB expressions, one per entry of its
pyCheck (whose values and tolerances are reused; `[]` for a view with no pyCheck, held to running), or `{ only: reason }` when it needs what Octave lacks; `plan` counts
both and fails on a view with neither. `tests/octave-run.test.js` holds the worker (nothing leaks, an error is named,
a hang is stopped, plots stay headless).

## The one library: Temml

The house rule is plain web: plain JavaScript, no framework, no build step, a library only as a stated exception.
Temml (`vendor/`, version and source in `vendor/README.md`) is that exception, chosen on 1 Nov 2026 over KaTeX and over
writing a typesetter:

- **MathML.** It turns LaTeX into MathML, which the browser lays out itself. Typesetting mathematics as LaTeX sets it is
  a large, solved problem; writing it again would be reinventing it badly.
- **No fonts.** The equations use the system's math font (Cambria Math on Windows), so nothing is loaded from the
  network and the site works offline.
- **Accessible.** MathML is read by screen readers, takes the theme's text colour, zooms with the page, and carries
  its LaTeX source as an annotation.

Only `ui/math.js` imports it: `math(tex, { display })` returns an element, and `typeset(tex)` the markup without a DOM.
Temml's own `throwOnError: false` shows an unknown command as red text and reports nothing, so the helper asks Temml to
throw, catches the error and shows the LaTeX source with a note saying why. Nothing fails silently.

How to write the LaTeX in a lab's `labs.json`: `MATH.md`.

## Past exams

`ui/exams.js` (the overview's "Past exams" list and one page per exam) and `core/exams.js` (`examQuestions`, an
exam's questions for one lab's Practise tab) came from the Advanced Automation lab on 7 Nov 2026, when the Industrial
Handling lab took its exams too. A lab keeps its exams in `data/labs.json` under `exams`; it passes what its course
calls a task ("Rechenbeispiel", "Aufgabe") and its note on solutions. A task cites `page`, or `where` for photos; a
task with no `lab` carries a `note` saying why.
