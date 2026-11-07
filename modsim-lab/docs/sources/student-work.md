# Student group work of Gruppe E, ModSim, summer term 2021

Read on 2026-11-07 from `H:\My Drive\02_Personal\02_Education\FH\03_FH_Master\2. Semester\ModSim\` (read-only).
Authors: Abdulhamid Baghdadi, Markus Keck (Phase 1), plus Leopold Maurer (Phase 3). Reviewer: DI(FH) Anton Mario
Puhwein. Live scripts (.mlx) were unzipped from copies and `matlab/document.xml` read as text; line numbers for
.mlx files below are lines of that extracted code, counted per code block as noted.

## Files

| File | Content |
|---|---|
| `Teams - General\Matlab Script - Phase 1\aufgabe1.m` (11 lines) | Only defines the excitation `M_1(t)`. Identical to `Backup Theory\Matlab Script Aufgabe 1\aufgabe1.m`. |
| `Backup Theory\Matlab Script Aufgabe 1\aufgabe1.mlx` | Same as aufgabe1.m, plus `F_1(t)` and `syms g m_2 m_1 l_1 m3`. No equations. |
| `Teams - General\Matlab Script - Phase 1\Mechanical_Equations.mlx` | Main derivation: Newton-Euler (Schnittmethode) and Lagrange 2nd kind, symbolic. |
| `Teams - General\Matlab Script - Phase 1\Jacobian.mlx` = `Abgaben\Phase 1\Jacobian.mlx` (byte-identical) | Explicit ODEs typed in by hand, then `jacobian` for A and B. |
| `Teams - General\Simscape Script - Phase 2\` | `simscape.slx`, `simscape.slxc`, `simscape_variables.m`, `untitled.slx`, `slprj\` (build cache). Models not opened. |
| `simscape_variables.m` (41 lines) | Parameter values for the Simulink/Simscape models, and comparison plots. |
| `GruppeE-Phase1.pdf` (13 pp, 15 April 2021) | Phase 1 report; byte-identical to `Teams - General\Abgaben\Phase 1\GruppeE-Phase1.pdf`. |
| `Abgaben\Phase 3\BMS_SS2021_Baghdadi_Keck_Maurer.pdf` (25 pp, 30 June 2021) | Final report. |

## Task modelled

Task 2 of the sheet, **"Pendel mit Federaufhängung"** (sheet p. 1; Mechanical_Equations.mlx heading "Aufgabe 2:
Pendel mit Federaufhängung"; report Abb. 1). Generalised coordinates: `y` (vertical displacement of `m_2`,
downward positive) and `θ` (called `φ`/`varphi` in the Newton part and the scripts; rod angle from the downward
vertical). Inputs `F_1(t)` on `m_2` and `M_1(t)` at the pin.

Parameters (symbols as the group writes them):

| Symbol | Meaning | Simulation value (report Tab. 1, p. 14; simscape_variables.m) | Design value (report Tab. 2, p. 19) |
|---|---|---|---|
| m1 / `m_1` | rod mass | 0.1 kg | 0.6 kg |
| m2 / `m_2` | block mass | 0.1 kg | 0.1 kg |
| m3 / `m_3` | end point mass | 0.1 kg | 0.1 kg |
| l1 / `l_1` | rod length | 0.2 m | 0.1 m |
| k (`k_2` in mlx) | vertical spring | 10 N/m | 1000 N/m |
| c (`c_2`) | vertical damper | 10 N/(m/s) | 0.1 N/(m/s) |
| kphi / k_T (`k_1`) | torsion spring at pin | 40 Nm/rad | 4 Nm/rad |
| cphi / c_T (`c_1`) | rotary damper at pin | 0.4 Nm/(rad/s) | 0.1 Nm/(rad/s) |
| `g` | gravity | 9.80665 m/s² | |
| `F1`, `M1`, `omega_0` | excitation amplitudes and frequency | 2 N, 30 Nm, 10 rad/s | |

Derived: `m_s = m_1/2 + m_3`, `m_ges = m_1 + m_2 + m_3` (simscape_variables.m lines 5-6; report eq. 10-11).

## MATLAB style

**Symbols.** One long `syms` statement with `...` continuations, symbolic functions of t declared inline, and
"dot"/"ddot" names for derivatives even where they are not used:

```matlab
syms t theta(t) y_2(t) ...
    x_1 x_3 dot_x_1 dot_x_2 dot_x_3 dotdot_x_1 ...
```
(Mechanical_Equations.mlx, code block 1, lines 1-2.) In Jacobian.mlx the states are plain symbols instead:
`syms y y_dot y_ddot varphi varphi_dot varphi_ddot ...` (code lines 3-4). Names use LaTeX-like underscores
(`m_1`, `l_1`, `F_01`, `omega_1`, `phi_1`), and `sympref('AbbreviateOutput', false)` is set.

**Excitations** as symbolic functions:
```matlab
syms M_01 omega_1 phi_1 t M_1(t)
M_1(t) = M_01*cos(omega_1*t + phi_1)
```
(aufgabe1.m lines 10-11.) The sheet's Ω_1 is written `omega_1`.

**Geometry** by explicit coordinates of the centres of mass, then `diff(...,t,2)`:
```matlab
x_1 = l_1/2*sin(theta);
y_1 = y_2 + l_1/2*cos(theta);
```
(Mechanical_Equations.mlx block 1, lines 21-22.)

**Newton-Euler** written as symbolic equations and solved for the cut force with `solve`:
`eq_3 = A_y == (m_1 + m_3)*g - m_1*diff(y_1, t, 2) - m_3*diff(y_3, t, 2); A_y = solve(eq_3, A_y)` (block 3).

**Lagrange recipe.** V and T written by hand, generalised forces Q include the damping (no Rayleigh function D),
and the Euler-Lagrange operator is applied with `diff` on the symbolic functions (no `functionalDerivative`):
```matlab
Q_theta = M_1 - c_1*diff(theta);
eq_6 = diff( diff(T, diff(theta(t),t)), t) - diff(T,theta) + diff(V, theta) == Q_theta;
```
(Mechanical_Equations.mlx, Lagrange block, lines 12 and 15.) No explicit `L = T - V`.
Cross-check of Newton against Lagrange with `isolate(eq, diff(theta,t,2))` and `isequaln` (lines 20-30).

**Explicit ODE.** Not obtained in code: the two accelerations are typed in by hand in Jacobian.mlx, each still
containing the other acceleration:
```matlab
y_ddot = (F_1 + m_ges*g - c*y_dot - k*y -m_s*l_1*(y_dot^2*cos(varphi) - varphi_ddot*sin(varphi)))/(m_ges);
varphi_ddot = (M_1 - c_phi*varphi_dot - k_phi*varphi - g*l_1*m_s*sin(varphi) + y_ddot*l_1*m_s*sin(varphi))/(l_1^2*(m_1/3 + m_3));
y_ddot = subs(y_ddot);
```
(Jacobian.mlx lines 9-11 of the code block.)

**Linearisation** via `jacobian` on the state vector [y; varphi; y_dot; varphi_dot] and input [F_1; M_1]:
```matlab
J_A = jacobian([y_dot, varphi_dot, y_ddot, varphi_ddot], [y; varphi; y_dot; varphi_dot]);
J_B = jacobian([y_dot, varphi_dot, y_ddot, varphi_ddot], [F_1; M_1]);
```
(Jacobian.mlx lines 16-17.) No substitution of an operating point in code.

**Not used anywhere** in the scripts found: `odeToVectorField`, `matlabFunction`, `ode45`, anonymous functions,
`eig`, `ss`, `functionalDerivative`. Time simulation was done in Simulink (integrator blocks; report Abb. 5-6) and
Simscape Multibody (Abb. 7-8), driven by workspace variables from `simscape_variables.m`. The frequency response
(Abb. 11-12) has no script in these folders.

**Plotting** (simscape_variables.m lines 24-31): Simulink as dots, Simscape as line, multi-line title cell,
`legend(...,'Location','southeast')`, `hold on/off`, `figure()`:
```matlab
plot(time, y_simulink,'.','MarkerSize',15)
hold on
plot(time, y_simscape,'-','linewidth',2)
```
Results read from `To Workspace` arrays: `time = tout(:,1); y_simulink = simout(:,1);` (lines 18-19).

## Slips

Checked against my own Lagrange derivation for this system (y downward, θ from downward vertical, centre of mass
of the rod at l_1/2): `m_ges ÿ − m_s l_1 (θ̈ sin θ + θ̇² cos θ) + c ẏ + k y − m_ges g = F_1` and
`l_1²(m_1/3 + m_3) θ̈ − m_s l_1 ÿ sin θ + m_s g l_1 sin θ + c_T θ̇ + k_T θ = M_1`. The report's eq. 9, 14, 38 and 42
agree with these. (Status: hand-checked.)

1. **Jacobian.mlx, line 9 (y_ddot): wrong variable and wrong sign in the centripetal term.** Script:
   `-m_s*l_1*(y_dot^2*cos(varphi) - varphi_ddot*sin(varphi))`. Report eq. 12 (p. 4) and the correct equation:
   `+m_s*l_1*(varphi_dot^2*cos(varphi) + varphi_ddot*sin(varphi))`. `y_dot^2` should be `varphi_dot^2`, and that
   term's sign is flipped. The φ̈ term is correct (−·− = +). Consequently the Jacobian printed in the report
   (eq. 58, p. 13), which is this script's output, is wrong in the y-row.
2. **Jacobian.mlx, lines 9-11: coupled accelerations not solved.** `varphi_ddot` contains the symbol `y_ddot`
   and `y_ddot` contains `varphi_ddot`; `subs(y_ddot)` replaces `varphi_ddot` once, leaving the symbol `y_ddot` on
   the right-hand side, and `varphi_ddot` keeps `y_ddot` as a free symbol. `jacobian` then treats `y_ddot` as an
   independent constant, so ∂f/∂x misses the coupling. The pair must be solved simultaneously (e.g.
   `solve([e1,e2],[y_ddot,varphi_ddot])` or M\(…)).
3. **Mechanical_Equations.mlx, Lagrange block line 1: gravity term of θ in V has the wrong sign.**
   `V = ... + l_1*g*cos(theta)*(m_1/2 + m_3) - g*y_2*(m_1+m_2+m_3)`. With y downward the height is −(y + r cos θ),
   so the θ-part is `−l_1 g cos θ (m_1/2 + m_3)` (or the report's `+l g (1 − cos θ)(m_1/2+m_3)`, eq. 33, p. 6).
   As written, ∂V/∂θ = −g l_1 m_s sin θ: the hanging position would be unstable. The script and report disagree.
4. **Mechanical_Equations.mlx, block "Drallsatz um den Lagerpunkt O": missing lever arm.**
   `-m_1*g*sin(theta)` has units of force in a moment equation; it should be `-m_1*g*l_1/2*sin(theta)`.
5. **Mechanical_Equations.mlx, Drallsatz block: `A_x` never determined.** The equation that would give `A_x`
   (`eq_1`) is commented out, so `A_x` stays a free symbol in `eq_4`.
6. **Mechanical_Equations.mlx, block "P2": `O_y` instead of `A_y`.** `eq_5 = m_2*diff(y_2,t,2) == m_2*g + O_y +
   F_1 - F_k2 - F_c2` uses `O_y`, which is never defined or solved; the pendulum force solved for just before is
   `A_y`. (`O` is also the name of the pivot used in the Drallsatz, while the report calls the pin `A`.)
7. **Mechanical_Equations.mlx, Lagrange block line 19: wrong equation isolated.** `a2 = isolate(eq_6,
   diff(y_2, t, 2))` should use `eq_7` (the y-equation); `eq_6` is the θ-equation. The following `isequaln(a1,a2)`
   therefore cannot confirm Newton = Lagrange, contrary to the report's claim (p. 4) that both give the same result.
8. **Mechanical_Equations.mlx: `I_1` used for two different inertias.** In the Drallsatz about the pivot (`eq_4`)
   `I_1` must be the inertia about O; in T (`I_1/2*diff(theta)^2 + m_1/2*(diff(x_1,t)^2 + diff(y_1,t)^2)`) it must
   be about the centre of mass, else the rod's inertia is counted twice. The report resolves this
   (J_1 = m_1 l²/12, eq. 18, p. 5) but the script leaves it undefined.
9. **Report eq. 25-26 (p. 6): sign of the coupling term in T.** From eq. 19, ẏ_m1 = ẏ − (l/2) sin θ θ̇, but eq. 25
   writes `(ẏ + l/2 · sinθ · θ̇)²` (and likewise for m_3), and eq. 26 has `+ l·ẏ·θ̇·sinθ`. The resulting equations
   eq. 38 and 42 have the correct signs, so the error is in the printed T only.
10. **Report p. 9, eq. 47 and 49: linearisation keeps products of small quantities.** Eq. 49 keeps `θ̈·θ`, eq. 47
    keeps `ÿ·θ`; tangent linearisation about the rest point drops them (the θ̇² term was dropped
    correctly), so the "linearised" equations are still not linear.
11. **Report p. 9 vs p. 8: operating point.** Linearisation is said to be at "θ=0 und y=0", but the equilibrium
    found on p. 8 (eq. 44) is y = (m_1+m_2+m_3) g / k, not 0.
12. **Report p. 11, matrix form: mass matrix not symmetric and not constant.** M has off-diagonal entries
    `−l_1(m_1/2+m_3)θ` and `+l_1(m_1/2+m_3)θ` with opposite signs; from eq. 42/38 both should be
    `−l_1(m_1/2+m_3) sin θ` (≈ θ). A θ-dependent M also makes the "linear" form ẋ = A x + b u (written there as
    "x = A·x + b·u", missing the dot) not linear.
13. **Report p. 19 vs p. 18: design frequency.** The range asked is 3-10 Hz. With Tab. 2 (l_1 = 0.1 m) the
    pendulum formula eq. 62 gives f = (1/2π)√(9.81/0.1) ≈ 1.58 Hz, outside the range; only the spring mode
    (eq. 63: (1/2π)√(1000/0.8) ≈ 5.6 Hz) lies inside. The stated "5,8 Hz" is close to the plot peak (Abb. 11)
    but does not follow from eq. 63 exactly [my arithmetic, not checked against the model].
14. **Report p. 15: wrong figure reference.** "In Abbildung 12 wird diese Vereinfachung dargestellt" refers to the
    Simscape model, which is Abb. 7; Abb. 12 is the Bode diagram.
15. **simscape_variables.m, line 40: wrong unit.** `ylabel('phi [m]')`: φ is an angle, unit rad.
16. **simscape_variables.m, lines 28 and 38: name mismatch.** Titles say `M_2(t) = 30*cos(10*t) Nm`, but the moment
    is `M1`/`M_1(t)` everywhere else (line 15; sheet task 2).
17. **simscape_variables.m, lines 18-22: variables used before defined.** `tout` and `simout` come from a
    previous Simulink run; run on a clean workspace, the script fails at line 18. The parameter part (lines 1-16)
    must run before the model, the plot part after it, so the one script mixes two steps.
18. **Naming inconsistency across files.** Spring/damper are `k_1, c_1` (torsion) and `k_2, c_2` (vertical) in
    Mechanical_Equations.mlx, `k_phi, c_phi, k, c` in Jacobian.mlx and simscape_variables.m, and `k_T, c_T, k, c`
    in the report; the angle is `theta`, `varphi`, `φ` and `θ` (report eq. 45 gives the θ rest position as "φ = 0").
    The excitation frequency is `omega_1` in aufgabe1.m but `omega_0` in simscape_variables.m.
19. **aufgabe1.mlx: `m3` without underscore** (`syms g m_2 m_1 l_1 m3`) while all other masses are `m_1, m_2`;
    report eq. 38-49 also mixes `m3` and `m_3`.

## Phase 3 report (BMS_SS2021_Baghdadi_Keck_Maurer.pdf)

Title "Aufbau eines 2-Massenschwingermodells", 30 June 2021. Printed page numbers = PDF page − 2.

- p. 1: Aufgabenstellung, task 2 figure with y and θ added (Abb. 1); goals: analytic model, ODE, linearisation,
  matrix form, state space, Jacobian, comparison.
- pp. 2-4 (§2.1): Newton-Euler with free-body diagrams of `m_2` (Abb. 2) and the pendulum (Abb. 3); eq. 1-15,
  explicit ÿ (eq. 12) and φ̈ (eq. 15). §2.1.2: no closed-form solution with dsolve or Wolfram Alpha.
- pp. 4-7 (§2.2): Lagrange 2nd kind, q_1 = y, q_2 = θ; T (eq. 16-26), V (eq. 27-33), Q_θ = M_1 − c_T θ̇,
  Q_y = F_1 − c ẏ (eq. 34-35); equations eq. 36-43.
- p. 8 (§3): equilibria y = m_ges g/k, θ = 0.
- p. 9 (§4): tangent linearisation at θ = 0, y = 0 (eq. 46-49). §5: state-space definition (eq. 50-52).
- pp. 10-11 (§5.1): matrix form M, C, K, F.
- pp. 11-13 (§6): states x = [y, φ, ẏ, φ̇], u = [F_1, M_1]; general Jacobian; symbolic ∂f/∂x (eq. 58) and ∂f/∂u
  (eq. 59) printed sideways, from Jacobian.mlx (Anhang A, p. 23, Abb. 13).
- pp. 14-18 (§7): parameters (Tab. 1), Simulink model (Abb. 5-6), Simscape Multibody model (Abb. 7: plate, rod with
  two spheres; Abb. 8: block diagram with World, prismatic joint driven by F_1(t) with y-simscape output, revolute
  joint driven by M_1(t) with phi-simscape output, rigid transforms, solids; spring and damper set inside the
  joints, not drawn). Comparison Simulink vs Simscape for φ and y (Abb. 9-10): curves coincide.
- pp. 18-21 (§8): design for 3-10 Hz: pendulum and spring-mass natural frequency formulas (eq. 62-63), new
  parameters (Tab. 2), resulting 5.8 Hz; frequency response of block and pendulum (Abb. 11, peak near 5.7 Hz) and
  Bode diagram (Abb. 12).
- p. 23: Anhang A, screenshot of Jacobian.mlx.

The Phase 1 report (`GruppeE-Phase1.pdf`, 15 April 2021, 13 pp) has the same §1-2 structure, plus §2.2.5
Eigenfrequenz and §4.1-4.2 Jacobian and state space; no simulation.
