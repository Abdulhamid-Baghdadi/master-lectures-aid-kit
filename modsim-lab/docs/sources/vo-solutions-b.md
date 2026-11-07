# ModSim VO: worked examples with solutions, part B (PDF pp. 24-46)

Source: `VO-Aufgaben-mit-Lösungen.pdf` (46 pp.), header "Aufgabenstellung mechatronischer Systeme", A. Mario Puhwein, © FHWN.
Transcribed from page images (70 dpi; pp. 24, 31, 40, 42, 45 re-rendered at 150 dpi), not from the text layer.
Pages 1-23 are in `vo-solutions-a.md`. Notation: `x_p` = ẋ, `x_pp` = ẍ as in the Simulink labels.

Examples on these pages:

| No. | Title (source) | Pages |
|---|---|---|
| 3 | Pendel mit Rolle (continued; starts before p. 24) | 24 |
| 4 | Elektrischer Schwingkreis (RLC) [3] | 25-26 |
| 5 | Zwei-Massen-Schwinger | 27-31 |
| 6 | Doppelpendel [1] | 32-40 |
| 7 | E-Motor | 41-42 |
| 8 | Elektromechanischer Shaker (bzw. Lautsprecher) [3] | 43-45 |
| - | Referenzen | 46 |

No numerical parameter values are given on pp. 24-46 apart from those inside Simulink blocks (listed below). No eigenfrequency numbers and no trace formula for eigenfrequencies appear on these pages; the trace (Spur) is used only as a stability criterion (p. 30).

---

## 3. Pendel mit Rolle (continued)

### p. 24 - "c. Simulink Modell"
Figure only (equations are on the previous pages, see part A).
- Constant `0` labelled "Forceing" -> Sum, port 1 (+).
- Sum has four inputs with signs `+ + + −`. Output -> Gain `1/(m1*L1^2/3+3/2*m2*r)` labelled "1/Massenträgheitsmoment" -> signal `phi_pp`.
- `phi_pp` -> Integrator `1/s` -> `phi_p` -> Integrator `1/s` (shown "x0 = 0 m") -> `phi`.
- Scope with three inputs: `phi`, `phi_p`, `phi_pp`.
- `phi` feeds four branches:
  - Fcn `2*sin(u)+cos(u)` -> Product/Divide block, port "×".
  - Fcn `sqrt((L1*(1-cos(u)))^2+(0.25+L1*sin(u))^2)` -> (a) Sum `+ +` with Constant `L0`, the sum then -> Gain `k` ("Stiffness1"); (b) Gain `4` -> Product/Divide block, port "÷". [unclear: the Sum is drawn `+ +`, so it forms length + L0, not length − L0; sign of the L0 input not readable at 150 dpi]
  - Product/Divide output and Stiffness1 output -> Product `×` -> main Sum port 4 (−).
  - Fcn `cos(u)` -> Gain `m1*g*L1/2` -> main Sum port 3 (+).
  - Fcn `cos(u)` -> Gain `m2*g*L1` -> main Sum port 2 (+).
- Parameters appearing as symbols: m1, m2, L1, r, k, L0, g; numeric 0.25 (length, unit not given), 4, initial condition 0.

---

## 4. Elektrischer Schwingkreis (RLC) [3]

### p. 25
Task: series circuit of C, L and R driven by u(t); output y(t) is the voltage across R (figure "Abb. RLC-Schwingkreis").
Symbols: u(t) input voltage; u_C(t), u_L(t), u_R(t) voltages across C, L, R; i(t) current; y(t) output; C, L, R; q(t) charge.

"a. Lösung" (Schleifenregel):
- u(t) = u_C(t) + u_L(t) + u_R(t)
- u_R(t) = y(t)
- u(t) = (1/C) ∫ i(t) dt + L di(t)/dt + R i(t)
- with i(t) = q̇(t): u(t) = (1/C) q(t) + R q̇(t) + L q̈(t)
- q̈(t) = (1/L) [ u(t) − (1/C) q(t) − R q̇(t) ]
- "Eigenkreisfrequenz" (continues p. 26)

### p. 26
- ω₀ = 1/√(LC)

"b. ZRD":
- u_C(t) = x₁(t)
- i(t) = q̇(t) = x₂(t)
- ẋ₂(t) = (1/L) [ u(t) − (1/C) x₁(t) − R x₂(t) ]
(No ẋ₁ equation, no A/B/C/D matrices written.)

"c. Simulink und Simscape Modell" (figure):
- Simulink: `u_in` -> Sum (`+ − −` [unclear: signs small]) -> Gain `1/L` -> `q_pp` -> Integrator `1/s` -> `q_p` -> Integrator `1/s` -> `q` -> Scope (inputs q, q_p, q_pp). Feedback: Gain `1/C` from `q` -> Sum; Gain `R` from `q_p` [unclear: which line] -> Sum. A branch goes through a Mux to a second Scope together with Simscape signals.
- Simscape: DC Voltage Source `u_in` in series with Resistor, Inductor, Current Sensor (A), Capacitor; Voltage Sensor (V) across the capacitor; Electrical Reference; Solver Configuration `f(x) = 0`. Both sensors -> PS-Simulink Converter (`PS S`) -> Scopes.

---

## 5. Zwei-Massen-Schwinger

### p. 27
Task: two masses m₁, m₂ in a row on a floor, each tied to its left neighbour (wall at x₀ / mass 1) by a spring and a damper in parallel; harmonic forces F₁(t), F₂(t) act on the masses; gravity g, friction drawn.
Symbols (free-body diagrams):
- F₁(t) = F̂₁ cos(Ω₁t + φ₁), F₂(t) = F̂₂ cos(Ω₂t + φ₂) (top figure writes F₀₁, F₀₂ for the amplitudes [unclear: subscript])
- F_k1 = k₁ Δx₀₁ = k₁(x₁ − x₀); F_c1 = c₁ Δẋ₀₁ = c₁(ẋ₁ − ẋ₀)
- F_k2 = k₂ Δx₂₁ = k₂(x₂ − x₁); F_c2 = c₂ Δẋ₂₁ = c₂(ẋ₂ − ẋ₁)
- Friction R₁ ≤ N₁ μ_H, R₂ ≤ N₂ μ_H; normal forces N₁, N₂; inertia forces m₁ẍ₁, m₂ẍ₂
- k = spring stiffness, c = damping coefficient (this example uses c for damping).

"a. Lösung nach der newton'schen Schnittmethode" (friction neglected):
- m₁ẍ₁ + c₁(ẋ₁ − ẋ₀) + k₁(x₁ − x₀) − c₂(ẋ₂ − ẋ₁) − k₂(x₂ − x₁) = F₁(t)
- m₂ẍ₂ + c₂(ẋ₂ − ẋ₁) + k₂(x₂ − x₁) = F₂(t)

"b. Schreibweise für Simulink" (continues p. 28).

### p. 28
- ẍ₁ = (1/m₁) [F₁(t) − c₁(ẋ₁ − ẋ₀) − k₁(x₁ − x₀) + c₂(ẋ₂ − ẋ₁) + k₂(x₂ − x₁)]
- ẍ₂ = (1/m₂) [F₂(t) − c₂(ẋ₂ − ẋ₁) − k₂(x₂ − x₁)]

Matrix form: M ẍ + C ẋ + K x = F
- M = [[m₁, 0], [0, m₂]], C = [[c₁ + c₂, −c₂], [−c₂, c₂]], K = [[k₁ + k₂, −k₂], [−k₂, k₂]], F = [F₁(t), F₂(t)]ᵀ

"Stabilität", "Eigenwertermittlung":
- |K − λ M| Φ = 0
- λ = ω₀ᵢ² (eigenvalues equal the squared natural angular frequencies); Φ eigenvectors ("quasi dynamische Verformung").
- Text: system stable if all Re(λ) < 0. Alternative criterion via the Jacobi matrix and its determinant.
- Jacobi matrix "laut [5]": D_x f = [∂fᵢ/∂xⱼ], i, j = 1..n, n = number of degrees of freedom.

### p. 29
- f₁ = (1/m₁)[F₁(t) − c₁(ẋ₁ − ẋ₀) − k₁(x₁ − x₀) + c₂(ẋ₂ − ẋ₁) + k₂(x₂ − x₁)]
- f₂ = (1/m₂)[F₂(t) − c₂(ẋ₂ − ẋ₁) − k₂(x₂ − x₁)]
- D_x f = [[(k₁ + k₂)/m₁, −k₂/m₁], [−k₂/m₂, k₂/m₂]]
- "Aus der Determinante dieser Jakobi-Matrix können wieder die Eigenwerte bestimmt werden."

"c. ZRD":
- x₁(t) = y₁(t), x₂(t) = y₂(t), ẋ₁(t) = y₃(t), ẋ₂(t) = y₄(t)
- d/dt [x₁, x₂, ẋ₁, ẋ₂]ᵀ = [[0₂ₓ₂, I₂], [−K̃, −C̃]] [x₁, x₂, ẋ₁, ẋ₂]ᵀ + [[0₂ₓ₂], [diag(1/m₁, 1/m₂)]] [F₁(t), F₂(t)]ᵀ
  with K̃ = [[(k₁ + k₂)/m₁, −k₂/m₁], [−k₂/m₂, k₂/m₂]], C̃ = [[(c₁ + c₂)/m₁, −c₂/m₁], [−c₂/m₂, c₂/m₂]]
- ẋ(t) = A x(t) + B u(t); y(t) = C x(t) + D u(t)
- General: d/dt (x, ẋ) = [[0, E], [−M⁻¹K, −M⁻¹C]] (x, ẋ) + [[0], [M⁻¹]] F

### p. 30
- f₁ = ẋ₁(t) = y₃(t); f₂ = ẋ₂(t) = y₄(t)
- f₃ = ẍ₁(t) = ẏ₃(t) = (1/m₁)[F₁(t) − c₁(y₃) − k₁(y₁) + c₂(y₄ − y₃) + k₂(y₂ − y₁)]
- f₄ = ẍ₂(t) = ẏ₄(t) = (1/m₂)[F₂(t) − c₂(y₄ − y₃) − k₂(y₂ − y₁)]
- D_x f = [∂fᵢ/∂yⱼ] (4×4), evaluated:
  [[0, 0, 1, 0], [0, 0, 0, 1], [−(k₁ + k₂)/m₁, k₂/m₁, −(c₁ + c₂)/m₁, c₂/m₁], [k₂/m₂, −k₂/m₂, c₂/m₂, −c₂/m₂]]
- Text: this Jacobi matrix equals the A matrix of the ZRD.
- Stability: "stabil wenn ... det|A| > 0 und die Spur tr(A) < 0".
- Hinweis: Spur = sum of main-diagonal elements (MATLAB `b = trace(A)`).

### p. 31
"d. Gleichgewichtslage":
- k₁(x₁ − x₀) − k₂(x₂ − x₁) = const. (F₁(t))
- k₂(x₂ − x₁) = const. (F₂(t))

"e. Simulink und Simscape Modell" (figure "Double Mass-Spring-Damper in Simulink and Simscape", a MathWorks example):
- Clock -> Fcn `5*sin(2*pi*u)` (force on Mass2) and Fcn `10*sin(2*pi*u)` (force on Mass1). Each Fcn output goes both to the Simulink sums and via Simulink-PS Converter (`SPS`) to an Ideal Force Source in Simscape.
- Simulink, mass 2: Sum (`+ − −` [unclear]) -> Gain `1/m` ("1/Mass2") -> Integrator `1/s` -> velocity (tagged `v2_sl`) -> Integrator `1/s` (x0 = 0 m). Feedback: Gain `b` ("Damping2") from a velocity-difference Sum; Gain `k` ("Stiffness2") from a position-difference Sum.
- Simulink, mass 1: Sum with 6 inputs (`+ + + + − −` [unclear]) -> Gain `1/m` ("1/Mass1") -> `1/s` -> `v1_sl` -> `1/s` (x0 = 0 m); feedback Gains `b` ("Damping1"), `k` ("Stiffness"), plus the coupling terms from mass 2.
- Simscape: wall reference -> Spring1 (x0 = 0 m) ∥ Damper1 -> Mass1 -> Spring2 (x0 = 0 m) ∥ Damper2 -> Mass2; Ideal Force Sources on each mass (referenced to ground); velocity tags `v1_sc`, `v2_sc`.
- Comparison: `v2_sc`/`v2_sl` and `v1_sc`/`v1_sl` -> Mux -> Scope "Velocity of Masses".
- Note: the Simulink model labels damping `b` and stiffness `k`, while the text uses `c` and `k`.

---

## 6. Doppelpendel [1]

### p. 32
Task: two equal uniform rods (each mass m, length L₁) hinged at the fixed point O and at A; angles φ₁, φ₂ from the vertical; gravity g; y axis down, x right, z out of the figure plane.
Freikörperdarstellung: pin forces O_x, O_y at O; A_x, A_y at A (opposite on the two bodies); centres of mass S₁, S₂; weights mg.

"a. Lösung nach der newton'schen Schnittmethode":
- Θ₀ = m L₁² / 3 (rod 1 about O)
- e_z: Θ₀ φ̈₁ = −A_x L₁ cos(φ₁) + A_y L₁ sin(φ₁) + m g (L₁/2) sin(φ₁)
- body 2, Schwerpunktsatz: e_x: m ẍ_S2 = −A_x (continues p. 33)

### p. 33
- e_y: m ÿ_S2 = −A_y + m g
- e_z: Θ_S2 φ̈₂ = −A_x (L₁/2) cos(φ₂) + A_y (L₁/2) sin(φ₂), with Θ_S2 = m L₁²/12
- x_S2 = L₁ sin(φ₁) + (L₁/2) sin(φ₂); y_S2 = L₁ cos(φ₁) + (L₁/2) cos(φ₂)
- ẍ_S2 = L₁[φ̈₁ cos(φ₁) − φ̇₁² sin(φ₁) + (φ̈₂/2) cos(φ₂) − (φ̇₂²/2) sin(φ₂)]
- ÿ_S2 = L₁[φ̈₁ sin(φ₁) + φ̇₁² cos(φ₁) + (φ̈₂/2) sin(φ₂) − (φ̇₂²/2) cos(φ₂)] (as printed; see slips)
- A_x = m L₁[φ̈₁ cos(φ₁) − φ̇₁² sin(φ₁) + (φ̈₂/2) cos(φ₂) − (φ̇₂²/2) sin(φ₂)]
- A_y = m L₁[φ̈₁ sin(φ₁) + φ̇₁² cos(φ₁) + (φ̈₂/2) sin(φ₂) − (φ̇₂²/2) cos(φ₂)] + m g
- Bewegungsgleichungen (DGL), free vibration:
  - (8/3) φ̈₁ + φ̈₂ cos(φ₂ − φ₁) − φ̇₂² sin(φ₂ − φ₁) + 3 (g/L₁) sin(φ₁) = 0
  - (2/3) φ̈₂ + φ̈₁ cos(φ₂ − φ₁) + φ̇₁² sin(φ₂ − φ₁) + (g/L₁) sin(φ₂) = 0

### p. 34
Matrix form M φ̈ + C φ̇ + K φ = F:
- [[8/3, cos(φ₂ − φ₁)], [cos(φ₂ − φ₁), 2/3]] [φ̈₁, φ̈₂]ᵀ + [[0, −sin(φ₂ − φ₁)], [sin(φ₂ − φ₁), 0]] [φ̇₁², φ̇₂²]ᵀ + [[3 g/L₁, 0], [0, g/L₁]] [sin φ₁, sin φ₂]ᵀ = [0, 0]ᵀ

Linearisierung (as printed): sin(φ₂ − φ₁) = sin φ₂ cos φ₁ − cos φ₂ sin φ₁ ≈ φ₂ − φ₁; cos(φ₂ − φ₁) = sin φ₂ sin φ₁ − cos φ₂ cos φ₁ ≈ φ₂ φ₁ + 1 (see slips). Linearised DGL:
- (8/3) φ̈₁ + φ̈₂ + 3 (g/L₁) sin(φ₁) = 0
- (2/3) φ̈₂ + φ̈₁ + (g/L₁) sin(φ₂) = 0
Multiplied by m L₁²:
- [[(8/3) m L₁², m L₁²], [m L₁², (2/3) m L₁²]] [φ̈₁, φ̈₂]ᵀ + [[3 g m L₁², 0], [0, g m L₁²]] [φ₁, φ₂]ᵀ = 0 (as printed; see slips)

ZRD: φ₁ = y₁, φ̇₁ = y₂, φ₂ = y₃, φ̇₂ = y₄ (p. 34).

### p. 35
- ẋ = A x + B u; y = C x + D u; d/dt (x, ẋ) = [[0, E], [−M⁻¹K, −M⁻¹C]] (x, ẋ) + [[0], [M⁻¹]] F
- d/dt [φ₁, φ₂, φ̇₁, φ̇₂]ᵀ = [[0₂ₓ₂, I₂], [−M⁻¹K, −M⁻¹·0₂ₓ₂]] [φ₁, φ₂, φ̇₁, φ̇₂]ᵀ + [[0₂ₓ₂], [M⁻¹]] [M₁(t), M₂(t)]ᵀ
  with M = [[(8/3) m L₁², m L₁²], [m L₁², (2/3) m L₁²]], K = [[3 g m L₁², 0], [0, g m L₁²]]; inputs are moments M₁(t), M₂(t).
- Note: the state ordering here is (φ₁, φ₂, φ̇₁, φ̇₂), not the y₁..y₄ ordering of p. 34.

### p. 36
"b. Lösung nach den Lagrange'schen Gleichungen 2. Art [4]"; generalised coordinates q₁ = φ₁, q₂ = φ₂.
- r_S1 = [(L₁/2) sin φ₁, (L₁/2) cos φ₁, 0]ᵀ
- ṙ_S1 = [(L₁/2) φ̇₁ cos φ₁, −(L₁/2) φ̇₁ sin φ₁, 0]ᵀ (printed with the label r_S1)
- r_S2 = [L₁ sin φ₁ + (L₁/2) sin φ₂, L₁ cos φ₁ + (L₁/2) cos φ₂, 0]ᵀ
- ṙ_S2 = [L₁ φ̇₁ cos φ₁ + (L₁/2) φ̇₂ cos φ₂, −L₁ φ̇₁ sin φ₁ − (L₁/2) φ̇₂ sin φ₂, 0]ᵀ
- v_S2² = ṙ_S2 · ṙ_S2 = L₁²[φ̇₁² + φ̇₂²/4 + φ̇₁ φ̇₂ cos(φ₂ − φ₁)]
- K = ½[Θ^(O) φ̇₁² + m₂ v_S2² + Θ^(S2) φ̇₂²] (K = kinetic energy here)
- Θ^(O) = Θ^(S1) + m L₁² (Steiner) with Θ^(S) = m L₁²/12; K = K_trans + K_rot for pendulum 2.

### p. 37
- K = ½[(m L₁²/3) φ̇₁² + m₂ v_S2² + (m L₁²/12) φ̇₂²]
- K = (m L₁²/6)[4 φ̇₁² + φ̇₂² + 3 φ̇₁ φ̇₂ cos(φ₂ − φ₁)]
- V_g = −(m g L₁/2) cos(φ₁) − m g L₁[cos(φ₁) + ½ cos(φ₂)]
- Added: torsion spring k_D (relaxed at φ₁ = φ₂ = 0) and torsion damper c_D between the pendulums at A:
  - V_F = ½ k_D Δφ₂₁² = ½ k_D (φ₂ − φ₁)²
  - Dissipation ("quasi Dämpferpotenzial"): D = ½ c_D Δφ̇₂₁² = ½ c_D (φ̇₂ − φ̇₁)²
- Lagrange function L = K − (V_g + V_F); as printed:
  L = (m L₁²/6)[4 φ̇₁² + φ̇₂² + 3 φ̇₁ φ̇₂ cos(φ₂ − φ₁)] + (m g L₁/2) cos(φ₁) + m g L₁[cos(φ₁) + ½ cos(φ₂)] + ½ k_D (φ₂ − φ₁)²
- ∂L/∂φ̇₁ = (m L₁²/6)[8 φ̇₁ + 3 φ̇₂ cos(φ₂ − φ₁)]
- d/dt(∂L/∂φ̇₁) = (m L₁²/6)[8 φ̈₁ + 3(φ̈₂ cos(φ₂ − φ₁) − φ̇₂(φ̇₂ − φ̇₁) sin(φ₂ − φ₁))]

### p. 38
- Using cos(φ₂ − φ₁) = sin φ₂ sin φ₁ + cos φ₂ cos φ₁:
- ∂L/∂φ₁ = (m L₁²/2) φ̇₁ φ̇₂ [sin φ₂ cos φ₁ − cos φ₂ sin φ₁] − (m g L₁/2) sin φ₁ − m g L₁ sin φ₁ − k_D(φ₂ − φ₁)
- ∂D/∂φ̇₁ = −c_D(φ̇₂ − φ̇₁)
- ∂L/∂φ̇₂ = (m L₁²/6)[2 φ̇₂ + 3 φ̇₁ cos(φ₂ − φ₁)]
- d/dt(∂L/∂φ̇₂) = (m L₁²/6)[2 φ̈₂ + 3(φ̈₁ cos(φ₂ − φ₁) − φ̇₁(φ̇₂ − φ̇₁) sin(φ₂ − φ₁))]
- ∂L/∂φ₂ = (m L₁²/6)·3 φ̇₁ φ̇₂ [cos φ₂ sin φ₁ − sin φ₂ cos φ₁] − m g (L₁/2) sin(φ₁) + k_D(φ₂ − φ₁) (as printed; see slips)
- ∂D/∂φ̇₂ = c_D(φ̇₂ − φ̇₁)
- BGL (heading says "ohne Feder und Dämpfer", but terms are included):
  - (8/3) φ̈₁ + φ̈₂ cos(φ₂ − φ₁) − φ̇₂² sin(φ₂ − φ₁) − k_D(φ₂ − φ₁) − c_D(φ̇₂ − φ̇₁) + 3 (g/L₁) sin(φ₁) = 0
  - (2/3) φ̈₂ + φ̈₁ cos(φ₂ − φ₁) + φ̇₁² sin(φ₂ − φ₁) + c_D(φ̇₂ − φ̇₁) + k_D(φ₂ − φ₁) + (g/L₁) sin(φ₂) = 0
- Linearised:
  - (8/3) φ̈₁ + φ̈₂ − c_D(φ̇₂ − φ̇₁) − k_D(φ₂ − φ₁) + 3 (g/L₁) sin(φ₁) = 0
  - (2/3) φ̈₂ + φ̈₁ + c_D(φ̇₂ − φ̇₁) + k_D(φ₂ − φ₁) + (g/L₁) sin(φ₂) = 0

### p. 39
Multiplied by m L₁²:
- [[(8/3) m L₁², m L₁²], [m L₁², (2/3) m L₁²]] [φ̈₁, φ̈₂]ᵀ + [[c_D, −c_D], [−c_D, c_D]] [φ̇₁, φ̇₂]ᵀ + [[3 g m L₁² + k_D, −k_D], [−k_D, g m L₁² + k_D]] [φ₁, φ₂]ᵀ = 0
ZRD: φ₁ = y₁, φ̇₁ = y₂, φ₂ = y₃, φ̇₂ = y₄; same block form as p. 35 with
- −M⁻¹K, K = [[3 g m L₁² + k_D, −k_D], [−k_D, g m L₁² + k_D]]; −M⁻¹C, C = [[c_D, −c_D], [−c_D, c_D]]; B = [[0], [M⁻¹]], input [M₁(t), M₂(t)]ᵀ.

### p. 40
"c. Gleichgewichtslage":
- 3 (g/L) sin(φ₁) = 0; (g/L) sin(φ₂) = 0
- sin(φ) = 0 für alle φ = nπ, n = 0, 1, 2, 3 ...
- "Stabile Gleichgewichtslage:" heading with no content.

"d. Simulink und Simscape Modell" (figure "Double Pendulum in Simulink and Simscape Multibody", a MathWorks example):
- Simulink: states theta1 and theta2 (relative). Upper branch: Gain `g*(m1+m2)` on sin(theta1); `u²` of theta2_d times sin(theta2) times Gain `m2*L2`; cos(theta2) times theta2_dd [unclear] times Gain `m2*L2`; Sum (`− − −`) multiplied (×) by `1/((m1+m2)*L1)` -> theta1_dd -> `1/s` -> theta1_d -> `1/s` (IC `theta1_0*pi/180 rad`) -> theta1 -> tag `q1_sl`.
- Lower branch: cos·theta1_dd·`m2*L1`, sin·u²(theta1_d)·`m2*L1`, `g*m2`·sin(theta1+theta2) [unclear: argument]; Sum (`− + −`) × `1/(m2*L2)` -> theta2_dd -> `1/s` -> theta2_d -> `1/s` (IC `(theta2_0+theta1_0)*pi/180`) ; output tagged `theta2+theta1` -> `q2w_sl`. A Sum (`+ −`) forms the angle difference used by the trig blocks.
- Simscape Multibody: World/Mechanism configuration -> Rigid Transform "Pivot" -> Revolute Joint 1 (sensor -> `q1_sm`) -> Link 1 -> Revolute Joint 2 (`q2_sm`) -> Link 2; a "Scopes" subsystem.
- Parameters as symbols: m1, m2, L1, L2, g, theta1_0, theta2_0 (degrees).

---

## 7. E-Motor

### p. 41
Task: DC motor with armature resistance R_A and inductance L_A, driving a load inertia J through a bearing (Lager).
Symbols: u_A armature voltage; u_R, u_L; i_A armature current; u_M induced voltage; ω = φ̇; J; c_L (bearing damping); M_A motor torque; k_M, k_T machine constants.

"a. Lösung":
- u_A(t) = R_A i_A(t) + L_A di_A(t)/dt + u_M(t)
- Drallsatz: J φ̈(t) + c_L φ̇(t) = M_A(t)
- u_M(t) = k_M ω(t)
- M_A(t) = k_T i_A(t)

### p. 42
- di_A(t)/dt = (1/L_A)[u_A(t) − R_A i_A(t) − k_M ω(t)]
- φ̈(t) = (1/J)[k_T i_A(t) − c_L ω(t)]

"b. ZRD":
- d/dt (i_A, φ, ω)ᵀ = [[−R_A/L_A, 0, −k_M/L_A], [0, 0, 1], [k_T/J, 0, −c_L/J]] (i_A, φ, ω)ᵀ + [1/L_A, 0, 0]ᵀ u_A
(No output equation C, D given.)

"c. Simulink und Simscape Modell":
- Simscape ("DC Motor" subsystem): DC Voltage1 -> Resistor -> Inductor -> Rotational Electromechanical Converter; mechanical side Inertia and rotational damper "Friction"; Electrical Reference, Mechanical Rotational Reference, Solver Configuration `f(x) = 0`. Outside: Ideal Torque Source "Load Torque1" driven by "Step Input1" (via PS converter `S`); Ideal Rotational Motion Sensor `w` -> Scope "Motor RPM1".
- Simulink: `u_A` -> Sum (`+ − −`) -> Gain `1/L_A` -> `q_pp` -> `1/s` -> `q_p` -> `1/s` -> `q` -> Scope. Feedback: Gain `R_A` from `q_p`; Gain `k_M` from `phi_p = om` (also to a Scope).
- Mechanical: Constant `10` "load torque" -> Sum (3 inputs; signs [unclear: look like `+ − −`]) -> Gain `1/J` -> `phi_pp` -> `1/s` -> `phi_p = om` -> `1/s` -> `phi` -> Scope. Feedback: Gain `c_L` from `phi_p = om`; Gain `k_T` from `q_p` (current).
- Numerical value: load torque 10 (unit not given). Here `q_p` stands for i_A and `q` for its integral (charge).

---

## 8. Elektromechanischer Shaker (bzw. Lautsprecher) [3]

### p. 43
Task: shaker = series of a small resistance R_S and a coil L_S in the field B_S of a permanent magnet; force on the coil f = l i_S × B_S, projected on x: F_S = h_S i_S; moving coil fixed to the plate of mass m_S, suspended by spring k_S and damper d_S. Back-EMF (elektrodynamische Rückkopplung) is neglected for the electrical subsystem.
Symbols: U_m = U_S supply voltage; i_S current; R_S, L_S; B_S; l (conductor length); h_S shaker constant (all characteristic values); m_S, k_S, d_S; x displacement; F_S force.

"a. Lösung":
- U_S = R_S i_S + L_S di_S/dt
- m_S ẍ + d_S ẋ + k_S x = F_S = h_S i_S
- G_Ux(s) = x/U_S = [1/(R_S + s L_S)] · [h_S/(s² m_S + s d_S + k_S)]
- Acceleration: G_Ua(s) = s² G_Ux(s)

### p. 44
- "G_Ux(s) = x/U_S = [s²/(R_S + s L_S)] · [h_S/(s² m_S + s d_S + k_S)]" (as printed; this is G_Ua, see slips)
- Text: not "sprungfähig" (no direct feed-through), 3rd-order system.
- Block diagram (Abb. YY): U_S -> [1/(R_S + s L_S)] -> i_S -> [h_S/(s² m_S + s d_S + k_S)] -> x.

"b. ZRD":
- d/dt (i_S, x, v)ᵀ = [[−R_S/L_S, 0, 0], [0, 0, 1], [h_S/m_S, −k_S/m_S, −d_S/m_S]] (i_S, x, v)ᵀ + [1/L_S, 0, 0]ᵀ U_S
- Text: the Simulink model and a pure circuit model cannot show the back-coupling of the single-mass oscillator onto the circuit; the coupled Simscape model can. Models agree at t = 0 s and after the settling time t = 14 s.

### p. 45
"c. Simulink und Simscape Modell" (Abb. XX):
- Simulink electrical: `Us` -> Sum (`+ −`) -> Gain `1/Ls` -> `i_p` -> `1/s` -> `i` -> `1/s` (x0 = 0 m) -> `int(i)` -> Scope; Gain `Rs` from `i` back to the Sum; `i` also to a Scope.
- Simulink mechanical: Gain `hs` from `i` -> Sum (`+ − −`) -> Gain `1/ms` -> `x_pp` -> `1/s` -> `x_p` -> `1/s` (x0 = 0 m) -> `x` -> Scope (x, x_p, x_pp); feedback Gains `ds` (from x_p) and `ks` (from x).
- Simscape: Controlled/DC voltage source [unclear: symbol], Resistor, Inductor, Current Sensor (A) -> Translational Electromechanical Converter; mechanical side Mass, Translational Damper, Translational Spring, Ideal Translational Motion Sensor; Mechanical Translational Reference; Electrical Reference; Solver Configuration `f(x) = 0`. Sensor outputs -> PS-Simulink converters (`PSS`) -> Mux with Simulink `x`, `x_p` -> Scope; current -> Mux with Simulink `i` -> Scope and To Workspace `simout`.
- Abb. YY "Current vs. time": current [A] 0..1 over time 0..20 s. "Simulink" (solid blue) and "Simscpae without influence" (dashed red) coincide, rising to ≈ 1 A by ≈ 6 s; "Simscape influence" (black) shows a shoulder at ≈ 0.6 A around 1.5-2.5 s and reaches ≈ 1 A at ≈ 12-14 s. Values read from the plot. Parameter values are not stated.

### p. 46 - Referenzen
- [1] Fotiu, P., Mehrkörperkinetik I, Eigenverlag der FHWN, 2018
- [2] Hochrainer, M., Systemidentifikation, Eigenverlag der FHWN, 2012
- [3] Nemecek, A., Moderne Regelungstechnik, Eigenverlag der FHWN, 2014
- [4] Fotiu, P., Mehrkörperkinetik II, Eigenverlag der FHWN, 2018
- [5] Wagg, D., Neild, S., Nonlinear Vibration with Control, Second Edition, Springer 2015
---

## Possible source slips

Re-derived by hand on 7 Nov 2026 from the source's own definitions.

1. **p. 24** – Inertia gain `1/(m1*L1^2/3+3/2*m2*r)`: a disc's inertia term would be (3/2) m₂ r² (dimension kg·m²); `r` to the first power is dimensionally inconsistent. Cannot be fully checked without the derivation on p. 23 (part A). Also the angle integrator is labelled "x0 = 0 m" (metres for an angle) – label only.
2. **p. 26** – ZRD sets u_C(t) = x₁(t) but then uses (1/C) x₁, which is only right if x₁ = q (u_C = q/C). The ẋ₁ = x₂ row and output y = R x₂ are not written. Otherwise the RLC ODE and ω₀ = 1/√(LC): checked.
3. **p. 27-28** – Newton equations, Simulink form and M, C, K matrices: checked (matrix form silently sets x₀ = ẋ₀ = 0).
4. **p. 28** – "|K − λM| Φ = 0" mixes the determinant condition det(K − λM) = 0 with (K − λM)Φ = 0. With λ = ω₀ᵢ² the undamped system has λ > 0, so the stated stability criterion "alle Re(λ) < 0" contradicts the definition of λ; Re < 0 applies to the eigenvalues of the state matrix A, not to λ = ω².
5. **p. 29** – The 2×2 "Jakobi-Matrix" D_x f = [[(k₁+k₂)/m₁, −k₂/m₁], [−k₂/m₂, k₂/m₂]] is M⁻¹K; the true partial derivatives ∂fᵢ/∂xⱼ of the printed f₁, f₂ are its negative (−M⁻¹K). The 4×4 Jacobian on p. 30 has the correct signs: checked.
6. **p. 30** – "stabil wenn det(A) > 0 und tr(A) < 0" is a necessary-and-sufficient test only for 2×2 matrices; for the 4×4 A it is only necessary (Routh-Hurwitz needs more conditions). For this A: tr(A) = −(c₁+c₂)/m₁ − c₂/m₂ and det(A) = k₁k₂/(m₁m₂) > 0 (my derivation), so both hold for positive parameters.
7. **p. 33** – ÿ_S2 lacks an overall minus sign: from y_S2 = L₁cos φ₁ + (L₁/2)cos φ₂, ÿ_S2 = −L₁[φ̈₁ sin φ₁ + φ̇₁² cos φ₁ + (φ̈₂/2) sin φ₂ + (φ̇₂²/2) cos φ₂]; the last term's sign (−) is also wrong. The printed A_y (= m g − m ÿ_S2) matches the corrected ÿ_S2 except for the last term's sign. Similarly A_x should be −m ẍ_S2 from e_x: m ẍ_S2 = −A_x; printed with +. [unclear: the force-direction convention in the figure may differ; not fully re-derived.] The final DGL on p. 33 is correct (checked against my Lagrange derivation).
8. **p. 34** – cos(φ₂ − φ₁) is printed as "sin φ₂ sin φ₁ − cos φ₂ cos φ₁"; the sign must be +. The approximation φ₂φ₁ + 1 ≈ 1 is then right. The linearised DGL keep sin(φ₁), sin(φ₂) (should be φ₁, φ₂ after linearisation; the matrix form does use φ).
9. **p. 34, 35, 39** – After multiplying by m L₁², the stiffness entries should be 3 g m L₁ and g m L₁ (g/L₁ · m L₁²), not 3 g m L₁² and g m L₁² (dimensionally wrong). Also, the multiplication factor that turns (8/3, 1, 2/3) into the true inertia matrix is m L₁²/2, giving (4/3, 1/2, 1/3) m L₁²; multiplying by m L₁² is consistent internally but then k_D and c_D in p. 39 should be scaled by 2 (see 11).
10. **p. 37** – L is printed with "+ ½ k_D(φ₂ − φ₁)²"; with L = K − (V_g + V_F) it must be "− ½ k_D(φ₂ − φ₁)²". The derivatives on p. 38 carry the same wrong sign (∂L/∂φ₁ "− k_D(φ₂−φ₁)", ∂L/∂φ₂ "+ k_D(φ₂−φ₁)"); yet the final BGL on p. 38 have the physically correct signs, so the slip is in L and its derivatives only. K, V_g, D, ∂D/∂φ̇ᵢ, ∂L/∂φ̇ᵢ and the d/dt terms: checked.
11. **p. 38** – ∂L/∂φ₂ gravity term printed "− m g (L₁/2) sin(φ₁)"; it must be sin(φ₂). The BGL divide the inertia and gravity terms by m L₁²/2 but leave k_D and c_D unscaled: consistent equations need 2k_D/(m L₁²) and 2c_D/(m L₁²). Heading "ohne Feder und Dämpfer" contradicts the k_D, c_D terms shown.
12. **p. 38** – Lagrange BGL without spring/damper: re-derived (8/3)φ̈₁ + φ̈₂cos(φ₂−φ₁) − φ̇₂² sin(φ₂−φ₁) + 3(g/L₁) sin φ₁ = 0 and (2/3)φ̈₂ + φ̈₁cos(φ₂−φ₁) + φ̇₁² sin(φ₂−φ₁) + (g/L₁) sin φ₂ = 0: checked, same as Newton result on p. 33.
13. **p. 40** – Equilibrium uses L instead of L₁; "Stabile Gleichgewichtslage" is left empty (answer would be φ₁ = φ₂ = 0, i.e. n even, hanging down). The Simulink model (gains g*(m1+m2), m2*L2, 1/((m1+m2)*L1), 1/(m2*L2)) is the point-mass double pendulum with relative angle theta2, not the equal-rod model derived on pp. 32-39, so its results will differ from the derived DGL.
14. **p. 42** – Simulink mechanical Sum appears to add the load torque with + and subtract k_T·i [unclear: signs]; the ODE has +k_T i_A and no load-torque term at all. The current integrator chain names the current `q_p` and integrates it once more to `q`, which is not needed. ODE and ZRD matrix: checked.
15. **p. 44** – The formula with s² is labelled G_Ux(s) = x/U_S; it is G_Ua(s) = a/U_S (p. 43 defines G_Ua = s²G_Ux). ZRD matrix: checked against the two ODEs. The model omits back-EMF (−h_S v in the electrical equation), which the text acknowledges; with it the A matrix would have −h_S/L_S in row 1, column 3.
