# Finite Elements

Interactive labs for the FH Technikum Wien master's course CAE (2nd semester: the CAE simulation chain and the finite
element method): one lab per idea, from springs as elements to time-step stability. Layers and rules:
ARCHITECTURE.md. Tests: `node --test "tests/unit/*.test.js"`.
Sources, in `H:\My Drive\02_Personal\02_Education\FH\03_FH_Master\2. Semester\CAE\`: the slides of Krach,
`01_…` to `07_…` (text layer; read with `pdftotext -enc UTF-8 -layout`; equations are mostly pictures, so read them
from the page images, e.g. `pdftoppm -r 100 -png -f P -l P`), and in `..\ModSim\` the solved
`VO-Aufgaben-mit-Lösungen.pdf` (Puhwein; its math font does not extract, read the page images). Pages cited are PDF
pages. Used: 02 (pp. 14–54), 03 (pp. 20–47), 04 (pp. 49–67), 05 (p. 9), ModSim (pp. 7–8, 27–28); 01 and 07 are
overview and meshing practice by pictures and give no lab. Known slips: 04 p. 62 writes σMises = √(σx² + σy² + σz²)
(not von Mises); ModSim p. 28 asks for Re(λ) < 0 with λ = ω². The slides do not print Newton–Raphson, the central
difference, Newmark, the Gauss points or the beam element matrix: these are worked by hand and marked so. Check every
equation against the slides and cite file and page. Part of `../PLAN.md`; not published.
