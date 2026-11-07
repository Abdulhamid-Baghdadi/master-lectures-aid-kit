# Python beside the lab's charts

Checked with `node kit/scripts/python-plots.mjs robotics-lab` on 7 Nov 2026. The only stepped view with a chart is
jacsteps-s2 (det J over θ2); its Python prints det J at the one slider angle and plots nothing, so there is no pair
to draw (`jacsteps-s2-lab.png` is the lab's curve alone). The IK views draw the arm, not a time or frequency plot;
their joint angles and J are compared number by number in `tests/unit/python-run.test.js`. The rotations lab does
not mount on the kit's fake page (no `classList`), so the script skips it; it has no time plot.

| View | Compared | Verdict | Python | Lab |
|---|---|---|---|---|
| jacsteps-s2 | det J | no Python curve | det J at the slider angle (tested) | l1 l2 sin θ2, −15 at −90° |
