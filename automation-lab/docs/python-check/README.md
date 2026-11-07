# Python beside the lab's charts

Each view with a time plot, at its default sliders and the end of its animation: `<view>-python.png` is what the view's
Python snippet gives (python-control 0.10.2, run with `python -P` on a copy), `<view>-lab.png` the lab's own series
drawn with the same matplotlib (dashed). `<view>.json` holds the numbers. Drawn by
`node kit/scripts/python-plots.mjs automation-lab` on 7 Nov 2026; each pair looked at by eye.

Numbers are peak (value at time), final value and 2 % settling time, Python / lab. python-control's `step` picks its
own time span, so a Python run can end earlier or later than the lab's; the lab draws its own units (rpm, °, mm)
where the snippet gives SI (rev/s ×60 = rpm, rad).

| View | Compared | Verdict | Python | Lab |
|---|---|---|---|---|
| placement-s2 | v with prefilter | agrees | 1.360 at 1.12 s, final 1.000, ts 3.63 s | 1.360 at 1.12 s, 0.999, 3.63 s |
| placement-s4 | v with Kf = 1 and with Kf | agrees | −1.768 / 1.360 at 1.12 s; final −1.300 / 1.000 | −1.768 / 1.360 at 1.12 s; −1.299 / 0.999 |
| observer-s2 | x and x̂ (lsim) | agrees | x1 −44.19, x2 −68.43 at 2 s | the same |
| combined-s3 | v with observer | agrees (Python stops at 2.3 s) | 0.998 at 2.3 s, ts 1.70 s | 1.000, ts 1.73 s |
| combined-s4 | x1, x̂1 from x0 ≠ x̂0 | agrees | −18.36 at 0.73 s, final 1.001 | −18.36 at 0.73 s, 1.001 |
| task0-s2/s3 | controller 1 (Python draws one of the six) | agrees | final 0.998, ts 3.54 s | 0.998, 3.52 s |
| task1-s1 | u, unlimited (Python has no ±10 V limit) | agrees | 5.039 V at 0.081 s, final 5.008 | 5.039 at 0.081 s, 5.001 |
| task1-s2 | n with observer | agrees | 2522 rpm at 0.078 s, ts 0.056 s | 2522 at 0.078 s, 0.055 s |
| task1-s3 | n after the C2 defect | **differed: lab cut the run short; lab fixed** | 2593 at 0.202 s, final 2497 (still in its 2 % band), ts 0.267 s | before: run ended at 0.133 s, 2385 rpm, "steady error −115 rpm"; now 2593 at 0.202 s, 2500, 0.264 s |
| task2-s1 | x of the crane (Butterworth) | agrees | 2.633 m at 6.7 s, final 2.5 | the same |
| task2-s2 | x (LQR) | agrees | 2.598 at 29.4 s, final 2.588 | the same |
| task2-s3 | x with observer | differs by design | linear loop from rest, unit step: 1.053 at 6.71 s (×2.5 = 2.63 m), φ peak −3.2° | nonlinear crane from φ = 1.1°: 2.575 at 7.08 s, φ −3.7°; the snippet says step cannot run the nonlinear model |
| task2-s4 | x with PI (unit step) | agrees (×2.5) | 0.04264 at 60 s | 0.1066 = 2.5 × 0.04264 |
| crane-s2 | φ, linear model | agrees | −0.3399 rad = −19.48° at 0.82 s | −19.48° at 0.82 s; Python's y is the trolley, x[:, 0] is φ |
| linearise-s2 | nonlinear and linear pendulum | agrees | final 0.0299 / 0.0280 rad | 0.0302 / 0.0280 (RK45 tolerance) |
| models-s2/s3 | v, x1 | agrees | −713 / 2361 at 1 s | the same |
| motor-s2/s3 | n | agrees | 48.19 / 40.42 rev/s | 2892 / 2425 rpm (×60) |
| normalforms-s4 | RNF and BNF step | agrees | 0.906 at 0.42 s, final 0.498 | 0.907 at 0.44 s, 0.498 |
| circuit-s3 | Uh | agrees | 1.649 at 0.019 s, final 0.925 | 1.650 at 0.020 s, 0.925 |
| circuits-s2 | ub, uc | agrees | 0.441 at 0.006 s, final 0.3125 | 0.440, 0.3125 |

Pure-matrix views (normal forms, Q_S/Q_B, gains) have no chart and are held by `tests/unit/python-run.test.js`.
