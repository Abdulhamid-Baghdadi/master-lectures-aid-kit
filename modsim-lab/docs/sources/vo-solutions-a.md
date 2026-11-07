# ModSim VO worked examples, part A (PDF pp. 1-23)

Source: "VO-Aufgaben-mit-Lösungen.pdf", FH Technikum Wien, ModSim lecture, A. Mario Puhwein (header
"Aufgabenstellung mechatronischer Systeme", footer "© FHWN", 46 pp.). Transcribed from page images (110 dpi), not
from the text layer. Pages 24-46 are in the companion file (part B).

Coverage of this part: task overview of all 8 examples (pp. 1-5), full solutions of Example 1 Ein-Massen-Schwinger
(pp. 7-9), Example 2 Pendel (pp. 10-18) and Example 3 Pendel mit Rolle (pp. 19-23, continues on p. 24+).
Page 6 is blank. Statements are summarised; equations are copied as printed. Where I re-derived a result it says
"checked" or what differs.

Notation: `x'`, `x''` are not used; dots are written as Unicode (ẋ, ẍ, φ̇, φ̈). Θ is the source's symbol for mass
moment of inertia.

---

## Introductory page (p. 1)

- Heading "Vorlesung". Rule: the degrees of freedom are fixed at the start and must not be changed during the
  calculation (p. 1).
- Figure "1 Freiheitsgrad System (1-Degree of Freedom)", "Freie Schwingung (Ruhelage, Gleichgewichtslage,
  Anfangsbedingung)": three hanging spring-mass sketches, gravity g downward; unstretched length l₀, static
  deflection x_stat, displacement x(t) measured from the static equilibrium, total length l(t) (p. 1).
- Anfangsbedingungen (AB): x(t = 0) = x₀, ẋ(t = 0) = ẋ₀ = v₀ (p. 1).

## Task statements, "Vorlesungsbeispiele" (pp. 2-5)

1. Ein-Massen-Schwinger (p. 2): mass m₁ on a floor, coordinate x to the right, wall connection by spring k in
   parallel with damper c; force F₁(t) = F₀₁ cos(Ω₁t + φ₁) to the right; g downward.
2. Pendel (p. 2): point mass m on a rod of length L₁, angle φ from the vertical; at the pivot a Drehfeder and
   Torsionsdämpfer; drive moment M₁(t) = M̂₁ cos(Ω₁t + φ₁); g downward.
3. Pendel mit Rolle (p. 3): rod m₁ (centre S₁) hinged at O, length L₁, angle φ₁ measured from the horizontal x-axis
   (y downward, z out of page); at its end a roller (disc) m₂, radius r, centre S₂, rolling on a circular track;
   spring k from a fixed point at horizontal distance L₁ from O and height L₂ above the x-axis to S₂; spring length
   S(φ₁); roller angle φ₂, marked point P on the roller.
4. Elektrischer Schwingkreis (RLC) (p. 3): series C, L, then R to ground; input u(t), current i(t), voltages u_C(t),
   u_L(t), u_R(t); output y(t) = voltage across R.
5. Zwei-Massen-Schwinger (p. 4): wall - spring/damper - m₁ - spring/damper - m₂; forces
   F₁(t) = F₀₁ cos(Ω₁t + φ₁) on m₁ and F₂(t) = F₀₂ cos(Ω₂t + φ₂) on m₂; g downward. Springs and dampers are unlabelled
   in the figure.
6. Doppelpendel (p. 4): two rods each "m, L", hinge O and joint A; φ₁ of rod 1 and φ₂ of rod 2, both measured from
   the vertical; g downward.
7. E-Motor (p. 5): armature circuit u_A with R_A (voltage u_R), L_A (u_L), current i_A, back-EMF u_M; shaft with
   ω = φ̇ through a bearing ("Lager") to a load inertia J ("Last").
8. Elektromechanischer Shaker (bzw. Lautsprecher) [3] (p. 5): U_in = U_S, current i_S, coil resistance R_S, magnet
   B_S, moving mass m_S with spring k_S and damper d_S to ground, displacement x, force F_S. (The coil-radius label
   is also printed "R_S" on the coil, p. 5.)

Examples 4-8 have no solution pages in pp. 1-23.

---

## Example 1: Ein-Massen-Schwinger (pp. 7-9)

Heading "Lösung der Vorlesungsbeispiele:" (p. 7). Same sketch as p. 2.

### Symbols (p. 7)
- m₁ (in the figure) / m (in the equations): mass. x: displacement. k: spring stiffness. c: damping constant.
- F₁(t) = F₀₁ cos(Ω₁t + φ₁) (figure); free-body label F₁(t) = F̂₀₁ cos(Ω₁t + φ₁).
- x₀, ẋ₀: reference (unstretched) position and velocity of the spring/damper end.
- Free-body diagram: F_k = k Δx = k (x − x₀) and F_c = c Δẋ = c (ẋ − ẋ₀) to the left; d'Alembert inertia m ẍ to
  the left; N upward; friction R ≤ N μ_H to the left (not used further).

### a. Lösung (p. 7)
Text: solution by the d'Alembert principle "und unter der Vernachlässigung der Dämpfung" in x-direction:

    m ẍ + F_c + F_k = F₁
    m ẍ + c (ẋ − ẋ₀) + k (x − x₀) = F₁

DGL in der Form für Simulink (p. 7):

    ẍ = F₁/m − (c/m)(ẋ − ẋ₀) − (k/m)(x − x₀)

Checked (Newton in x).

Eigenkreisfrequenz des linearen ungedämpften Systems (p. 7): ω₀ = √(k/m)
Eigenfrequenz (p. 8): f₀ = ω₀ / (2π)
Periodendauer (p. 8): T₀ = 1 / f₀
Eigenfrequenz des linearen gedämpften Systems (p. 8): ω_D = √(ω₀² − (c/(2m))²)
All checked (standard results for m ẍ + c ẋ + k x = 0).

### b. Zustandsraumdarstellung (ZRD) (p. 8)
Substitution F₁(t) = u(t); states x(t) = x₁(t), ẋ(t) = x₂(t).

    ẋ(t) = x₂(t) = ẋ₁(t)
    ẋ₂(t) = (1/m) u(t) − (c/m) x₂(t) − (k/m) x₁(t)

General form: ẋ(t) = A x(t) + B u(t), y(t) = C x(t) + D u(t) (vectors/matrices underlined in the source).

    [ẋ₁; ẋ₂] = [0 1; −k/m −c/m] · [x₁; x₂] + [0; 1/m] u(t)

C and D are not given on p. 8 (page ends here). Checked, with x₀ = ẋ₀ = 0 (see slips).

### c. Simulink und Simscape Modell (p. 9)
Figure titled "Mass-Spring-Damper in Simulink and Simscape" (appears to be a MathWorks example model; it carries
the links "Plot spring deflection (see code)", "Explore simulation results using sscexplore", "Learn more",
"Open model of double mass-spring-damper", "Learn more about modeling physical networks").

Simulink part ("Simulink Model"):
- Clock → Fcn `10*sin(2*pi*u)` (force input, amplitude 10, 1 Hz; unit not shown).
- Fcn output → Sum with signs (+, −, −) → Gain `1/m` (label "1/Mass") → signal `a` → Integrator `1/s` → signal `v`
  → Integrator `1/s` (initial condition "x0 = 0 m") → signal `x`.
- Feedback: v → Gain `b` ("Damping") → Sum (−); x → Gain `k` ("Stiffness") → Sum (−).
- v → Goto tag `v_sl`.

Simscape part ("Simscape Model"):
- Fcn output also → Simulink-PS Converter (`SPS`) → Ideal Force Source (ports C, R, S) referenced to a Mechanical
  Translational Reference (ground symbol at top).
- Force source port R → common node with Mass, Damper and Spring (Spring parameter "x0 = 0 m"); Damper and Spring
  ports C to a second Mechanical Translational Reference at the bottom.
- A tag `v_sc` on that node (velocity measurement; the sensor block is [unclear: not drawn separately, only the
  tag]).

Display: From tags `v_sc` ("Simscape") and `v_sl` ("Simulink") → Mux → Scope "Velocity of Mass".
Parameter values m, b, k are not shown in the figure.

---

## Example 2: Pendel (pp. 10-18)

### Figure and symbols (p. 10)
- Point mass m on a massless rod of length L₁, pivot at the origin; x to the right, y downward, z out of page.
- φ: angle from the downward vertical (y-axis), positive counter-clockwise as drawn (green arrow).
- M₁(t) = M̂₁ cos(Ω₁t + φ₁): drive moment at the pivot (arrow drawn opposite to φ).
- Drehfeder (torsion spring) k_D, Torsionsdämpfer (torsion damper) c_D at the pivot. g downward.

### a. Lösung nach der Newton'schen Schnittmethode (p. 10)
Free body about the bearing (A) with reactions A_x, A_y:
- M₁(t) = M̂₁ cos(Ω₁t + φ₁)
- M_k = k_D Δφ = k_D (φ − φ₀)
- M_c = c_D Δẋ = c_D (φ̇ − φ̇₀)
- inertia Θ^(A) φ̈
- weight mg, split into mg sin(φ) (tangential) and mg cos(φ) (along the rod).

Drallsatz um den Lagerpunkt (p. 10):

    Θ φ̈ + M_c + M_k = −M₁(t) − m g L₁ sin(φ)
    m L₁² φ̈ + k_D (φ − φ₀) + c_D (φ̇ − φ̇₀) = −M₁(t) − m g L₁ sin(φ)

DGL in der Form für Simulink (p. 10):

    φ̈ = 1/(m L₁²) · [ −M₁(t) − m g L₁ sin(φ) − k_D (φ − φ₀) − c_D (φ̇ − φ̇₀) ]

Checked (point mass, Θ = m L₁², M₁ acting against φ as drawn).

Eigenkreisfrequenz des linearen ungedämpften Systems (ohne Feder/Dämpfer) (p. 11):

    m L₁² φ̈ = −m g L₁ sin(φ)
    m L₁² φ̈ + m g L₁ sin(φ) = 0      (m and one L₁ struck through)
    φ̈ + (g/L₁) sin(φ) = 0
    ω₀ = √(g/L₁)

Linearised with sin(φ) ≈ φ (p. 11):

    φ̈ + c_D/(m L₁²) φ̇ + (g/L₁) φ + k_D/(m L₁²) φ = −M₁(t)/(m L₁²)

Checked (with φ₀ = φ̇₀ = 0).

### b. Lösung nach den Lagrange'schen Gleichungen 2. Art [4] (pp. 11-13)
General form for non-conservative systems with a quasi damper potential (p. 11):

    d/dt(∂L/∂q̇_k) − ∂L/∂q_k + ∂D/∂q̇_k = Q_k^(nk)

L(q_k, q̇_k) = K(q̇_k) − V(q_k); K total kinetic energy, V potential, q_k k-th generalised coordinate (p. 11).
Text: with Θ^(S₁) about centre of mass S₁ and Steiner term m L₁²: "m L₁² Θ^(O) = Θ^(S₁) + m L₁² wobei
Θ^(S) = m L₁²/12" (printed thus, p. 11; see slips).

Kinetic energy (rotation about O; text refers to "Abb. XX") (p. 11):

    K = ½ Θ^(O) φ̇₁²
    K = ½ m₁ L₁² φ̇₁²

Here the coordinate is renamed φ₁ and the mass m₁ (p. 11 onward).

Potential of gravity, zero level chosen at φ₁ = π/2 (p. 12):

    V_G = −m₁ g L₁ sin(φ₁)

Torsion spring (p. 12): V_F = ½ k_D [φ₁ − φ₀]²
Quasi potential of the damper (p. 12): D = ½ c_D [φ̇₁ − φ̇₀]²
Spring relaxed in the downward vertical: φ₀ = 0 and φ̇₀ = 0 (p. 12).

Lagrange function (p. 12):

    L = K − (V_G + V_F) = ½ m₁ L₁² φ̇₁² + m₁ g L₁ sin(φ₁) − ½ k_D φ₁²

With q_k = φ₁ (p. 12):

    ∂L/∂φ̇₁ = m₁ L₁² φ̇₁
    d/dt(∂L/∂φ̇₁) = m₁ L₁² φ̈₁
    ∂L/∂φ₁ = −m₁ g L₁ cos(φ₁) − k_D φ₁ 1      (stray "1" as printed)

Generalised force from virtual work [4] (pp. 12-13):

    δW = Σ_{i=1}^{n} Q_i δq_i
    δW = −M₁(t) δΔφ
    δW = −M₁(t) δ(φ₁ − φ₀)
    δW = −M₁(t) δφ₁ + M₁(t) δφ₀

    Q_φ₁^(n.k.) = −M₁(t),   Q_φ₀^(n.k.) = M₁(t)

Result, "wieder die BGL des Pendels" (p. 13):

    φ̈ = 1/(m L₁²) · [ −M₁(t) − m g L₁ sin(φ) − k_D (φ − φ₀) − c_D (φ̇ − φ̇₀) ]

Check: the final equation is correct, but it does not follow from the printed V_G and ∂L/∂φ₁ (see slips). With the
correct V_G = −m g L₁ cos(φ) (zero at the pivot), ∂L/∂φ = −m g L₁ sin(φ) − k_D φ, and the stated result follows.

### c. ZDR (p. 13)
States φ(t) = φ₁(t), φ̇(t) = φ₂(t); substitution M₁(t) = u(t).

    φ̇(t) = φ₂(t) = φ̇₁(t)
    φ̇₂(t) = (1/(mL²)) u(t) − (c_D/(mL²)) φ₂(t) + (g/L) φ₁(t) + (k_D/(mL²)) φ₁(t)      (as printed)

    [φ̇₁; φ̇₂] = [0 1; −k_D/(mL²) − g/L   −c_D/(mL²)] · [φ₁; φ₂] + [0; 1/(mL²)] u(t)

(L without index here.) The matrix A is the linearised (sin φ ≈ φ) system and is checked for its stiffness and
damping entries; the B sign differs from the ODE (see slips).

### d. Gleichgewichtslage (pp. 13-15)
Set φ̇ = 0 and φ̈ = 0 (p. 13):

    (g/L) sin(φ) = 0
    sin(φ) = 0 für alle φ = φ₀ = nπ, wobei n = 0, 1, 2, 3 …

Stability (p. 14): small disturbance ε ≪ 1 about φ₀ = 0 and φ₀ = π:

    φ = φ₀ + ε,  φ̇ = ε̇,  φ̈ = ε̈
    ε̈ = −(g/L) sin(φ₀ + ε)
    ε̈ = −(g/L) [sin(φ₀) cos(ε) + cos(φ₀) sin(ε)]

φ₀ = 0 (p. 14): ε̈ + (g/L) sin(ε) = 0; Taylor-linearised ε̈ + ω² ε = 0; Ansatz ε = C e^(αt);
α² C e^(αt) + ω² C e^(αt) = 0 (struck through); α² = −ω², α = jω;
ε = C e^(jωt) = C(cos(ωt) + j sin(ωt)) (p. 15). Bounded by cos and sin, hence "stabile Gleichgewichtslage" (p. 15).

φ₀ = π (p. 15): sin(π) = 0, cos(π) = −1:

    ε̈ = −(g/L)[−sin(ε)] = (g/L) sin(ε)
    ε̈ − (g/L) sin(ε) = 0
    ε̈ − ω² ε = 0
    α² C e^(αt) − ω² C e^(αt) = 0,  α = ω,  ε = C e^(ωt)

ε → ∞ for t → ∞: "instabile Gleichgewichtslage" (p. 15). Checked (ω² = g/L, implied but not written; the root
α = −ω is not mentioned, which does not change the conclusion).

Extended stability check via the Jacobian [5] (p. 16):
- Figure "Fig. 2.6 Type and local stability of equilibrium points for a two state linear(ised) system", reproduced
  from [5]; caption "Abb. YY": regions in the (tr(A), det(A)) plane: stable nodes / stable spirals (tr < 0,
  det > 0), centres (tr = 0, det > 0), unstable spirals / unstable nodes (tr > 0, det > 0), saddles (det < 0),
  separated by the parabola Δ = 0, Δ < 0 inside (spirals), Δ > 0 outside (nodes) (p. 16).
- Figure "Abb. XX": phase portraits from [5]: a) "Fig. 2.4 Phase portrait for the undamped pendulum" (rotation,
  oscillation, separatrix; x₁ from −2π to 2π, x₂ from −10 to 10); b) "Fig. 9.1 Pendulum equation phase portrait with
  damping" (p. 16).

Simplified pendulum equation, to compare with the textbook [5] of Wagg and Neild (pp. 16-17):

    θ̈ + δ θ̇ + ω² sin(θ) = 0

θ: deflection angle; δ: damping constant; ω = √(g/L₁) natural angular frequency (p. 17).

First-order system (p. 17): θ(t) = x₁(t), θ̇(t) = ẋ₁(t) = x₂(t);

    ẋ₁ = x₂ = f₁
    ẋ₂ = −δ x₂ − ω² sin(x₁) = f₂

For δ > 0 the equilibria lie at x₂ = 0 and x₁ = 0, ±nπ, n = 1, 2, 3, … (p. 17).

Jacobian (p. 17):

    D_x f = ∂(f₁, f₂)/∂(x₁, x₂) = [∂f₁/∂x₁ ∂f₁/∂x₂; ∂f₂/∂x₁ ∂f₂/∂x₂] = [0 1; −ω² cos(x₁)  −δ]

Checked.

x* = (2nπ, 0) (p. 17): D_{x*} f = [0 1; −ω² −δ]; tr(A) = −δ, det(A) = ω² → second quadrant of Abb. YY.
Eigenvalues λ₁,₂ = −δ/2 ± ½ √(δ² − 4ω²); with Δ = δ² − 4ω² and "the fact" δ² < 4ω², Δ < 0, so λ₁,₂ complex and the
equilibria are "stabile Wirbel" (stable spirals) (pp. 17-18). Checked for δ² < 4ω².

x* = ((2n+1)π, 0) (p. 18): D_{x*} f = [0 1; ω² −δ]; tr(A) = −δ, det(A) = −ω² → text says "im ersten Quadranten";
saddle points for all δ (p. 18). Checked except the quadrant (see slips).

In −2π ≤ θ ≤ 2π with δ² < 4ω² there are 5 equilibria: (0,0), (−2π,0), (2π,0) stable spirals ("stabile Wirbel");
(−π,0), (π,0) unstable saddles (p. 18).

### e. Simulink und Simscape Modell (p. 18)
Figure "Single Pendulum in Simulink and Simscape Multibody" (appears to be a MathWorks example; links "Plot joint
angle (see code)", "Explore simulation results using sscexplore", "Learn more about this example", "Open model of
double pendulum", "Learn more about multibody modeling").

Simulink part:
- Clock → Fcn `1*sin(2*pi*u)` → Sum (+, +) → Integrator `1/s` → Integrator `1/s` (initial condition
  "theta1_0*pi/180 rad") → signal `theta1` → Goto `q1_sl`.
- Feedback: theta1 → `sin` (Trigonometric Function) → Gain `-g/L` → Sum (+).
- No damping or spring gain in this loop; the input enters the acceleration sum directly.

Simscape Multibody part ("Simscape Multibody Model"), top to bottom:
- [unclear: a block with a coordinate-frame icon at the top, most likely World Frame / Mechanism Configuration /
  Solver Configuration combined; labels not readable at this resolution] → `Pivot` (rigid transform) →
  `Revolute Joint 1` → `Link 1`.
- Fcn output → Simulink-PS Converter `SPS` → torque input of Revolute Joint 1 (red physical-signal line).
- Revolute Joint 1 angle sensing → `q1_sm`.

Display: From `q1_sm` ("theta1 SM") and `q1_sl` ("theta1 SL") → Mux → Scope "Joint Angle".
No parameter values (g, L, theta1_0) are shown.

---

## Example 3: Pendel mit Rolle [1] (pp. 19-23, continued in part B)

### Figure and symbols (p. 19)
"Abb. XX: Pendel mit Rolle [1]":
- O: hinge of the rod, origin; x to the right, y downward, z out of page.
- m₁: rod, centre S₁ (at L₁/2), length L₁, angle φ₁ from the x-axis (positive towards y, i.e. downward).
- m₂: roller, centre S₂ at the rod end, radius r, angle φ₂, point P on its rim; rolls on a circular track.
- k: spring from the fixed point (horizontal distance L₁ from O, height L₂ above the x-axis) to S₂, length S(φ₁).
- g downward.

Freikörperdarstellung (p. 19): rod with weight m₁g at its centre, at its end the pin force S_x, S_y and the spring
force F_F at angle ψ to the horizontal; roller with S_x, S_y (opposite), weight m₂g, contact point (A) with tangential
force T and normal force N.

### a. Lösung nach der Newton'schen Schnittmethode (pp. 19-21)
Free both masses; centre-of-mass theorem in x and y and Drallsatz in z for both (p. 19).

Drallsatz für m₁ um O (p. 20):

    Θ_O^(1) φ̈₁ = −S_x L₁ sin(φ₁) + S_y L₁ cos(φ₁) + m₁ g (L₁/2) cos(φ₁)
                 − [F_F cos(ψ)] L₁ sin(φ₁) − [F_F sin(ψ)] L₁ cos(φ₁)

    Θ_O^(1) = m₁ L₁² / 3

Spring inclination ψ (p. 20):

    cos(ψ) = L₁[1 − cos(φ₁)] / S(φ₁) = (1 − cos(φ₁)) / (2 S(φ₁))
    sin(ψ) = (0.25 + L₁ sin(φ₁)) / S(φ₁) = (1 + 2 sin(φ₁)) / (4 S(φ₁))
    S(φ₁) = √( {L₁[1 − cos(φ₁)]}² + [0.25 + L₁ sin(φ₁)]² )

The second forms imply L₁ = 0.5 and L₂ = 0.25 (units not stated; these values are not given explicitly on
pp. 1-23). Geometry checked: anchor at (L₁, −L₂), rod end at (L₁ cos φ₁, L₁ sin φ₁).

Federkraft (p. 20): F_F = k (S(φ₁) − l₀), l₀ = unstretched spring length.

Drallsatz der Rolle um (A) (p. 20):

    Θ_A^(2) φ̈₂ = S_x r sin(φ₁) − S_y r cos(φ₁) + m₂ g r cos(φ₁)
    Θ_A^(2) = (3/2) m₂ r²

Kinematics (p. 21): v_S₂ = L₁ φ̇₁ = r φ̇₂, L₁ φ̈₁ = r φ̈₂.

Printed substitution (p. 21; the r on the left and in the gravity term is struck through):

    S_x sin(φ₁) − S_y cos(φ₁) = (3/2) m₂ r² φ̈₁ − m₂ g cos(φ₁)      (r² with one r struck)

Inserted into the Drallsatz of m₁ (p. 21):

    Θ_O^(1) φ̈₁ = −L₁ [ (3/2) m₂ r φ̈₁ − m₂ g cos(φ₁) ] + m₁ g (L₁/2) cos(φ₁)
                 − k (S(φ₁) − l₀)(cos(ψ) sin(φ₁) + sin(ψ) cos(φ₁))

    cos(ψ) sin(φ₁) + sin(ψ) cos(φ₁) = (2 sin(φ₁) + cos(φ₁)) / (4 S(φ₁))

Equation of motion (p. 21):

    (m₁L₁²/3 + (3/2) m₂ r) φ̈₁ − m₂ g L₁ cos(φ₁) − m₁ g (L₁/2) cos(φ₁)
        + k (S(φ₁) − l₀) (2 sin(φ₁) + cos(φ₁)) / (4 S(φ₁)) = 0

Called a "nichtlineare gewöhnliche Differentialgleichung 2. Ordnung mit konstanten Koeffizienten", solvable in
Matlab/Simulink (p. 21). Form for Simulink (p. 21):

    φ̈₁ = 1/(m₁L₁²/3 + (3/2) m₂ r) · [ m₂ g L₁ cos(φ₁) + m₁ g (L₁/2) cos(φ₁)
           − k (S(φ₁) − l₀) (2 sin(φ₁) + cos(φ₁)) / (4 S(φ₁)) ]

Check: the identity cos ψ sin φ₁ + sin ψ cos φ₁ = (2 sin φ₁ + cos φ₁)/(4S) is correct for L₁ = 0.5, L₂ = 0.25.
Re-derived result differs in the inertia term and the spring term (see slips). My result:

    (m₁L₁²/3 + (3/2) m₂ L₁²) φ̈₁ − (m₁/2 + m₂) g L₁ cos(φ₁)
        + k (S − l₀) · L₁ (2 sin(φ₁) + cos(φ₁)) / (4 S) = 0

### b. Lösung nach den Lagrange'schen Gleichungen 2. Art [4] (pp. 22-23)
Same general form and definitions as Example 2 (p. 22).

Kinetic energy ("Abb. XX") (p. 22):

    K = ½ [ Θ^(O) φ̇₁² + m₂ v_S₂² + Θ^(S₂) φ̇₂² ]

Text repeats "Θ^(O) = Θ^(S₁) + m L₁², wobei Θ^(S) = m L₁²/12" (p. 22). K = K_trans. + K_rot. (p. 22).

    K = ½ [ (m₁L₁²/3) φ̇₁² + m₂ v_S₂² + (m₂ r²/2) φ̇₂² ]
    φ̇₂ = (L₁/r) φ̇₁
    K = ½ [ (m₁L₁²/3) φ̇₁² + m₂ (L₁ φ̇₁)² + (m₂ r²/2) ((L₁/r) φ̇₁)² ]

Checked (p. 22).

Gravity potential, zero level at φ₁ = 0 (p. 23):

    V_G = −m₁ g (L₁/2) sin(φ₁) − m₂ g L₁ sin(φ₁)

Checked. Spring potential (p. 23): V_F = ½ k [S(φ₁) − l₀]².

Lagrange function (p. 23):

    L = K − (V_G + V_F)
      = ½ [ (m₁L₁²/3) φ̇₁² + m₂ (L₁ φ̇₁)² + (m₂ r²/3) ((L₁/r) φ̇₁)² ]
        − { −m₁ g (L₁/2) sin(φ₁) − m₂ g L₁ sin(φ₁) + ½ k [S(φ₁) − l₀]² }

With q_k = φ₁ (p. 23):

    ∂L/∂φ̇₁ = (m₁L₁²/3) φ̇₁ + m₂ L₁ φ̇₁ + (m₂ r²/3)(L₁/r) φ̇₁
    d/dt(∂L/∂φ̇₁) = (m₁L₁²/3) φ̈₁ + m₂ L₁ φ̈₁ + (m₂ r²/3)(L₁/r) φ̈₁
    ∂L/∂φ₁ = m₂ g L₁ cos(φ₁) + m₁ g (L₁/2) cos(φ₁) − k (S(φ₁) − l₀) (2 sin(φ₁) + cos(φ₁)) / (4 S(φ₁))

Without damping or further external generalised force (p. 23):

    (m₁L₁²/3 + (3/2) m₂ r) φ̈₁ − m₂ g L₁ cos(φ₁) − m₁ g (L₁/2) cos(φ₁)
        + k (S(φ₁) − l₀) (2 sin(φ₁) + cos(φ₁)) / (4 S(φ₁)) = 0

Same as the Newton result (p. 21). The page ends here; the example continues on p. 24 (part B).

---

## Possible source slips

1. p. 7, Ex. 1: text says the DGL is derived "unter der Vernachlässigung der Dämpfung", but the equation keeps the
   damper term c(ẋ − ẋ₀).
2. pp. 7-8, Ex. 1: mass is m₁ in the figures but m in all equations; force amplitude F₀₁ (figure) vs F̂₀₁ (free-body
   diagram).
3. p. 8, Ex. 1: the ZRD drops the offsets x₀, ẋ₀ of the p. 7 equation without saying so (valid only for
   x₀ = ẋ₀ = 0). C and D are not given.
4. p. 9, Ex. 1: damping gain is called `b` in the Simulink model but c in the text.
5. p. 10, Ex. 2: M_c = c_D Δẋ — should be Δφ̇ (the right-hand side c_D(φ̇ − φ̇₀) is correct).
6. p. 11, Ex. 2: "m L₁² Θ^(O) = Θ^(S₁) + m L₁² wobei Θ^(S) = m L₁²/12" is garbled: the leading m L₁² is stray, and
   m L₁²/12 is a slender-rod inertia, inconsistent with the point-mass model (K = ½ m₁ L₁² φ̇₁², which ignores any
   rod inertia). Repeated on p. 22 for Ex. 3, where the rod is a slender rod and m₁L₁²/3 is used (consistent there,
   but with m instead of m₁). Also "Abb. XX"/"Abb. YY" placeholders (pp. 11, 16, 17, 18, 19, 22).
7. p. 11/12, Ex. 2: symbols switch from m, φ, L₁ (p. 10) to m₁, φ₁ (p. 11 on) and to L (pp. 13-15); φ₀ is used both
   as the spring's rest angle (p. 10, 12) and as the equilibrium angle (pp. 13-15).
8. p. 12, Ex. 2: V_G = −m₁ g L₁ sin(φ₁) with zero at φ₁ = π/2 is wrong for φ measured from the downward vertical
   (p. 10 figure): the correct form is V_G = −m g L₁ cos(φ) (zero at the pivot level), equivalently
   m g L₁(1 − cos φ). The sin form belongs to Ex. 3, where φ₁ is measured from the horizontal.
9. p. 12, Ex. 2: ∂L/∂φ₁ = −m₁ g L₁ cos(φ₁) − k_D φ₁ is not the derivative of the printed L (which would give
   +m₁ g L₁ cos(φ₁)); with the correct V_G it should be −m g L₁ sin(φ) − k_D φ. The final equation on p. 13 is
   nevertheless correct, so it does not follow from the printed steps. Stray "1" after k_D φ₁.
10. p. 13, Ex. 2: Q_φ₀ = M₁(t) treats the constant rest angle φ₀ as a generalised coordinate; only Q_φ₁ = −M₁(t)
    is meaningful for a 1-DOF system. "BGL" for "DGL" (also p. 16).
11. p. 13, Ex. 2: scalar ZRD line has "+ (g/L) φ₁(t) + (k_D/(mL²)) φ₁(t)"; both signs should be negative (the
    matrix on the same page has them negative, correctly). Both forms also use the linearisation sin φ ≈ φ
    without saying so, and B = [0; 1/(mL²)] has the opposite sign to the ODE's −M₁(t) (with u = M₁).
12. p. 13, Ex. 2: equilibria from (g/L) sin φ = 0 ignore the torsion spring k_D: with k_D > 0 the condition is
    m g L sin φ + k_D φ = 0, so φ = π is not an equilibrium unless k_D = 0. The analysis is valid for the pendulum
    without spring. "n = 0, 1, 2, 3 …" omits negative n (p. 17 has ±nπ).
13. p. 14, Ex. 2: ω² = g/L is used but never defined in the stability section (defined later on p. 17 as
    √(g/L₁)). p. 15: only α = ω is taken from α² = ω²; the full solution is C₁e^(ωt) + C₂e^(−ωt) (conclusion
    unchanged).
14. p. 17/18, Ex. 2: "δ² < 4ω²" is presented as a fact; it is an assumption (light damping). For δ² ≥ 4ω² the
    points (2nπ, 0) are stable nodes, not spirals.
15. p. 18, Ex. 2: for tr(A) = −δ < 0 and det(A) = −ω² < 0 the point lies in the third quadrant of the
    (tr, det) plane, not "im ersten Quadranten" (the saddle conclusion is right).
16. p. 18, Ex. 2: the Simulink model uses `-g/L` with sin and adds the input `1*sin(2*pi*u)` directly to θ̈, with
    no 1/(mL²) scaling, no damping and a + sign, i.e. it simulates θ̈ = u − (g/L) sin θ, not the derived equation
    with M₁, k_D, c_D.
17. p. 20, Ex. 3: L₁ = 0.5 and L₂ = 0.25 are substituted silently (no units, not stated as given values; L₂ is
    written as 0.25 inside S(φ₁) instead of the symbol).
18. p. 21, Ex. 3 (Newton): the roller's Drallsatz has Θ_A φ̈₂, but the substitution writes (3/2) m₂ r² φ̈₁ with the
    r's struck out, without converting φ̈₂ = (L₁/r) φ̈₁. Correctly: S_x sin φ₁ − S_y cos φ₁ = (3/2) m₂ L₁ φ̈₁
    − m₂ g cos φ₁, giving the inertia term (3/2) m₂ L₁² after multiplying by L₁. The printed final coefficient
    "(3/2) m₂ r" is dimensionally wrong (kg·m instead of kg·m²).
19. p. 21, Ex. 3 (Newton): the spring moment loses the lever L₁: p. 20 has F_F[cos ψ sin φ₁ + sin ψ cos φ₁]·L₁, p. 21
    writes −k(S − l₀)(cos ψ sin φ₁ + sin ψ cos φ₁) without L₁. Re-derived: the correct term is
    k(S − l₀)·L₁(2 sin φ₁ + cos φ₁)/(4S) = k(S − l₀)(2 sin φ₁ + cos φ₁)/(8S) for L₁ = 0.5. Cross-check: dS/dφ₁ =
    [L₁²(1 − cos φ₁) sin φ₁ + (L₂ + L₁ sin φ₁) L₁ cos φ₁]/S = (2 sin φ₁ + cos φ₁)/(8S) for L₁ = 0.5, L₂ = 0.25, so the
    Lagrange ∂V_F/∂φ₁ on p. 23 has the same missing factor 1/2.
20. p. 21, Ex. 3: called "mit konstanten Koeffizienten", but the equation is nonlinear in φ₁ (S(φ₁), cos φ₁); the
    inertia coefficient is constant, the others are not.
21. pp. 22-23, Ex. 3 (Lagrange): roller inertia m₂r²/2 on p. 22 becomes m₂r²/3 in L on p. 23; ∂L/∂φ̇₁ has m₂ L₁ φ̇₁
    (should be m₂ L₁² φ̇₁) and (m₂ r²/3)(L₁/r) φ̇₁ (should be (m₂ r²/2)(L₁/r)² φ̇₁ = (m₂ L₁²/2) φ̇₁). The terms printed
    do not sum to the final coefficient (3/2) m₂ r either; the correct total is m₁L₁²/3 + (3/2) m₂ L₁² (checked from
    the p. 22 K, which is correct).
22. p. 22, Ex. 3: "kinematische Energie" for kinetic energy (also p. 11); "Lagangen" for Lagrange (pp. 11, 22).
