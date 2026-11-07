# AAU SS2021 (Kubinger, FH Technikum Wien): course conventions

Source: `AAU_SS2021_Folien_v1_2Seiten.pdf`, 71 PDF pages = 142 slides. All 71 pages read (80 dpi equivalent; p. 58 re-checked at 200 dpi).
"p. N" = PDF page; "sl. M" = slide number printed on the slide. Slide 2k-1 and 2k are on PDF page k.

Contents (p. 1, sl. 2): Modul 1 Zustandsregelungen; Modul 2 Zustandsbeobachter (Luenberger, Kalman, Pollage);
Modul 3 Robuste Regelungen; Modul 4 Regelung nichtlinearer Systeme; Modul 5 Digitale Regelungen.

**Not in the slides at all** (searched every page): Ackermann formula written out, adjugate/hand computation of G(s),
RNF/BNF for d != 0 (b_n != 0), Jordan form details, the transformation matrix S for RNF/BNF, Jacobian matrices,
step-response measures (Anregelzeit, Ausregelzeit, Überschwingweite, rise-time limits), stepinfo/feedback/pidtune,
Butterworth pole angles for n = 2, 3 (only an n = 4 figure), DC motor, Krankatze, RLC circuits. These must come from
exercise sheets or another source.

## 1. Notation

- State space, SISO (p. 3, sl. 6):
  ẋ(t) = A·x(t) + b·u(t),  x(0) = x0
  v(t) = cᵀ·x(t) + d·u(t)
  x(t) Zustandsvektor [n×1]; A Systemmatrix [n×n]; b Eingangsvektor [n×1]; cᵀ Ausgangsvektor [1×n];
  d Durchgangsfaktor; v(t) Regelgröße/Istwert ("Standardformelzeichen wäre hier x"); u(t) Stellgröße ("... wäre hier y").
- Block diagram (p. 4, sl. 7): u → b → Σ → ∫ → x → cᵀ → Σ → v, A feedback, d feedthrough.
- Normal form transform (p. 5, sl. 9): x_NF(t) = S·x(t); S constant and regular, S⁻¹ = T (back-transform).
- ODE (p. 7, sl. 14): a_n v^(n) + a_{n−1} v^(n−1) + ... + a1 v^(1) + a0 v = b_m u^(m) + ... + b0 u.
- Time-invariant definition uses bold **d** (p. 54, sl. 108); time-variant A(t), b(t), cᵀ(t), d(t) (p. 53, sl. 106).
- State controller (p. 11, sl. 21–22): w(t) Führungsgröße (Sollwert); u = w − rᵀx (summing point + for w, − for rᵀx).
  Closed loop written as:
  ẋ(t) = (A − b·rᵀ)·x(t) + b·w(t)
  v(t) = cᵀ·x(t) + d·w(t)      [sic: the slide writes d·w(t)]
- With prefilter (p. 16, sl. 32): ẋ(t) = (A − b·rᵀ)·x(t) + b·G_F·w(t);  v(t) = cᵀ·x(t)  (no d term). Diagram: w → G_F (Vorfilter) → + Σ − rᵀx → u.
- Prefilter (p. 16, sl. 31): G_F(0) = K_F = [cᵀ(−A + b·rᵀ)⁻¹ b]⁻¹ ("einfacher konstanter, d.h. proportionaler Vorfilter").
  MATLAB (p. 18, sl. 35): `Kf = inv(cT*inv(-A+b*rT)*b);`
- Closed-loop matrix in code: `Ar = A - b*rT;` (p. 18, sl. 35).
- PI cascade alternative (p. 17, sl. 33): "Überlagerter PI-Regelkreis, ersetzt Vorfilter"; G_R(s) = k_p·(1 + 1/(sT_n)); disturbance z(t) via b_z; x0 injected after integrator.
- Disturbance compensation (p. 19–20, sl. 36–39): e(t) = w(t) − v(t) integrated; ẋ_I = A_I·x_I + b_I·e; output r_Iᵀ; u = G_F·w + r_Iᵀ x_I − rᵀx (signs per figure sl. 38: + from G_F, + from r_Iᵀ... figure shows "+" and "−" at the sum; read as G_F w and r_Iᵀ x_I entering with +/−, rᵀx with − ; figure too small to be sure of the sign of the r_Iᵀ branch). 1 integrator: sprungförmige Störung; 2: rampenförmige.

## 2. RNF and BNF

Only for a_n = 1 ("normiert") and b_n = 0 ("kein sprungfähiges System"); d = 0. Nothing is shown for b_n != 0.

- RNF, Regelungsnormalform = Steuerungsnormalform (p. 8, sl. 16):
  A_RNF = [0 1 ... 0; 0 0 ... 0; ⋮; 0 0 ... 1; −a0 −a1 ... −a_{n−1}]  (ones on superdiagonal, −a_i in the LAST ROW)
  b_RNF = [0 0 ... 0 1]ᵀ
  cᵀ_RNF = [b0 b1 ... b_{n−1}],  d = 0
- BNF, Beobachtungsnormalform (p. 9, sl. 17):
  A_BNF = [0 0 ... 0 −a0; 1 0 ... 0 −a1; ⋮; 0 0 ... 1 −a_{n−1}]  (ones on subdiagonal, −a_i in the LAST COLUMN)
  b_BNF = [b0 b1 ... b_{n−1}]ᵀ
  cᵀ_BNF = [0 0 ... 0 1],  d = 0
- RNF is always controllable (p. 6, sl. 12); BNF always observable (p. 7, sl. 13).
- Uses: JNF for system-theoretic studies; RNF for controller design; BNF to determine x(t) from u(t), v(t) (p. 5, sl. 10).

## 3. Transfer function

- p. 8, sl. 15: ẋ(t) ↦ s·X(s) + x(0⁻); G(s) = V(s)/U(s) = (b_m s^m + ... + b1 s + b0)/(a_n s^n + a_{n−1}s^{n−1} + ... + a1 s + a0); m ≤ n required (technische Realisierbarkeit).
- p. 9, sl. 18: G(s) = cᵀ(sE − A)⁻¹·b + d = V(s)/U(s). Identity matrix is **E** (not I).
- No hand method (adjugate etc.) shown.

## 4. Controllability, observability, stability

- Steuerbarkeitsmatrix (p. 6, sl. 12): Q_S = [b  Ab  ...  A^{n−1}b]; controllable iff Q_S regular, i.e. det(Q_S) ≠ 0 or rang(Q_S) = n.
- Beobachtbarkeitsmatrix (p. 7, sl. 13): Q_B = [cᵀ; cᵀA; ⋮; cᵀA^{n−1}]; observable iff det(Q_B) ≠ 0 or rang(Q_B) = n.
- Stability (p. 9, sl. 18): poles from det(sE − A) = 0; "Ein System ist genau dann stabil, wenn alle Wurzeln λ_i der charakteristischen Gleichung det(sE − A) = 0 einen negativen Realteil haben."
  det(sE − A) = s^n + a_{n−1}s^{n−1} + ... + a1 s + a0 = (s − λ1)(s − λ2)...(s − λn).
- Classes (p. 10, sl. 19): stabil = all poles in left half-plane; grenzstabil = simple poles on imaginary axis and none in right half (incl. single pole at origin, pure imaginary conjugate pair); instabil = at least one pole in right half or multiple poles on imaginary axis. "Die Nullstellen beeinflussen nicht die Stabilität." Pole-zero plot: O Nullstelle, X Polstelle (sl. 20).

## 5. Pole placement (Polvorgabe)

- p. 12, sl. 24: controllable ⇒ controller from n given poles; a state controller does not move the plant zeros (SISO).
- p. 13, sl. 25: characteristic polynomial det(sE − (A − b·rᵀ)) = 0, i.e. s^n + p_{n−1}s^{n−1} + ... + p1 s + p0 = 0.
  "Wenn A eine RNF ist, dann ist auch A − b·rᵀ eine RNF."
  A_RNF − b·r_RNFᵀ = [0 1 ... 0; 0 0 ... 0; ⋮; −a0−r1  −a1−r2  ...  −a_{n−1}−r_n]
- p. 13, sl. 26 (Koeffizientenvergleich): a_{n−1} + r_n = p_{n−1}; ...; a1 + r2 = p1; a0 + r1 = p0
  r_RNFᵀ = [r1 r2 ... r_n] = [p0 − a0  p1 − a1  ...  p_{n−1} − a_{n−1}]   (r indexed 1..n)
- Ackermann formula: NOT written on any slide; only MATLAB `acker`/`place` named (p. 17, sl. 34).
- Code (p. 18, sl. 35), verbatim:
  ```
  A=[1 2; 3 4]; b=[5; 6];
  cT=[7 8]; d=0;
  SYS = ss(A,b,cT,d);
  Uncontrollable_states=length(A)-rank(ctrb(A,b));
  p = [-4+3j; -4-3j];
  rT=acker(A,b,p);
  Ar = A - b*rT;
  Kf = inv(cT*inv(-A+b*rT)*b);
  SYSrKf = ss(Ar,b*Kf,cT,d);
  step(SYSrKf); %Alternativ mit lsim
  ```
  (heading says "place/acker/care")
- Pole-placement hints (p. 12, sl. 24; p. 31, sl. 61): desired P-T1 or P-T2 behaviour; left half-plane with minimum distance to imaginary axis; complex pairs with minimum damping; may sit on plant zeros as compensation; move as little as possible so the actuating signal stays small. Requirement examples (p. 44, sl. 87): aperiodisch (Dämpfungsgrad D ≥ 1) ⇒ poles on real axis; max 5 % overshoot ⇒ a certain complex-pair configuration. Pole region sketch (p. 46, sl. 91) shows D = 1/√2 boundary and ω limits (handwritten).

## 6. Luenberger observer

- Observer copies the plant (p. 24, sl. 47): A_B = A, b_B = b, c_Bᵀ = cᵀ. Gain is the **Beobachtungsvektor ℓ** (script ell). Schätzfehler x̃(t) = x(t) − x̂(t).
- Error dynamics (p. 24, sl. 48): dx̃/dt = ẋ − dx̂/dt = (A − ℓ·cᵀ)·x̃; eigenvalues of A − ℓcᵀ must have negative real parts; design by Polvorgabe or Gütefunktional.
- Structure figure (p. 23, sl. 46): observer fed with u via b_B, output ŷ = c_Bᵀ x̂ compared with v, difference through ℓ back into the observer sum; rᵀ acts on x̂.
- Closed loop with observer (p. 25, sl. 49): x_neu = [x; x̂], order doubles.
  [ẋ; dx̂/dt] = [A, −b·rᵀ; ℓ·cᵀ, A_B − b_B·rᵀ − ℓ·c_Bᵀ]·[x; x̂] + [b·G_F; b_B·G_F]·w
  v(t) = c_neuᵀ x_neu = [cᵀ 0]·[x; x̂]
  (first line of the slide writes ẋ_neu = A_neu x_neu + b_neu·u(t), then uses w.)
- Separation theorem (p. 25, sl. 50): controller eigenvalues are not moved by using observer states; observer poles add to the controller poles; design controller first, observer second.
- Luenberger design (p. 26, sl. 51–52): observer poles faster than closed-loop poles (further left, "aber nicht zu weit"). Plant in BNF ⇒ observer in BNF:
  A_BNF − ℓ_BNF·c_BNFᵀ = [0 0 ... 0 −p0; 1 0 ... 0 −p1; ⋮; 0 0 ... 1 −p_{n−1}],  ℓ_BNF = [ℓ1 ℓ2 ... ℓn]ᵀ
- p. 27, sl. 53: (s − s1)...(s − sn) = s^n + p_{n−1}s^{n−1} + ... + p1 s + p0 = 0;
  ℓ_BNF = [ℓ1; ℓ2; ⋮; ℓn] = [p0 − a0; p1 − a1; ⋮; p_{n−1} − a_{n−1}]
- No dual-Ackermann formula. Code (p. 33, sl. 65–66), verbatim:
  ```
  A=[1 2; 3 4];
  b=[5; 6];
  cT=[7 8];
  d=0;
  SYS = ss(A,b,cT,d);
  Number_of_States=rank(obsv(SYS));
  p = [-10+6j; -10-6j];
  l=(place(A',cT',p))'
  Ab = A; bb = b; cTb = cT;
  Arb = [A -b*rT; l*cT Ab-l*cTb-bb*rT];
  brb = [b; bb];
  cTrb = [cT 0 0];
  drb = d;
  SYSrb = ss(Arb,brb*Kf,cTrb,drb);
  step(SYSrb); %Alternativ mit lsim
  ```
  (heading "place/acker/kalman"; "Dimensionierung rT, Kf siehe Modul 1")
- Kalman (p. 27–28, sl. 54–56): ẋ = A x + b u + x̄_R(t); v = cᵀx + d u + m̄_R(t). Stationary Riccati: AP + PAᵀ − Pcᵀ(1/r)cP + Q = 0; ℓ = Pcᵀ(1/r).

## 7. Linearisation

- Ruhelage (p. 56, sl. 111): x_R ∈ ℝⁿ is a Ruhelage of ẋ = f(x,t) if f(x_R,t) = 0 for all t ≥ 0. Examples (sl. 112): ẋ = (x−1)(x−2)(x−3) → x_R = 1,2,3; ẋ1 = x2·e^{−x1}, ẋ2 = sin(x2) → infinitely many (x2 = 0, x1 arbitrary).
- Tangentenmethode (p. 57, sl. 114): y_t = f(x0) + (df/dx)|_{x=x0}·(x − x0).
- Error (p. 58, sl. 115, checked at 200 dpi): F(x) = |(f(x) − y_t(x)) / f(x)|; only small deviations allowed; neglecting x² against x when x small.
- Taylor (p. 58, sl. 116; same page as sl. 115): Tf(x; x0) = Σ_{n=0}^{∞} f^(n)(x0)/n! · (x − x0)^n; Tsin(x;0) = x − x³/6 + x⁵/120 − ...; Tcos(x;0) = 1 − x²/2 + x⁴/24 − ...; "Linearisierung = Verwendung des 1. Taylorpolynoms".
- Remark (p. 59, sl. 117): small deflections, e.g. 5–10° for a pendulum.
- Nonlinear form (p. 53, sl. 105): ẋ = f(x,u,t), x(t0) = x0; v = h(x,u,t). Linearity examples sl. 107, 109.
- No Jacobian matrix form, no multivariable linearisation, no worked mechanical model.

## 8. LQ and Butterworth

- Cost (p. 14, sl. 27): J = ∫_0^∞ (xᵀ·Q·x + uᵀ·R·u) dt → min; Q, R symmetric weighting matrices.
- Riccati (p. 14, sl. 28): S·A + Aᵀ·S − S·b·R⁻¹·bᵀ·S + Q = 0;  rᵀ = R⁻¹·bᵀ·S.
- p. 15, sl. 29: MATLAB `rT=lqr(A,b,Q,R);`. SISO special case: R = 1, Q = c·λ·cᵀ, and with v = cᵀx: J = ∫_0^∞ (λv² + u²) dt. Large λ ⇒ large bandwidth; small λ ⇒ small bandwidth.
- Butterworth (p. 31–32, sl. 62–64): n poles in the left half-plane on a circle that, mirrored into the right half, divides it into 2n equal parts; radius = bandwidth measure; applies to both controller and observer poles; Beobachterkreis must be larger than Reglerkreis; short rise times, minimal overshoot. Figure sl. 63 "Butterworth-Konfiguration für ein System 4. Ordnung": angle marked π/4 between adjacent poles (dashed spokes at 2n = 8 divisions; poles at ±22.5° and ±67.5° from the negative real axis by reading the figure; no formula given). No n = 2 or n = 3 angles on the slides.

## 9. Step response, MATLAB

- No definitions of Anregelzeit, Ausregelzeit, Überschwingweite or rise-time limits anywhere. Only mentions: "An- und Ausregelzeit", "Überschwingen" (p. 43, sl. 85–86), "maximal 5 % Überschwingen" (p. 44, sl. 87).
- MATLAB lists, verbatim:
  - p. 17, sl. 34: ss: Zustandsraumdarstellung; tf: Übertragungsfunktion; ctrb: Steuerbarkeitsmatrix, Rang relevant; place, acker: Polplatzierung (Polvorgabe); lqr: Für LQ-Regler (Optimaler Regler); step: Sprungantwort; lsim: Simuliert mit beliebigem Eingangssignal
  - p. 29, sl. 57: same but obsv: Beobachtbarkeitsmatrix, Rang relevant; kalman: Für Kalman-Beobachter (Optimaler Beobachter)
  - care named in sl. 35 heading. No stepinfo, feedback or pidtune.
- Robust example (p. 36–37, sl. 71–73): R(s) = k_r, S(s) = k_s/(1+sT1); G_w(s,k_s) = (k_r k_s/(1+k_r k_s)) / (1 + s·T1/(1+k_r k_s)); pole s = −(1+k_r k_s)/T1 < 0 ⇒ k_r k_s > −1; k_s* = k_r k_s/(1+k_r k_s), T1* = T1/(1+k_r k_s).
- Digital PID (p. 68–69, sl. 135–137): y(kT) = K_P e(kT) + K_I T Σ_{i=0}^{k} e(iT) + (K_D/T)[e(kT) − e((k−1)T)]; T_n = K_P/K_I, T_V = K_D/K_P. Sampling: f_a > 2 f_h, T_a < T_h/2 (p. 65, sl. 129); T_a1 ≤ 0.25·T_u, T_a2 ≤ 0.1·T_g, T_a = Min(T_a1, T_a2) (p. 66, sl. 131).

## 10. Crane trolley, DC motor, RLC

Not on any slide. The only physical models are the P-T1 robust example (sl. 71–74) and a temperature-sensor voter (sl. 98).
