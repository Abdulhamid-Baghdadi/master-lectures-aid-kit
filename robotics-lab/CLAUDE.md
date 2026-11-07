# Robot Kinematics

Interactive labs for the FH Technikum Wien master's course Industrierobotik (IRB, robot kinematics): one lab per idea,
from Grübler's count to the inverse kinematics of a two-link arm. Layers and rules: ARCHITECTURE.md. Tests:
`node --test "tests/unit/*.test.js"`. Sources, in `H:\My Drive\02_Personal\02_Education\FH\03_FH_Master\1. Semester\IRB\`:
the slides of Ajanović (2020), chapters 01–05 as PDFs, and the ABB IRB 120 product specification
`3HAC035960 PS IRB 120-en.pdf` (ABB 2020). Read them with `pdftotext -enc UTF-8 -layout`; most formulas have no text
layer, so read those from page images (`pdftoppm -r 55 -f N -l N -png`). Pages cited are PDF pages; the printed slide
numbers run one to three ahead. There is no exercise sheet with solutions in the folder; the slides' worked examples are
the printed results. The folder's `Presentation-Baghdadi` and `project` are the user's own student project: not a source for facts, but
the four stepped exercise labs (`*steps.js`, 7 Nov 2026) compare with it and write their Python in its style. Each view
of those labs shows MATLAB and Python (`src/labs/code.js`); check MATLAB calls on the MathWorks pages first. The Python
runs in `tests/unit/python-run.test.js` when numpy is installed.
Known slips: ch. 2, p. 61 (the non-uniqueness example is wrong), ch. 5, p. 8 (rows 1–2 of the ZX′Z″ table do not reach
the target), ABB p. 31 rows D and H (Z 270 mm, the geometry gives 290 mm). Check every equation against the slides and
cite chapter and page. Part of `../PLAN.md`; not published.
