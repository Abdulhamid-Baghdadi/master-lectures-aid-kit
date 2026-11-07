# Task sheet: Aufgabenstellung zu ModSim und MKS

Source: `H:\My Drive\02_Personal\02_Education\FH\03_FH_Master\2. Semester\ModSim\Aufgabenstellung_ModSim_MKS_v01.pdf`
(7 pages, header "Aufgabenstellung zu ModSim und MKS", author A. Mario Puhwein, footer "© FHWN").
Read on 2026-11-07 from page renders at 110 dpi. An identical-named copy lies in `Teams - General\`.

## What the sheet gives, and what it does not

- Each task is only a numbered title and a figure. There is no written question, no parameter values, no units,
  no initial conditions and no solution.
- **No figure labels a coordinate.** Generalised coordinates, their origins and directions are not drawn on the
  sheet; every coordinate below is my proposal, not the sheet's.
- Springs and dampers carry no symbol (no k, c); only masses, lengths, inertias and excitations are labelled.
- The grey curved symbol drawn at several pivots looks like a rotational spring-damper (torsion spring plus
  rotary damper) [unclear: no label says so].
- Excitations are written as `M_1(t) = M_01 cos(Ω_1 t + φ_1)` and similar; Ω is the excitation frequency and φ the
  phase. On pp. 5-6 the phase is omitted: `M_1(t)=M_01 cos(Ωt)`, `F_1(t)=F_01 cos(Ωt)`.
- `g` (gravity, red arrow pointing down) appears on every figure except task 6.

The "what is asked" line is inferred from the course context (the student report, p. 1, states the common goal:
model analytically, derive the ODE, linearise, matrix form, state space, Jacobian, simulate and compare).

## Tasks

### 1. Elastisches Pendel (p. 1)
- Asked: equations of motion of a pendulum whose rod is an elastic spring-damper, driven by a moment at the pivot.
- Figure: fixed ceiling pivot; from it a link containing a spring and a damper in parallel (axial); at the end a
  rectangular rigid body `m_1`. Moment `M_1(t) = M_01 cos(Ω_1 t + φ_1)` acts at the pivot (red curved arrow);
  rotational spring-damper symbol at the pivot. `g` down.
- Symbols: `m_1` mass of the block; `M_1(t)`, `M_01` amplitude, `Ω_1` frequency, `φ_1` phase; `g`.
- DoF: 2 (swing angle, spring elongation); 3 if the block's own rotation is free of the rod [unclear: the block
  looks rigidly fixed to the rod end].
- Lagrange 2nd kind: **yes**. Coordinates: angle φ from the vertical, rod length r = l_0 + u (or u alone). Block
  as rigid body: T = ½ m_1 (ṙ² + r² φ̇²) + ½ J_1 φ̇² (J_1 needed if block rotates with the rod).

### 2. Pendel mit Federaufhängung (p. 1)
- Asked: equations of motion of a pendulum hanging from a spring-suspended, vertically guided block.
- Figure: fixed ceiling pivot; spring and damper in parallel (vertical) down to a block `m_2` guided between two
  vertical walls (vertical translation only). Rod `m_1, l_1` pinned at the centre of `m_2`, point mass `m_3` at the
  rod end. Moment `M_1(t) = M_01 cos(Ω_1 t + φ_1)` at the pin (rotational spring-damper symbol there); force
  `F_1(t) = F_01 cos(Ω_1 t + φ_1)` acting downward on `m_2`. `g` down.
- Symbols: `m_1` rod mass, `l_1` rod length, `m_2` block mass, `m_3` end mass, `M_1`, `M_01`, `F_1`, `F_01`,
  `Ω_1`, `φ_1`, `g`.
- DoF: 2.
- Lagrange 2nd kind: **yes**. Coordinates: y vertical displacement of `m_2` (downward from spring-unstretched
  position), φ rod angle from the downward vertical. (This is the task the student group modelled.)

### 3. Horizontal angeregtes Pendel (p. 2)
- Asked: equations of motion of a pendulum on a horizontally sliding, spring-tied cart.
- Figure: wall on the left; spring and damper in parallel (horizontal) to a block `m_2` sliding on the floor.
  Rod `m_1, l_1` pinned at `m_2` hanging down (through the floor line in the drawing), point mass `m_3` at its end.
  Moment `M_1(t) = M_01 cos(Ω_1 t + φ_1)` at the pin (rotational spring-damper symbol); force
  `F_1(t) = F_01 cos(Ω_1 t + φ_1)` acting horizontally to the right on `m_2` (applied via a green post on top).
  `g` down.
- Symbols: as task 2 (`m_1, l_1, m_2, m_3, M_1, M_01, F_1, F_01, Ω_1, φ_1, g`).
- DoF: 2.
- Lagrange 2nd kind: **yes**. Coordinates: x horizontal position of `m_2` from spring-unstretched position
  (right positive), φ rod angle from the downward vertical.

### 4. Unwucht erregter Schwinger (p. 2)
- Asked: equations of motion of a two-mass vertical oscillator excited by a rotating unbalance.
- Figure: vertical guide channel (walls left and right). From bottom: ground, spring-damper (parallel) up to
  block `m_1`; from `m_1` spring-damper up to block `m_2` (top block, no further connection above). A rod
  `m_3, l_3` pinned at `m_1` carries point mass `m_4`; the rod is driven at prescribed speed `Ω(t)` (blue arrow).
  `g` down.
- Symbols: `m_1, m_2` blocks; `m_3, l_3` rod mass and length; `m_4` unbalance mass; `Ω(t)` drive angular
  velocity [unclear whether Ω(t) is a prescribed speed or a torque; drawn blue like the path excitations].
- DoF: 2 (vertical positions of `m_1` and `m_2`) if the rotation is prescribed (rod angle Ω t, or ∫Ω dt);
  3 if the rod angle is free.
- Lagrange 2nd kind: **yes**. Coordinates: y_1, y_2 vertical displacements (upward) of `m_1`, `m_2`; rod angle
  β(t) = ∫Ω dt is a rheonomic constraint, enters T and V as a given function of time.

### 5. Weganregung des 2-Massenschwingers (1/4 Auto Modell) (p. 3)
- Asked: equations of motion of a quarter-car model under base (road) excitation.
- Figure: vertical chain from bottom: base point with path excitation `w(t) = ŵ_0 cos(Ωt + φ)` (blue arrow up),
  spring-damper (parallel) to `m_1` (wheel), spring-damper to `m_2` (body). `g` down.
- Symbols: `m_1, m_2`; `w(t)` base displacement, `ŵ_0` amplitude, `Ω`, `φ`; `g`.
- DoF: 2.
- Lagrange 2nd kind: **yes**. Coordinates: x_1, x_2 upward displacements of `m_1`, `m_2`; w(t) enters V
  (spring k_1 (x_1 − w)) and the damper force (c_1 (ẋ_1 − ẇ)) as a known input.

### 6. 2DoF - Torsionsschwinger (p. 3)
- Asked: equations of motion of a two-inertia torsional oscillator.
- Figure: horizontal shaft. Left end: angular path excitation `w(t) = ŵ_0 cos(Ωt + φ)` (blue curved arrow);
  torsion spring and rotary damper in parallel to disc `J_1`; moment `M_1(t) = M_01 cos(Ω_1 t + φ_1)` on `J_1`;
  torsion spring-damper to disc `J_2`; moment `M_2(t) = M_02 cos(Ω_2 t + φ_2)` on `J_2`. No `g`.
- Symbols: `J_1, J_2` mass moments of inertia; `w, ŵ_0, Ω, φ`; `M_1, M_01, Ω_1, φ_1`; `M_2, M_02, Ω_2, φ_2`.
- DoF: 2.
- Lagrange 2nd kind: **yes**. Coordinates: rotation angles φ_1, φ_2 of `J_1`, `J_2` (same sense as w).

### 7. Weganregung des aufgehängten 2-Massenschwingers (p. 4)
- Asked: equations of motion of a hanging two-mass chain excited at its top.
- Figure: from the top: suspension point moved by `w(t) = ŵ_0 cos(Ωt + φ)` (blue arrow up), damper and spring
  in parallel down to `m_1`, damper and spring in parallel down to `m_2` (free bottom). `g` down.
- Symbols: `m_1, m_2, w, ŵ_0, Ω, φ, g`.
- DoF: 2.
- Lagrange 2nd kind: **yes**. Coordinates: x_1, x_2 vertical displacements (e.g. downward) of `m_1`, `m_2`.

### 8. Koppelpendel (p. 4)
- Asked: equations of motion of two pendulums coupled by a spring-damper.
- Figure: ceiling with two pivots. Left pendulum: rod labelled `m_1, l_1` above and again `m_1, l_1` below the
  coupling point, end mass `m_3`; right: rod `m_2, l_2` (also labelled twice), end mass `m_4`. A horizontal spring
  and damper in parallel join the two rods at about mid-length. Moments `M_1(t) = M̂_01 cos(Ω_1 t + φ_1)` and
  `M_2(t) = M̂_02 cos(Ω_2 t + φ_2)` at the pivots (rotational spring-damper symbols there). `g` down.
- Symbols: `m_1, l_1, m_2, l_2, m_3, m_4`; `M̂_01, M̂_02` (with hat), `Ω_1, Ω_2, φ_1, φ_2`; `g`.
  [unclear: the double label `m_1, l_1` probably means the coupling point splits each rod into two segments of
  mass m_1 and length l_1 each, so the rod has length 2 l_1.]
- DoF: 2.
- Lagrange 2nd kind: **yes**. Coordinates: angles φ_1, φ_2 of each rod from the downward vertical. Coupling
  spring elongation is nonlinear in the angles (or linearised: l_1 (sin φ_1 − sin φ_2)).

### 9. 2-Massen-Schwinger mit Rollen (p. 5)
- Asked: equations of motion of two rolling discs coupled by springs and dampers.
- Figure: wall left, floor. Spring and damper (parallel) from the wall to the axle of disc `m_1`; spring and
  damper from axle of `m_1` to axle of disc `m_2`. Moment `M_1(t)=M_01 cos(Ωt)` on `m_1`; force
  `F_1(t)=F_01 cos(Ωt)` to the right on axle of `m_2`. `g` down.
- Symbols: `m_1, m_2` disc masses; `M_01, F_01, Ω`; `g`. Disc radii and inertias are not labelled.
- DoF: 2 (assuming rolling without slipping).
- Lagrange 2nd kind: **yes**. Coordinates: x_1, x_2 axle positions (right positive); rotations follow
  φ_i = x_i / r_i. Needs radii and J_i (e.g. solid disc ½ m r²), which the sheet does not give.

### 10. 2-Massen-Schwinger mit Rollen (p. 5)
- Asked: as task 9, with a different attachment.
- Figure: as task 9, but the wall spring-damper attaches to the **top** of disc `m_1` (at its rim), not the axle.
  Disc-to-disc spring-damper from the right side of `m_1` [unclear: at axle height, apparently at the rim] to the
  left side of `m_2` [unclear: rim of `m_2` at axle height]. `M_1(t)=M_01 cos(Ωt)` on `m_1`;
  `F_1(t)=F_01 cos(Ωt)` to the right on axle of `m_2`. `g` down.
- Symbols: as task 9.
- DoF: 2 (rolling without slipping).
- Lagrange 2nd kind: **yes**. Coordinates: x_1, x_2 axle positions; the top-of-rim point of a rolling disc moves
  2 x_1, so the wall spring stretches by 2 x_1.

### 11. Rollen-Pendel (p. 6)
- Asked: equations of motion of a pendulum hanging from a rolling disc.
- Figure: wall left, floor. Spring and damper (parallel) from wall to the top of disc `m_1` (at its rim).
  Rod pinned at the axle of `m_1` (passing through the floor in the drawing) with disc/ball `m_2` at its end.
  `M_1(t)=M_01 cos(Ωt)` and `F_1(t)=F_01 cos(Ωt)` (to the right) act on the disc axle. `g` down.
- Symbols: `m_1, m_2, M_01, F_01, Ω, g`. Rod mass and length not labelled [unclear: treat the rod as massless,
  length l].
- DoF: 2 (rolling without slipping).
- Lagrange 2nd kind: **yes**. Coordinates: x axle position, φ pendulum angle from downward vertical.
  [unclear: whether `M_1` acts on the disc or between disc and rod.]

### 12. Rollen-Pendel (p. 6)
- Asked: as task 11.
- Figure: as task 11, but the wall spring-damper attaches at axle height, to the left rim of `m_1`
  [unclear: rim or axle]. `M_1(t)=M_01 cos(Ωt)`, `F_1(t)=F_01 cos(Ωt)` on `m_1`. `g` down.
- Symbols, DoF and Lagrange judgement: as task 11 (**yes**; x, φ). For an axle-height attachment the spring
  stretches by x.

### 13. Robotermanipulator (p. 7)
- Asked: equations of motion of a two-link planar arm (double pendulum) with joint drives.
- Figure: ceiling pivot; link 1 `m_1, l_1` with joint mass `m_3` at its end; link 2 `m_2, l_2` with end mass `m_4`.
  Joint moments `M_1(t) = M_01 cos(Ω_1 t + φ_1)` at the base and `M_2(t) = M_02 cos(Ω_2 t + φ_2)` at the elbow;
  rotational spring-damper symbols at both joints. `g` down.
- Symbols: `m_1, l_1, m_2, l_2, m_3, m_4`; `M_01, M_02, Ω_1, Ω_2, φ_1, φ_2`; `g`.
- DoF: 2.
- Lagrange 2nd kind: **yes**. Coordinates: absolute angles φ_1, φ_2 of each link from the downward vertical, or
  relative elbow angle (then the elbow spring acts on φ_2 directly). Mass matrix depends on cos(φ_1 − φ_2).

## Summary of judgements

All 13 tasks are holonomic, 2-DoF (task 1 possibly 3) systems with springs, viscous dampers and given forces,
moments or path excitations, so each fits the lecture recipe: T, V, generalised forces Q from M, F and the damper
terms (or a Rayleigh function D), then Lagrange 2nd kind gives two coupled second-order ODEs. Rolling tasks (9-12)
need the no-slip constraint built into the coordinates, plus radii and inertias that the sheet does not give.
Path excitations (5, 6, 7) and the prescribed unbalance rotation (4) enter as known functions of time.
