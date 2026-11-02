# Robot Kinematics

Eight ideas of robot kinematics to play with in the browser, from counting a robot's freedoms to solving a two-link arm
backwards, after the lecture slides of Ajanović (2020), *Industrierobotik* (IRB), FH Technikum Wien, based on slides by
M. Aburaia, and the product specification of the ABB IRB 120 (ABB 2020).

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/irb120-dark.gif">
  <img src="docs/irb120-light.gif" alt="The IRB 120 lab: as axis 2 tilts from −60 to +110 degrees, the six-axis arm leans forward and down and the wrist-centre readout follows" width="720">
</picture>

## What is in it

| Chapter | Labs |
|---|---|
| 1 Introduction (ch. 1) | Grübler's count of degrees of freedom |
| 2 Frames and rotations (ch. 2) | a point in two plane frames and the homogeneous transform; Euler, Cardan and roll-pitch-yaw angles with gimbal lock |
| 3 Forward kinematics (ch. 2–3, ABB) | the planar two-link arm and the bent arm; the Denavit–Hartenberg chain of the slides' RRT robot; the IRB 120 as a DH chain |
| 4 Velocity kinematics (ch. 4) | the Jacobian of the two-link arm, its speed ellipse and its singular poses |
| 5 Inverse kinematics (ch. 5) | both solutions of the two-link arm and its ring of reach |

Each lab has a drawing to move, readouts worked by the core, a table of its equations with chapter and PDF page, and
practice questions. Where the slides or the specification print a result the questions use it; the rest were worked by
hand and say so.

<img src="docs/light.png" alt="The overview in the light theme: five chapters in rows, each lab a card with a line drawing of its idea" width="640">
<img src="docs/dark.png" alt="The inverse-kinematics lab in the dark theme: a two-link arm reaching the target (4, 3) in two ways inside its ring of reach, with both solutions read out beside it" width="640">

## Where the lab and the sources differ

- **The IRB 120's DH table is built here.** Neither the slides nor the specification give one. The lab builds it from the
  dimensions on p. 12 (290, 270, 70, 302 and 72 mm) and checks it against the wrist-centre table on p. 31: seven of the
  nine rows agree within 1 mm.
- **Rows D and H of that table (ABB 2020, p. 31) print Z = 270 mm.** With axis 2 at ±90° and axis 3 at −77° the upper
  arm lies level at the shoulder, 290 mm up (p. 12), and the forearm, turned 77° to cancel its 13° step
  (tan⁻¹(70/302)), lies level too, so the wrist centre is at 290 mm. The same geometry gives rows A, B, C, E, F, G and J
  as printed. Likely a misprint; the lab says so where the row is picked.
- **Ch. 2, p. 61 says z(45°)x′(30°)z″(−45°) equals z(0°)x′(30°)z″(0°).** It does not: the first turns 30° about an axis
  at 45° in the xy-plane, the second about x, and the two differ by 22.74° (by quaternions: cos(θ/2) = cos²15° +
  sin²15° cos 45°). A true second set for the first is (225°, −30°, 135°). Checked in `tests/unit/core.test.js`.
- **Ch. 5, p. 8, the ZX′Z″ table:** rows 3–5 give the target matrix; rows 1 and 2 (θ2 = 270°) give sin θ2 cos θ3 = 0
  where the target needs 1, so they are not solutions. The slide picks row 3, which is right.
- **The slides cut numbers after three decimals** instead of rounding: ch. 2, p. 38 prints 4.693 for 4.6937, 0.104 for
  cos 84° = 0.10453 and 0.994 for sin 84° = 0.99452.

## Open it

Not published. Locally, serve the repository's root and open `/robotics-lab/`:

```bash
python -m http.server 8781 --bind 127.0.0.1
```

Tests: `node --test "tests/unit/*.test.js"` in this folder. The README pictures: `node scripts/record-readme.mjs`, with
the server on port 8781 (see the script's head).

## Limits

Ideal rigid links and joints, no play, no masses. The IRB 120's axes 4–6 turn by this lab's DH frames; their signs are
not checked against the robot. A learning aid; no text of the slides is reproduced, and equations are cited by chapter
and PDF page.
