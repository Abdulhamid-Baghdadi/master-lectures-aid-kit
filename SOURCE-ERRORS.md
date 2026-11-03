# Source errors: review of 3 Nov 2026

The builders reported these errors overnight. On 3 Nov I checked each one: I read the cited page, as text with
pdftotext or as a rendered image where the content is drawn or typeset, and recomputed the value in an independent
Python script.

## Confirmed

| Course | Where | The source says | Correct | Check |
|---|---|---|---|---|
| IHA | Übung 5_3 | ω = 5.54 s⁻¹ for 50 rpm | 2π·50/60 = 5.236 s⁻¹ | recomputed (page read during the build) |
| IHA | Kap. 3, Blatt 79 (PDF p. 69), magnet gripper | "B Magnetische Induktion in H (Henry)" | flux density is in tesla; henry is inductance | page image read |
| IRB | ch. 2 p. 61 | z(45) x′(30) z″(−45) "entspricht auch" z(0) x′(30) z″(0) | the two differ by a 22.74° rotation | page read; angle of Aᵀ·B |
| IRB | ch. 5 p. 8, ZX′Z″ table | five rows solve the target matrix | rows 1 (90, 270, −90) and 2 (90, 270, 90) do not; rows 3–5 do | page image read; Rz·Rx·Rz compared with the target |
| IRB | ABB spec p. 31, rows D and H | Z = 270 mm | Z = 290 mm | page image read; the geometry (290, 270, 70, 302 mm) reproduces rows A, B, C and E within 1 mm |
| ASENS | slides p. 78 | λmod = 15 m at 20 kHz | 20 kHz gives 15 km; 15 m needs 20 MHz | page read; c/f |
| ASENS | p. 87 (folio 173), stereo table | 6 µm pixels | every z from z = b·f/(d·p) fits p = 7.68 µm; the FOV column does fit 6 µm (75.0° at f = 4 mm) | page image read; all four rows recomputed |
| MUS | Gaussianfilters p. 6 | mean of the new state: A·x − B·u | A·x + B·u, as eq. (1) and "x = Ax + Bu + ε" on the same page give | page image read |
| MUS2 | 2_Segmentation p. 31, eq. 19 | (q, V, t) for h = 2 | (p, V, t) | page image read; colorsys gives R = 0 = p at H = 150° |
| MUS2 | 10_CNN p. 7 | dense: nL−1 · nL + 1 | (nL−1 + 1) · nL; the conv line on the same page puts the +1 inside, so it is correct there | page image read; 3→2 nodes: 8, not 7 |
| MUS2 | 10_CNN pp. 15–16, SGD example | inputs 2 and 3, weights 1, h1 = 6; ∂h1/∂in1 = 3, ∂h1/∂in2 = 2 | with weights 1, h1 = 5; in a linear node ∂h1/∂in = w = 1 | page images read |
| CAE | 04 p. 62 | σMises = √(σx² + σy² + σz²), handwritten | √(½[(σx−σy)² + (σy−σz)² + (σz−σx)²]) without shear; with shear, add 3(τxy² + τyz² + τzx²) under the root | page image read; σx = 100, σy = −100: 173 against 141 |
| CAE | ModSim handout p. 28 | stable "wenn alle Re(λ) < 0", for λ = ω0i² from \|K − λM\| = 0 | λ = ω² is real and ≥ 0 for positive semi-definite K and M, so the rule can never hold there; it belongs to the eigenvalues of the state (Jacobian) matrix | page image read |

## Depends on a convention

- MUS2 4.Edges p. 7 gives θ = atan2(fx, fy). The usual form is atan2(fy, fx), with θ measured from x. If the
  course measures θ from the y axis, the slide is consistent. Ask the lecturer which is meant.

## Partly checked

- MUS2 2_Segmentation p. 14 names J = (μ1 − μ2)²/(σ1² + σ2²) as Otsu's criterion and cites Bishop (2006) §4.1.4.
  The criterion has the form of Fisher's discriminant. I did not confirm that §4.1.4 is Fisher's from the Bishop PDF
  (the text search was too slow and I stopped it), and I have not read Otsu (1979). The claim that Otsu uses a
  different criterion is unchecked against both primary sources.
