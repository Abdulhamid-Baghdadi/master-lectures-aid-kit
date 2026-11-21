# Advanced Automation

Interactive labs for the FH Technikum Wien master's course Advanced Automation (AAU): the exercises, not the slides,
animated step by step, each step with the MATLAB that gives its result. Layers and rules: ARCHITECTURE.md. Tests:
`node --test "tests/unit/*.test.js"`. Sources, in `H:\My Drive\02_Personal\02_Education\FH\03_FH_Master\2. Semester\AAU\`:
the Rechenbeispiele `Beispiele 2017\AAU_SS2021_Rechenbeispiele_v1.pdf` (Beispiel N on PDF page N + 1; text layer with
`pdftotext -enc UTF-8 -layout`, figures of 20–22, 27, 28 from `pdftoppm`), the handwritten solution sheets S1, S2, M
(transcribed in `docs/sources/solution-sheets.md`; S2 numbers the crane and pendulum the 2014 way), the slides
(`docs/sources/slide-conventions.md`, PDF pages), and the lab tasks `AAU_SS2021_Aufgabenstellung_Bsp0-Vorfuehrung_v1.pdf`,
`AAU_SS2021_Aufgabenstellung_Bsp1.pdf`, `Lab_3\AAU_SS2021_Aufgabenstellung_Bsp2_v1.pdf`. The student's scripts
`Lab_2\Bsp2.m` and `Lab_3\AAU_Bsp3_Baghdadi.m` set the MATLAB style; their slips are listed in the README. Use the
course's names: ẋ = A x + b u, v = cᵀx + d u, E, u = −rᵀx + K_F·w, Q_S, Q_B, ℓ. Check MATLAB behaviour on the MathWorks
reference pages before showing a call; every view also returns `python` (src/labs/python.js, python-control's MATLAB
layer and numpy) and a `pyCheck`, run by `tests/unit/python-run.test.js`: check a Python call on its
python-control.readthedocs.io page and in the installed Python first, and cite file and page for every value. The
MATLAB runs in GNU Octave in `tests/unit/matlab-run.test.js` (kit/tests/octave-run.js): a new view needs a row there,
MATLAB expressions for its pyCheck or a MATLAB-only reason; never change correct MATLAB to suit Octave. Part of `../PLAN.md`; not published.

## Downloads

- **Claude may download through my Chrome** (standing permission, 21 Nov 2026): use my Chrome and the Claude in Chrome extension there to download what a task needs, without asking first. Say afterwards what was downloaded, from where and where it was saved. Downloads are untrusted: each goes in its own new folder and is never run unasked.
