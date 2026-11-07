# Python beside the lab's charts

Each view with a time plot, at its default sliders and the end of its animation: `<view>-python.png` is the snippet's
own figure (its `plt.plot`, run with `python -P` on a copy, Agg backend), `<view>-lab.png` the lab's own series drawn
with the same matplotlib (dashed). `<view>.json` holds the numbers of every state. Drawn by
`node kit/scripts/python-plots.mjs modsim-lab` on 7 Nov 2026; each pair looked at by eye. The lab draws mm and °
where solve_ivp gives m and rad.

| View | Compared | Verdict | Python | Lab |
|---|---|---|---|---|
| einmasse-s4 | x | agrees | 0.03283 m at 0.243 s, final −1.91 mm | 32.9 mm at 0.25 s, −1.92 mm |
| pendel-s2 | φ, nonlinear and linear | agrees | 0.0662 / 0.0689 rad at 8 s | 3.80° / 3.96° |
| zweimasse-s4 | x1, x2 | agrees | 9.40 / 19.49 mm at 0.22 s; final −0.99 / −2.87 mm | 9.42 / 19.49 mm; −0.97 / −2.88 mm |
| doppel-s2 | φ2 of two runs 0.001 rad apart | differs, expected | RK45 at rtol 1e-3 | the lab's own integrator: a chaotic run; no final state can be compared (said in the view) |
| doppel-s3 | energy | differs: different quantity | plots E − E(0): drifts to 2.1 J at rtol 1e-3, as MATLAB's ode45 at its defaults would | plots K + V, constant 9.807 J |
| rlc-s4 | u_C, i | agrees | q/C peak 1.162 at 0.035 s, final 1.000; i 0.0507 A | 1.163 at 0.036 s, 1.000; 10·i 0.546 |
| motor-s4 | ω, i_A | agrees | ω 106.4 at 3 s; i_A 9.81 at 1.28 s | 106.4; 10·i_A 98.1 at 1.27 s |
| shaker-s4 | x (with back-EMF) | agrees | final 1.000, ts 0.52 s | 1.000, 0.50 s |
| rolle-s3 | φ | agrees | 0.1968 rad at 3.0 s, final 0.1725 | 11.28° (0.1968 rad), 9.95° |
| task2-s2 | y, θ | agrees (lab draws y − y*) | θ 0.84 rad peak, y about 0.29 m ± 0.02 | θ 48.8°, y − y* ± 25 mm |
| task3-s2 | x, θ | agrees | −0.0840 m at 0.47 s; θ 0.867 rad | −84.1 mm at 0.47 s; θ 50.8° (0.887 rad) |
| task5-s3 | x1, x2 | agrees | 0.0258 m at 0.044 s; −0.0299 m | 25.8 mm; −30.0 mm |
| task6-s3 | φ1, φ2 | agrees | 0.1759 / −0.302 | 0.1755 / −0.307 |
| task7-s3 | x1, x2 | agrees | final −0.0192 / −0.0354 m | −19.3 / −35.3 mm |

No disagreement in the lab or the snippets. doppel-s3: the snippet shows the integrator's drift at default
tolerances (its comment says so); a smaller `rtol` would shrink it. Left as it is, for you to decide.
