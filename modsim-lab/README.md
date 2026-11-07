# ModSim

The exercises of Modellbildung und Simulation (ModSim, FH Technikum Wien, 2nd semester, summer term 2021) animated
step by step: the eight worked lecture examples of Puhwein (2021a) and five tasks of the task sheet Puhwein (2021b).
Every step of every exercise is a view of its own (a free-body diagram whose forces arrive, T, V and D built term by
term, the ODE drawn as the Simulink integrator chain, the state space filling in, the mechanism moving beside its time
plot), and every view shows the MATLAB that gives its result, written from the view's current values.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/doppel-dark.gif">
  <img src="docs/doppel-light.gif" alt="The double pendulum swinging beside its twin started a thousandth of a radian away, the tip's path traced, while the chart draws both runs' second angle parting after about 2.6 seconds" width="720">
</picture>

## What is in it

| Part | Labs (exercises) |
|---|---|
| 1 One degree of freedom | the single-mass oscillator: forces → ODE → Simulink → state space → the mass bouncing (VO 1); the pendulum: T, V, D term by term, nonlinear against linear, rest angles and their stability from the Jacobian, Simulink and state space (VO 2); the pendulum with roller: S(φ₁) from the geometry, K of rod and rolling disc, the lab's equation beside the sheet's, the Simulink model of p. 24 (VO 3) |
| 2 Two degrees of freedom | the two-mass oscillator: M, C, K, two Simulink rows, det(K − λM) = 0 and the trace, the eigenmodes moving, the driven masses beside the frequency response (VO 5, with the TM3 note's values); the double pendulum: K and V term by term, chaos from 0.001 rad, the energy it keeps, the linear eigenmodes (VO 6) |
| 3 Electrical and electromechanical | the RLC circuit with its energy between coil and capacitor (VO 4); the DC motor's two equations, two Simulink rows, 3 × 3 state space, run-up and power flow (VO 7); the shaker's transfer functions, state space and the current with and without back-EMF (VO 8) |
| 4 The task sheet, worked here | tasks 2 (pendulum on a sprung block, the group's task, with their values) and 3 (on the floor); tasks 5 (quarter car), 6 (torsional oscillator) and 7 (hanging chain): no solution sheet; worked here |

Each lab has steps to pick, a player that runs each step's animation once (or a slider that steps it, when the reader
asks for reduced motion), readouts, the source's result beside the lab's own, and a MATLAB panel with a copy button:
the Lagrange recipe with `syms` and `diff` as the group wrote it, `ode45` with `f = @(t,x) [...]`, `ss`, `eig`,
`eig(K,M)`, `bode`, `tf`, `jacobian`, and the Simulink and Simscape block chain in words. Its Equations tab cites the
lecture by PDF page; its Practise tab asks the exercise's questions.

<img src="docs/light.png" alt="The overview in the light theme: four parts in rows, each lab a card with a line drawing of its exercise" width="640">
<img src="docs/dark.png" alt="The two-mass oscillator lab in the dark theme: the steps to pick, the masses cut free, and the matrices M, C and K filling in" width="640">

## Source notes

The lecture examples give symbols and no numbers (only the Simulink Fcn blocks carry amplitudes), so the labs start
from example values, labelled; the two-mass lab uses the TM3 note's values and reproduces its λ = 500 and 3000 s⁻²,
f₀ = 3.5588 and 8.7173 Hz. Every result the lecture prints was checked against a re-derivation; they agree except where
listed here. Transcriptions with every page: `docs/sources/vo-solutions-a.md`, `vo-solutions-b.md`.

- **VO p. 7 (example 1):** says the damping is neglected, yet keeps c(ẋ − ẋ₀). The Simulink model of p. 9 calls the
  damper's gain b, the text c. The state space of p. 8 drops x₀, ẋ₀ silently and gives no C, D.
- **VO p. 12 (example 2):** V_G = −m g L₁ sin φ₁ belongs to an angle from the horizontal; for φ from the vertical it is
  m g L₁(1 − cos φ). The printed ∂L/∂φ₁ is not the derivative of the printed L; the final equation (p. 13) is right.
- **VO p. 13:** the scalar state equation has + g/L and + k_D/(mL²) where the matrix beside it has −; B = [0; 1/(mL²)]
  has the opposite sign to −M₁ in the ODE. The rest angles nπ ignore the torsion spring: with k_D > 0, π is not one.
- **VO p. 18:** the saddle at (2n+1)π lies in the third quadrant of the tr–det chart (tr < 0, det < 0), not the first.
  δ² < 4ω² is an assumption (light damping), not a fact. The Simulink model is θ̈ = sin 2πt − (g/L) sin θ, without the
  1/(mL²), k_D and c_D of the derived equation. p. 10 writes M_c = c_D Δẋ for Δφ̇.
- **VO pp. 20–24 (example 3):** L₁ = 0.5 and L₂ = 0.25 are substituted without being given. The inertia term is printed
  (3/2)m₂·r (kg·m); from K on p. 22 it is (3/2)m₂L₁². The spring's moment lacks the lever L₁: the sheet's
  (2 sin φ₁ + cos φ₁)/(4S) is twice dS/dφ₁ (tested). p. 23 has m₂r²/3 for p. 22's m₂r²/2. The Simulink model of p. 24
  carries the same gain and draws the L0 sum as + +. The lab runs both equations side by side.
- **VO p. 26 (example 4):** u_C = x₁, then (1/C)·x₁: right only if x₁ is the charge q, as the lab takes it.
- **VO pp. 28–30 (example 5):** "stable if all Re(λ) < 0" with λ = ω² > 0 mixes the eigenproblem with the state matrix;
  the 2 × 2 "Jacobi matrix" of p. 29 is M⁻¹K, the negative of ∂f/∂x (p. 30 is right); det(A) > 0 and tr(A) < 0 settle
  stability only for 2 × 2 matrices.
- **VO pp. 33–40 (example 6):** ÿ_S2 lacks a minus sign (p. 33); cos(φ₂ − φ₁) is expanded with − for + (p. 34); the
  stiffness reads 3gmL₁² and gmL₁² for 3gmL₁ and gmL₁ (pp. 34, 35, 39); L carries +½k_D(φ₂ − φ₁)² for − (p. 37); ∂L/∂φ₂
  has sin φ₁ for sin φ₂ (p. 38), and k_D, c_D are not scaled by 2/(mL₁²) as the other terms are; the stable rest is left
  empty (p. 40); the Simulink model of p. 40 is the point-mass double pendulum, not the rods derived. The equations of
  p. 33 without spring and damper are right; the lab's energy test confirms them.
- **VO p. 42 (example 7):** the Simulink model adds a load torque of 10 the ODE does not have; the lab names it M_L.
- **VO p. 44 (example 8):** the transfer function with s² is labelled G_Ux; it is G_Ua. The back-EMF is left out (as the
  text says); the lab shows the coupled current too, which, like the sheet's Simscape plot (p. 45), dips and comes
  later to the same end value.
- **TM3 note p. 1:** f0 = om/6.28 instead of om/(2*pi), 0.05 % off.

The student group's work (task 2, `docs/sources/student-work.md`) was the model for the MATLAB style, not for its
results:

- **`Jacobian.mlx`:** ÿ has `y_dot^2` where θ̇² belongs and the sign of that term flipped, so the report's Jacobian
  (eq. 58) is wrong in its y row; the two accelerations, each containing the other, are never solved together, so
  `jacobian` misses the coupling.
- **`Mechanical_Equations.mlx`:** the θ part of V has the wrong sign (the hanging rest would be unstable); the Drallsatz
  has `m_1*g*sin(theta)` without its lever l₁/2; `O_y` is used for `A_y`; `isolate(eq_6, …)` should be eq_7, so the
  Newton-equals-Lagrange check cannot hold; `I_1` stands for two inertias.
- **Report:** T's coupling term has the wrong sign (eq. 25–26; the final equations are right); the linearisation keeps
  θ̈·θ and ÿ·θ and is taken at y = 0 instead of y* = m_ges g/k (pp. 8–9); the mass matrix is not symmetric (p. 11); the
  design values give a pendulum at 1.6 Hz, outside the 3–10 Hz asked (p. 19); p. 15 cites Abb. 12 for Abb. 7.
- **`simscape_variables.m`:** `ylabel('phi [m]')` for rad; titles say M_2 for M_1; `tout`, `simout` used before any run.

## Left out of the task sheet

Tasks 1 (elastic pendulum: whether the block turns with the rod is unclear, 2 or 3 degrees of freedom), 4 (unbalance:
a prescribed rotation and rod data the sheet does not give), 8 (coupled pendulums: the double labels m₁, l₁ leave the
rods' geometry and the coupling point unclear), 9–12 (rolling discs: radii, inertias and where the springs attach are
not given or unclear) and 13 (robot manipulator: no link data; its dynamics are the double pendulum's). Each follows
from the lecture's Lagrange method once its geometry is fixed.

## MATLAB facts the code relies on

Read on the MathWorks reference pages on 7 Nov 2026 (bibliography.json, MathWorks 2026): `diff(L, diff(x(t),t))`
differentiates by a derivative (the diff page's own Euler–Lagrange example); `odeToVectorField` orders the states
Y[1] = x, Y[2] = ẋ and returns the order as S, then `matlabFunction(V,'vars',{'t','Y'})` gives ode45's handle;
`ode45(odefun,tspan,y0)` wants a column from odefun(t,y) and returns one row per time; `eig(K,M)` solves K·V = M·V·D,
so D holds λ = ω²; `bode` returns the magnitude as a ratio, 1×1×N; `jacobian(f,v)` puts ∂fᵢ/∂vⱼ at (i, j); the Sum
block takes one sign per input, the Integrator's initial condition defaults to 0. The pages were read and summarised by
a helper agent and not re-read word for word. **MATLAB and Octave are not installed here**: the snippets are checked for
names used before they are assigned (every view of every lab, tests/unit/matlab-defined.test.js), not run.

## Python beside the MATLAB

Every view also shows the same steps in Python, beside the MATLAB, and the Python panels run without a MATLAB licence
(Python 3 with numpy, scipy, sympy, matplotlib and python-control 0.10.2): sympy for the Lagrange recipe (`symbols`,
`Function`, `diff`, `solve`), `solve_ivp(f, t_span, x0)` with `f = lambda t, x: [...]` for ode45's `@(t,x) [...]`,
`scipy.linalg.eig(K, M)` for `eig(K,M)`, python-control for `ss`, `step`, `tf` and the frequency response.
`tests/unit/python-run.test.js` runs 41 of the 47 snippets and compares what they print with the lab: the
accelerations of the Lagrange equations at a test state, eigenfrequencies, poles, matrices, and solve_ivp's end state.
What Python cannot do: **Simulink and Simscape have no Python counterpart**, so those views give the parameters and
the blocks as comments and point to the ODE the motion view integrates; they and the chaotic double pendulum, which
only plots, are checked for undefined names only. Differences the snippets state (scipy and sympy pages, 7 Nov 2026):
`solve_ivp` defaults to RK45 with rtol 1e-3 and atol 1e-6 (ode45's RelTol and AbsTol defaults) and returns one row per
state where ode45 returns one row per time; `scipy.linalg.eig` returns complex eigenvalues in no promised order, so
they are sorted; sympy has no `odeToVectorField`, so `solve` gives the accelerations; MATLAB's `\` is
`np.linalg.solve`.

## Open it

Serve the repository's root and open `/modsim-lab/`:

```bash
python -m http.server 8772 --bind 127.0.0.1
```

Tests: `node --test "tests/unit/*.test.js"` in this folder. The README pictures: `node scripts/record-readme.mjs`, with
the server on port 8772 (see the script's head).

## Limits

Fixed-step Runge–Kutta (deterministic, the same on every visit); MATLAB's ode45 picks its own steps, so chaotic runs
part from it after a while. Most values are example values, labelled. The task-sheet labs have no solution sheet and
are worked here. The Simulink and Simscape models are described in words, not built: no .slx file was opened. A
learning aid; no text of the course is reproduced.
