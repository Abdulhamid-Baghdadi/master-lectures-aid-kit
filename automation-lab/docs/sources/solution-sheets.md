# AAU Rechenbeispiele: what the solution sheets say

Transcribed 2026-11-07 from scans in `H:\My Drive\02_Personal\02_Education\FH\03_FH_Master\2. Semester\AAU\`.
Nothing computed or filled in; values are as written in the handwriting. Matrices are row-wise, rows separated by `;`.

File abbreviations:
- **S1** = `Beispiele 2017\AAU_Rechenbeispiele_1 to 20.pdf` (27 pp., neat handwritten, one Beispiel per header "Bsp. N"; numbering matches the SS2021 sheet).
- **S2** = `Beispiele 2017\AAU_Rechenbeispiele_1_10_11_4_7_5_20_13_21_22_23.pdf` (15 pp., dated February to April 2014). **Its numbering is the 2014 one**: its "Bsp 22" is the pendulum (= SS2021 Bsp 23) and its "Bsp 23" is the crane (= SS2021 Bsp 22). Its Bsp 21 = motor (same).
- **M** = `Beispiele 2017\AAU_1-Moritz.pdf` (64 pp.: the printed SS2021 sheet with handwritten pages interleaved; numbering matches SS2021). I only inspected pp. 40-64 page by page; pp. 1-39 (Bsp 1-18) were not checked for handwriting.
- **Ex** = `Beispiele 2017\AAU_SS2021_Rechenbeispiele_v1.pdf` (task sheet; Beispiel N is on PDF page N+1).

Legend: (clear) = read clearly; (uncertain) = handwriting or sign ambiguous.

---

## Beispiel 1 (state-space of Systems A, B, C)
Solution: S1 p.1 (also S2, first pages, not re-read).
- A: A = [-2 3; 3 10], b = [1; -1], cT = [1 0], d = 0 (clear)
- B: A = [1 -2 5; 0 10 -1; -3 1 -2], b = [-1; 2; 1], cT = [2 -1 -1], d = 0 (clear)
- C: A = [2 -2 1; 0 -3 3; 1 1 1], B = [1 1; 0 2; -1 3], C = [1 -1 1; 2 3 -4], D = [2 -1; 0 2] (clear)

## Beispiel 2 (Systems 1-4)
Solution: S1 pp.2-3.
- 1: A = [-1 2; 2 3], b = [3; -2], cT = [2 0], d = 0 (clear)
- 2: A = [2 -3 -4; 0 -2 5; -1 2 -4], b = [-2; 3; -1], cT = [-1 2 -3], d = 0 (clear)
- 3: A = [2 3 1 -2; 1 -2 4 1; 1 -1 4 -3; 2 -2 -4 0], b = [-2; 3; 0; 1], cT = [3 -2 2 0], d = 3 (clear)
- 4: A = [1 -1 1; 0 -2 4; 2 -3 2], B = [1 1; 2 -3; 0 2], C = [2 -2 3; 1 -3 -2], D = [3 -2; 0 3] (clear)

## Beispiel 3
Solution: S1 p.4. A = [1 -1 1; 0 -2 4; 2 -3 2], B = [1 1; 2 -3; 0 2], C = [2 -2 3; 1 -3 -2], D = [3 -2; 0 3] (clear)

## Beispiel 4 (RNF and BNF from ODE)
Solution: S1 p.5; also S2 p.5.
- G(s) = (5s² + 2s + 3)/(s³ + 4s² + 8s + 6) (clear)
- RNF: A = [0 1 0; 0 0 1; -6 -8 -4], b = [0; 0; 1], cT = [3 2 5], d = 0 (clear)
- BNF: A = [0 0 -6; 1 0 -8; 0 1 -4], b = [3; 2; 5], cT = [0 0 1], d = 0 (clear)

## Beispiel 5 (RNF, G(s), stability of System A)
Solution: S1 pp.6-7.
- (sE - A)⁻¹ = 1/(s² - 8s - 29) · [s-10 3; 3 s+2] (clear)
- G(s) = (s - 13)/(s² - 8s - 29) (clear)
- RNF: A = [0 1; 29 8], b = [0; 1], cT = [-13 1], d = 0 (clear)
- Poles: s1,2 = 4 ± √45; s1 ≈ 10.7, s2 ≈ -2.7 → "instabil" (clear)

## Beispiel 6 (controllability/observability of System A)
Solution: S1 p.8.
- Qs = [1 -5; -1 -7], det(Qs) = -7 - 5 = -12 ≠ 0 → steuerbar (clear)
- QB = [1 0; -2 3], det(QB) = 3 ≠ 0 → beobachtbar (clear)

## Beispiel 7 (G(s) of System A)
Solution: S1 p.9. G(s) = (s - 13)/(s² - 8s - 29), "Rechenweg siehe Bsp. 5" (clear)

## Beispiel 8 (RNF from G(s))
Solution: S1 p.10. A_RNF = [0 1 0; 0 0 1; -3 -2 -1], b = [0; 0; 1], cT = [1 2 3], d = 0 (clear)

## Beispiel 9 (BNF from G(s))
Solution: S1 p.11. A_BNF = [0 0 -1; 1 0 -2; 0 1 -3], b = [3; 2; 1], cT = [0 0 1], d = 0 (clear)

## Beispiel 10 (controllable?)
Solution: S1 p.12.
- A = [-1 2; 2 -8], b = [3; -2], cT = [3 0], d = 0
- Qs = [3 -7; -2 22], det(Qs) = 3·22 - (-7)(-2) = 52 ≠ 0 → steuerbar (clear)

## Beispiel 11 (observable?)
Solution: S1 p.13.
- A = [0 4; -1 3], b = [3; -4], cT = [3 -4], d = 3
- QB = [3 -4; 4 0], det(QB) = 16 ≠ 0 → beobachtbar (clear)

## Beispiel 12 (System 6: controllable, observable, stable?)
Solution: S1 pp.14-15.
- A = [-1 2; 2 -3], b = [2; -2], cT = [-1 1], d = 0
- Qs = [2 -6; -2 10], det = 20 - 12 = 8 ≠ 0 → steuerbar (clear)
- QB = [-1 1; 3 -5], det = 5 - 3 = 2 ≠ 0 → beobachtbar (clear)
- det(sE - A) = s² + 4s - 1; s1,2 = -2 ± √5; s1 ≈ 0.24, s2 ≈ -4.24 → instabil (clear)

## Beispiel 13 (state feedback + prefilter, System A, poles -1 ± j3)
Solution: S1 pp.16-17; also S2 p.10.
- RNF (from Bsp 5): A = [0 1; 29 8], b = [0; 1], cT = [-13 1] (clear)
- Desired polynomial s² + 2s + 10 → p0 = 10, p1 = 2 (clear)
- rT_RNF = (10+29, 2+8) = (39 10) (clear)
- -A_RNF + b·rT = [0 -1; 10 2]; inverse = 1/10·[2 1; -10 0] (clear)
- Gf = -10/13 (clear)
- Note: rT is given in RNF coordinates only; no back-transformation to original coordinates on the sheet.

## Beispiel 14 (System 5, poles -2 ± j2)
Solution: S1 pp.18-19.
- (sE - A)⁻¹ = 1/(s² - 7)·[s-2 3; 1 s+2]; G(s) = (10s - 28)/(s² - 7) (clear)
- RNF: A = [0 1; 7 0], b = [0; 1], cT = [-28 10], d = 0 (clear)
- Desired s² + 4s + 8 → p0 = 8, p1 = 4; rT_RNF = (8+7, 4+0) = (15 4) (clear)
- -A + b·rT = [0 -1; 8 4]; inverse = 1/8·[4 1; -8 0] (clear)
- Gf = -8/28 = -2/7 (clear)

## Beispiel 15 (rT, A = [0 1; 4 -8], poles -1, -2)
Solution: S1 p.20. "bereits RNF"; -a0 = 4, -a1 = -8; desired s² + 3s + 2 → p0 = 2, p1 = 3; rT_RNF = (2+4, 3-8) = (6 -5) (clear)

## Beispiel 16 (prefilter, rT = [13 25])
Solution: S1 p.21.
- -A + b·rT = [0 -1; 9 33]; inverse = 1/9·[33 1; -9 0] (clear)
- cT·(…)⁻¹ = 1/9·(30 2); ·b = 2/9 (clear)
- Gf = 9/2 (clear)

## Beispiel 17 (Luenberger observer, System 5, poles -4 ± j4)
Solution: S1 p.22. Uses G(s) = (10s - 28)/(s² - 7), a0 = -7, a1 = 0; desired s² + 8s + 32 → p0 = 32, p1 = 8; L_BNF = (32+7; 8-0) = (39; 8) (clear). Gain is in BNF coordinates only.

## Beispiel 18 (observer, A = [0 -3; 1 6], poles -3, -4)
Solution: S1 p.23. Sheet writes A = [0 -3; 1 6], b = [-8; 16], cT = [0 1], "bereits BNF" (clear). a0 = 3, a1 = -6; desired s² + 7s + 12 → p0 = 12, p1 = 7; L_BNF = (12-3; 7+6) = (9; 13) (clear).

## Beispiel 19 (feedback + prefilter + observer, System A)
Solution: S1 pp.24-25.
- RNF: A = [0 1; 29 8], b = [0; 1], cT = [-13 1]; BNF: A = [0 29; 1 8] (clear)
- Controller poles -3 ± j: s² + 6s + 10 → rT_RNF = (10+29, 6+8) = (39 14) (clear)
- -A + b·rT = [0 -1; 10 6]; inverse = 1/10·[6 1; -10 0]; cT·inv = 1/10·(-88 -13) (clear)
- Gf = -10/13 (clear)
- Observer poles -6 ± j2: s² + 12s + 40 → L_BNF = (40+29; 12+8) = (69; 20) (clear)

## Beispiel 20 (R-L-R-C device, Us → Uh)
Solution: S1 pp.26-27 (zoomed p.27 at 100 dpi); also S2 pp.8-9; also M pp.46-47 (not transcribed in detail).
- States x1 = iL, x2 = uC; u = Us, v = Uh (clear)
- A = [-(R1+R2)/L  -1/L; 1/C  0], b = [1/L; 0], cT = [R2 1], d = 0 (clear; symbolic only, no numeric matrix on sheet)
- Qs = [1/L  -(R1+R2)/L²; 0  1/(L·C)]; det(Qs) = 1/(L²C) = 1/((123e-3)²·321e-6) ≈ 205.9 k (1/(Ω·s³)) → steuerbar (clear)
- QB = [R2  1; -(R1R2+R2²)/L + 1/C   -R2/L]; det(QB) = R1R2/L - 1/C = 4.53·0.8/123e-3 - 1/321e-6 ≈ -3.1 k Ω/s → beobachtbar (clear)
- S2 p.9 writes a different det(QB) expression, roughly "-R2²/L + R2/C·(R1+R2) + C ≠ 0" (uncertain; looks inconsistent with S1).
- S1 p.26 header lists L1 as "123 mH" (uncertain; one digit looks like 9 at 50 dpi, but p.27 uses 123e-3 clearly).
- "Zustandsgrößen messbar?": not answered explicitly on S1. M p.50 (for Bsp 21) has a "Messbar?" note; for Bsp 20 not checked.
- Figure (Ex p.21): input terminals left (Us top→bottom), output terminals right (Uh top→bottom), all inside a dashed box "Gehäuse". Top rail: left terminal → R1 → L1 (series) → node → right top terminal. From that node a shunt branch to the bottom rail: R2 in series with C2 (R2 upper, C2 lower). Bottom rail is a straight wire joining left and right bottom terminals. So Uh is across the R2-C2 series branch; output is open (S1 sketch marks i = 0 at output).

## Beispiel 21 (PM DC motor)
Solution: S2 pp.11-12 ("Bsp 21", 14 March 2014); M pp.49-50.
- u = UA, v = n, x1 = iA, x2 = n, disturbance z = ML (clear)
- Equations: UA = iA·RA + LA·diA/dt + c·2π·n; J·2π·dn/dt = c·iA - ML (friction neglected) (clear)
- A = [-RA/LA  -c·2π/LA; c/(J·2π)  0], b = [1/LA; 0], cT = [0 1], d = 0 (clear; symbolic only)
- The disturbance input column for ML is not written as a matrix on S2 (would be -1/(J2π) from the equation; not on sheet).
- S2 p.12 alt. output v = MN: [n; MN] = [0 1; c 0]·[iA; n] (clear)
- M p.50: Qs = [1/L  -R/L²; 0  c/(2πJL)], det Qs = c/(2πJL²) ≠ 0 → steuerbar; QB = [0 1; c/(2πJ) 0], det QB = -c/(2πJ) ≠ 0 → beobachtbar; messbar: iA by Amperemeter, n by Drehzahlmesser (uncertain handwriting, content clear enough)
- No numeric A/b with RA = 0.8 Ω, LA = 125 mH, c = 50 mVs, J = 0.002 kgm² on any sheet.
- Figure (Ex p.22): single loop. Terminal voltage UA across left side (arrow top→bottom), current iA flows into top; series RA → LA → motor (circle) back to bottom terminal. UM is the voltage across the motor. MN (motor torque) and ML (load torque) drawn as curved arrows at the motor.

## Beispiel 22 (crane trolley, linear state-space)
Solution: M pp.52-54 (pages headed "Bsp 22"); also S2 pp.14-15 (headed "Bsp 23", derivation only, stops at "Linearisieren um den Punkt φ = 0, ω = 0").
- Nonlinear (M p.53, S2 p.15): ω̇ = -(g/l)·sin φ - (v̇/l)·cos φ; v̇ = 1/(mK + mL·sin²φ)·[Fa + mL·g·sin φ·cos φ - mL·ω²·l·sin φ] (clear)
- Linearised (M p.53): v̇ = (mL·g/mK)·φ + (1/mK)·Fa; ω̇ = g(mK+mL)/(mK·l)·φ - 1/(mK·l)·Fa (uncertain: no minus sign in front of the first term on p.53, but p.54 matrix has a minus)
- M p.54: x = [φ; ω; x; v], u = Fa, y = (0 0 1 0)·x = x position
  A = [0 1 0 0; -g(mK+mL)/(mK·l) 0 0 0; 0 0 0 1; mL·g/mK 0 0 0], b = [0; -1/(mK·l); 0; 1/mK], cT = [0 0 1 0], d = 0 (uncertain: row 1 partly scribbled; sign of a21 differs from p.53)
- No numeric values (mL is not given in the task; mK = 20 kg, l = 4.0 m, g = 9.8065 m/s² are given but not substituted).
- Figure (Ex p.23): trolley (box, mass mK) on wheels on a horizontal rail between two walls; x axis to the right; force Fa pushes trolley from the left; massless rigid rope of length l hangs from the trolley's centre of mass, angle φ measured from the vertical; point load mL at the end.

## Beispiel 23 (pendulum linearisation)
Solution: S2 p.13 ("Bsp 22", 4 April 2014); M p.56.
- sin(y) ≈ y at y0 = 0 → ÿ + D·ẏ + ω²·y = 0 (clear)
- x1 = y, x2 = ẏ: A = [0 1; -ω² -D], b = 0 (clear)

## Beispiel 24 (K1…K11 linearisation)
Solution: M p.58.
- A = [-K2/K1  -K3/K1; -K6/K5  -K7/K5] (clear)
- b = [-K4/K1; -K8/K5] (uncertain: line above reads "+ K8/(-K5)·u", sign of b2 written as minus)
- cT = [K9 K10], d = +K11 (clear)

## Beispiel 25
Solution: M p.60.
- A = [-2 -3 -4; 2 2 1; -6 0 -8], b = [-3; 1; -9], cT = [-2 -3 -4], d = -5 (clear; a13 = -4 slightly overwritten)

## Beispiel 26
Solution: M p.62.
- A = [-2 -3 -4; 1 2 1; -6 -7 -8], b = [-3; 1; -9], cT = [-2 -3 -4], d = -5 (clear)

## Beispiel 27 (C1-R1 / C2 / R2-L1 circuit) — no solution found
No handwritten solution in S1, S2 or M (M p.63 is the bare task page).
- Figure (Ex p.28): input terminals on the left (ua, arrow top→bottom). Top rail: left top terminal → C1 → R1 (series) → node A → right top terminal. Bottom rail: left bottom terminal (node B) → R2 → L1 (series) → node C → right bottom terminal. C2 connects node A to node C (shunt between the rails, right side). ub is taken between the right top terminal (A) and right bottom terminal (C), i.e. across C2. A third terminal below the right bottom one is wired back to node B (left bottom), so uc is taken from node C (top) down to node B: uc = voltage across the series R2-L1. No component values given.

## Beispiel 28 (C1-R1-C2 / L1 / R2 circuit) — no solution found
No handwritten solution in S1, S2 or M (M p.64 is the bare task page).
- Figure (Ex p.29): input u1 left (top→bottom). Top rail: left top terminal → C1 → R1 → C2 (all series) → node A → right top terminal. Bottom rail: left bottom terminal (node B) → R2 → node C → right bottom terminal. L1 connects node A to node C (shunt). u2 is across L1 (A to C). Third terminal wired to node B: u3 from node C down to node B = voltage across R2. No component values given.

---

# Exam tasks (`Prüfungen\`)
Calculation tasks only; theory questions omitted. The six JPGs are a student's handwritten solutions to the SS2014 Klausur (not official). "- Copy" PDFs are byte-identical to their originals.

## SS2014 Klausur GrA (11.4.2014), `AAU_Pruefung_SS2014_Klausur_GrA.pdf`
- RB1 (p.2): rT and Gf for RNF system A = [0 1; 3 -4], b = [0; 1], cT = [3 -2], d = 0; poles -3 ± j.
  Student solution JPG `11081522_…n.jpg`: s² + 6s + 10; rT = (13 2)? (uncertain: overwritten, reads "r1 = p0 - a0 = 10 + 3", "r2 = p1 - a1 = 6 - 4"); [-A + b rT]⁻¹ = 1/10·[6 1; -10 0]; Gf = 10/3 (clear).
- RB2 (p.4): controllable/observable? ẋ1 = -3x1 + 4x2 + u, ẋ2 = x1 - 2x2 - 3u, v = -2x1 + x2 + 2u.
  JPG `11072154_…n.jpg`: Qs = [1 -15; -3 7], det = -38 ≠ 0; QB = [-2 1; 7 -10], det = 13 ≠ 0 → steuerbar und beobachtbar (clear).
- RB3 (p.6): same as Beispiel 24 (K1…K11). No printed result.

## SS2014 Klausur GrB, `AAU_Pruefung_SS2014_Klausur_GrB.pdf`
- RB1 (p.2): linearise -C1ẋ1 - C2 sin x1 - C3 x2 cos x2 - C4 u = 0; C5ẋ2 + C6 x1 cos x1 + C7 sin x2 + C8 u = 0; v + C9x1 + C10x2 + C11u = 0; x0 = 0.
  JPG `11081789_…n.jpg`: A = [-C2/C1  -C3/C1; -C6/C5  -C7/C5]? (uncertain: a22 sign reads "+C7/C5" but faint), b = [-C4/C1; -C8/C5] (uncertain), cT = [-C9 -C10], d = -C11.
- RB2 (p.4): rT and Gf for RNF A = [0 1; -2 3], b = [0; 1], cT = [-1 3], d = 0; poles -2 ± j2.
  JPG `11088155_…n.jpg`: s² + 4s + 8; rT = (6 7) (clear after overwriting); [-A + b rT]⁻¹ = 1/8·[4 1; -8 0]; Gf = -8 (clear).
- RB3 (p.6): ẋ1 = 2x1 - 8x2 - 3u, ẋ2 = -3x1 + 5x2 + u, v = x1 - 2x2 - u.
  JPG `11088099_…n.jpg`: Qs = [-3 -14; 1 14], det = -28 ≠ 0; QB = [1 -2; 8 -18], det = -2 ≠ 0 (clear).
- JPG `11076765_…n.jpg` is theory only.

## SS2014 WH-Klausur GrA (15.5.2014), `AAU_Pruefung_SS2014_WH-Klausur_GrA.pdf`
- RB1 (p.2): identical to Beispiel 26. No printed result.
- RB2 (p.4): G(s) and stability for ẋ1 = -2x1 + 3x2 + 3u, ẋ2 = 3x1 - u, v = x1 + 2u. No printed result.
- RB3 (p.6): observer for BNF A = [0 -3; 1 6] (text layer "0 −3 / 16", same as Bsp 18), b = [-8; 16], cT = [0 1], d = 0; poles -3 ± j. No printed result.

## SS2017 Klausur GrA (5.5.2017), `AAU_Pruefung_SS2017_Klausur_GrA.pdf`
- RB1 (p.2): circuit of Beispiel 27 (same figure; checked visually), ua → ub, uc. No values.
- RB2 (p.4): ẋ1 = -4x1 + 3x2 - 2u, ẋ2 = 2x1 - 4x2 + 3u, v = -5x1 + 5x2; BNF and Luenberger observer, poles -1 ± j2. No printed result.
- RB3 (p.6): linearise at x0 = 0: ẋ1 - 1.3x1 - sin(x2)cos(x3) + 2.2u = 0; ẋ2 - 0.27x1² + 2.1x1 cos(x2) + 3.7x3 = 0; ẋ3 + atan(x1) + 0.7u = 0; v + 2.8x1 - 0.3x2 + 4.4x3² = 0. No printed result.

## SS2017 Klausur GrB, `AAU_Pruefung_SS2017_Klausur_GrB.pdf`
- RB1 (p.2): linearise at x0 = 0: ẋ1 - cos(x1)sin(x2) + 3.3x3² = 0; ẋ2 + 1.35x1 + 2.1x2 cos(x2) + 2.1 sin(x3) = 0; ẋ3 + 2.7x2 + atan(x3) - 1.2u = 0; v - 1.4x1² - 1.8x2 - 6.7x3 = 0. No printed result.
- RB2 (p.4): circuit of Beispiel 28 (same figure), u1 → u2, u3. No values.
- RB3 (p.6): ẋ1 = -4x1 + 3x2 - 2u, ẋ2 = 2x1 - 4x2 + 3u, v = 5x1 - 5x2; RNF, state feedback with prefilter, poles -3, -4. No printed result.
