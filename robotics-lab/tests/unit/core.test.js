// The robotics core against a number printed in the sources, Ajanović (2020) chapters 1–5 and the IRB 120 product
// specification (ABB 2020), or a second route (a numerical derivative, a forward-then-inverse round trip, a property
// that holds by definition). Pages are PDF pages of each chapter's file.
import { test } from "node:test";
import assert from "node:assert/strict";
import * as R from "../../src/core/index.js";

const near = (a, b, tol, what) => assert.ok(Math.abs(a - b) <= tol, `${what}: ${a} against ${b}`);
const nearM = (A, B, tol, what) => A.forEach((row, i) => row.forEach((v, j) => near(v, B[i][j], tol, `${what} [${i + 1}][${j + 1}]`)));
const { rad, deg } = R;

test("Grübler (ch. 1, pp. 38–39): 3R gives 3, the four-bar 1, the 2R arm 2", () => {
  assert.equal(R.dof(3, 4, 3, 3), 3);
  assert.equal(R.dof(3, 4, 4, 4), 1);
  assert.equal(R.dof(3, 3, 2, 2), 2);
  assert.equal(R.dof(6, 7, 6, [1, 1, 1, 1, 1, 1]), 6, "the IRB 120, six turning joints in space, by hand");
});

test("plane frames (ch. 2, pp. 34–35): (5, 2) turned 40° and moved (2, 3) is (4.54, 7.74); (4, 8) back is (4.74, 2.54)", () => {
  const p = R.toParent2(rad(40), [2, 3], [5, 2]);
  near(p[0], 4.54, 0.005, "x"); near(p[1], 7.74, 0.01, "y");
  const q = R.toChild2(rad(40), [2, 3], [4, 8]);
  near(q[0], 4.74, 0.01, "x"); near(q[1], 2.54, 0.005, "y");
  // A round trip by definition: back and forth is the identity.
  const back = R.toChild2(rad(40), [2, 3], p);
  near(back[0], 5, 1e-12, "x"); near(back[1], 2, 1e-12, "y");
});

test("rotation matrices are orthonormal with det 1, and Rᵀ = R⁻¹ = R(−θ) (ch. 2, pp. 24 and 53)", () => {
  for (const R3 of [R.Rx(0.7), R.Ry(-1.2), R.Rz(2.5), R.euler("ZYX", [0.3, -0.8, 1.9])]) {
    nearM(R.matmul(R3, R.transpose(R3)), R.identity(3), 1e-12, "R Rᵀ");
    near(R.det(R3), 1, 1e-12, "det");
  }
  nearM(R.transpose(R.Rz(0.4)), R.Rz(-0.4), 1e-15, "Rᵀ = R(−θ)");
});

test("Euler and Cardan examples (ch. 2, pp. 46, 48 and 52) give the printed matrices", () => {
  const ZYX_0_90_0 = [[0, 0, 1], [0, 1, 0], [-1, 0, 0]];
  nearM(R.euler("ZYX", [0, 90, 0].map(rad)), ZYX_0_90_0, 1e-15, "p. 46");
  nearM(R.euler("ZYX", [90, 90, 90].map(rad)), ZYX_0_90_0, 1e-15, "p. 48: the same matrix, from other angles");
  nearM(R.euler("ZYZ", [90, 90, 90].map(rad)), [[-1, 0, 0], [0, 0, 1], [0, 1, 0]], 1e-15, "p. 52");
  // ZY′X″ about moving axes is XYZ about fixed axes (p. 45), and roll-pitch-yaw (p. 50).
  const a = [0.4, -0.9, 1.3];
  nearM(R.euler("ZYX", a), R.euler("XYZ", [...a].reverse(), true), 1e-15, "moving ZYX = fixed XYZ");
  nearM(R.rpy(a[2], a[1], a[0]), R.euler("ZYX", a), 1e-15, "rpy");
});

test("gimbal lock (ch. 2, p. 59): with Y at −90°, the fixed XYZ matrix depends only on α + γ", () => {
  const M = (al, ga) => R.euler("XYZ", [al, rad(-90), ga], true);
  nearM(M(0.3, 0.5), M(0.6, 0.2), 1e-15, "same sum, same matrix");
  const al = 0.3, ga = 0.5;
  nearM(M(al, ga), [[0, -Math.sin(al + ga), -Math.cos(al + ga)], [0, Math.cos(al + ga), -Math.sin(al + ga)], [1, 0, 0]], 1e-15, "printed form");
  assert.ok(R.gimbalLocked("ZYX", [0, rad(90), 0]));
  assert.ok(R.gimbalLocked("ZYZ", [0, 0, 1]));
  assert.ok(!R.gimbalLocked("ZYX", [0, rad(45), 0]));
  // The angles back from a locked matrix still rebuild it.
  const Ml = R.euler("ZYX", [0.7, rad(90), 0.2]);
  nearM(R.euler("ZYX", R.zyxAngles(Ml)), Ml, 1e-12, "rebuilt");
});

// A slip in the source: the example of non-uniqueness on ch. 2, p. 61 is not one.
test("ch. 2, p. 61: z(45)x′(30)z″(−45) is not z(0)x′(30)z″(0); it turns 30° about another axis", () => {
  const A = R.euler("ZXZ", [45, 30, -45].map(rad)), B = R.euler("ZXZ", [0, 30, 0].map(rad));
  // By hand with quaternions: cos(θ/2) = cos²15° + sin²15°·cos 45° = 0.98039, θ = 22.74°.
  near(deg(R.turnAngle(R.matmul(R.transpose(B), A))), 22.74, 0.005, "the two differ by 22.74°");
  // A true twin of a ZXZ triple: (α + 180°, −β, γ + 180°).
  nearM(R.euler("ZXZ", [225, -30, 135].map(rad)), A, 1e-12, "the real second solution");
});

test("ZX′Z″ (ch. 5, p. 8): rows 3–5 of the table give the target; rows 1 and 2 do not", () => {
  const target = [[0, 0, -1], [-1, 0, 0], [0, 1, 0]];
  for (const row of [[90, -90, -180], [90, -90, 180], [-90, 90, 0]]) nearM(R.euler("ZXZ", row.map(rad)), target, 1e-12, `row ${row}`);
  for (const row of [[90, 270, -90], [90, 270, 90]]) {
    const M = R.euler("ZXZ", row.map(rad));
    assert.ok(Math.abs(M[2][1] - 1) > 0.5, `row ${row}: s θ2 c θ3 = ${M[2][1]}, not 1`);
  }
});

test("planar 2R (ch. 2, p. 38): l1 = 5, l2 = 3, θ1 = 20°, θ2 = 64° gives x = 5.012, y = 4.693, r11 = 0.104 (both cut, not rounded)", () => {
  const T = R.planar2rT(5, 3, rad(20), rad(64)), a = R.planar2r(5, 3, rad(20), rad(64));
  // The slide cuts every number after three decimals instead of rounding: 4.6937 shows as 4.693, cos 84° = 0.10453 as
  // 0.104 and sin 84° = 0.99452 as 0.994.
  const cut = (v, printed, what) => assert.ok(v - printed >= 0 && v - printed < 1e-3, `${what}: ${v} does not cut to ${printed}`);
  cut(T[0][2], 5.012, "x"); cut(T[1][2], 4.693, "y"); cut(T[0][0], 0.104, "r11"); cut(T[1][0], 0.994, "r21");
  near(a.tip[1], T[1][2], 1e-12, "the two routes agree");
});

test("the bent arm (ch. 3, p. 3): θ1 = 0 gives (4.12, 7.12), θ1 = 90° gives (−6.12, 5.12)", () => {
  const l = [1, 2, 3, 4];
  const a = R.bentArm(l, 0).tip, b = R.bentArm(l, rad(90)).tip;
  near(a[0], 4.12, 0.005, "x"); near(a[1], 7.12, 0.005, "y"); near(b[0], -6.12, 0.005, "x"); near(b[1], 5.12, 0.005, "y");
  // The slide's own formula: k cos(α + θ1), l1 + k sin(α + θ1), α = asin((l4 + l3 sin 45°)/k).
  const k = Math.hypot(2 + 3 * Math.SQRT1_2, 4 + 3 * Math.SQRT1_2), al = Math.asin((4 + 3 * Math.SQRT1_2) / k);
  near(b[0], k * Math.cos(al + rad(90)), 1e-12, "formula x"); near(b[1], 1 + k * Math.sin(al + rad(90)), 1e-12, "formula y");
});

test("the RRT robot (ch. 3, p. 26): the three printed ⁰T₃ for l1…l4 = 1…4, l5 = 5", () => {
  const T = (t1, t2) => R.chain(R.rrtRows([1, 2, 3, 4], rad(t1), rad(t2), 5)).at(-1);
  nearM(T(0, 0), [[0, 0, 1, 12], [0, -1, 0, 0], [1, 0, 0, 3], [0, 0, 0, 1]], 1e-12, "0°, 0°");
  nearM(T(0, 90), [[-1, 0, 0, 3], [0, -1, 0, 0], [0, 0, 1, 12], [0, 0, 0, 1]], 1e-12, "0°, 90°");
  nearM(T(90, 90), [[0, 1, 0, 0], [-1, 0, 0, 3], [0, 0, 1, 12], [0, 0, 0, 1]], 1e-12, "90°, 90°");
});

test("the DH step is Rot(z, θ)·Trans(z, d)·Trans(x, a)·Rot(x, α) (ch. 3, p. 20)", () => {
  const [t, al, a, d] = [0.7, -1.1, 3, 2];
  const tz = [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, d], [0, 0, 0, 1]], tx = [[1, 0, 0, a], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]];
  const product = [R.hom(R.Rz(t), [0, 0, 0]), tz, tx, R.hom(R.Rx(al), [0, 0, 0])].reduce(R.matmul);
  nearM(R.dh(t, al, a, d), product, 1e-15, "DH");
  nearM(R.matmul(R.dh(t, al, a, d), R.invHom(R.dh(t, al, a, d))), R.identity(4), 1e-12, "T T⁻¹");
});

test("the IRB 120 DH chain puts the wrist centre where the specification's table does (ABB 2020, p. 31)", () => {
  const W = (a2, a3) => R.wristCentre([0, rad(a2), rad(a3), 0, 0, 0]);
  // [axis 2, axis 3, X, Z] as printed, rounded to whole mm there.
  for (const [a2, a3, x, z] of [[0, 0, 302, 630], [0, -77, 0, 870], [0, 70, 169, 300], [110, -77, 545, 91],
                                [-110, -110, -440, -50], [-110, 70, -67, 445], [-110, -77, -545, 91]]) {
    const w = W(a2, a3);
    near(w[0], x, 1.5, `X at ${a2}°, ${a3}°`); near(w[2], z, 1.5, `Z at ${a2}°, ${a3}°`); near(w[1], 0, 1e-9, "Y");
  }
  // Rows D and H print Z = 270 mm; the forearm then lies level at shoulder height, which is 290 mm (p. 12).
  near(W(90, -77)[2], 290.3, 0.1, "row D by this chain"); near(W(90, -77)[0], 580, 0.5, "row D's X agrees");
  near(R.posOf(R.irb120([0, 0, 0, 0, 0, 0])[6])[0], 302 + 72, 1e-9, "the flange 72 mm beyond the wrist (p. 12)");
});

test("the geometric Jacobian (ch. 4, p. 15) matches a numerical derivative of the IRB 120's flange", () => {
  const q = [0.3, -0.4, 0.5, 0.8, -0.6, 1.1], J = R.jacobian(R.irb120(q), Array(6).fill("R")), h = 1e-6;
  for (let i = 0; i < 6; i++) {
    const up = [...q], dn = [...q]; up[i] += h; dn[i] -= h;
    const pu = R.posOf(R.irb120(up)[6]), pd = R.posOf(R.irb120(dn)[6]);
    for (let k = 0; k < 3; k++) near(J[k][i], (pu[k] - pd[k]) / (2 * h), 1e-4, `∂p${k}/∂q${i + 1}`);
  }
  near(R.det(R.jacobian(R.irb120([0.3, -0.4, 0.5, 0.8, 0, 1.1]), Array(6).fill("R"))), 0, 1e-6, "axis 5 at 0°: axes 4 and 6 line up");
});

test("the RT robot's Jacobian (ch. 4, p. 18) and the planar 2R's (p. 20) against a numerical derivative", () => {
  const h = 1e-6, [l1, t1, l2] = [2, 0.6, 1.5];
  const pRT = (t, s) => [(l1 + s) * Math.cos(t), (l1 + s) * Math.sin(t)];
  const J = R.jacobianRT(l1, t1, l2);
  near(J[0][0], (pRT(t1 + h, l2)[0] - pRT(t1 - h, l2)[0]) / (2 * h), 1e-8, "∂x/∂θ1");
  near(J[1][1], (pRT(t1, l2 + h)[1] - pRT(t1, l2 - h)[1]) / (2 * h), 1e-8, "∂y/∂l2");
  // The geometric schema for R then T gives the same top rows (p. 19).
  const frames = R.chain([{ theta: rad(90) + t1, alpha: rad(90), a: 0, d: 0 }, { theta: 0, alpha: 0, a: 0, d: l1 + l2 }]);
  const G = R.jacobian(frames, ["R", "T"]);
  near(G[0][0], J[0][0], 1e-12, "schema ∂x/∂θ1"); near(G[1][1], J[1][1], 1e-12, "schema ∂y/∂l2"); near(G[5][0], 1, 1e-12, "ωz");
  const J2 = R.jacobian2r(5, 3, 0.4, 1.1), f = (a, b) => R.planar2r(5, 3, a, b).tip;
  near(J2[0][1], (f(0.4, 1.1 + h)[0] - f(0.4, 1.1 - h)[0]) / (2 * h), 1e-7, "∂x/∂θ2");
  near(R.det(J2), 5 * 3 * Math.sin(1.1), 1e-12, "det J = l1 l2 sin θ2, by hand");
  assert.equal(R.det(R.jacobian2r(5, 3, 0.4, 0)), 0, "stretched out: singular");
  const e = R.speedEllipse(J2);
  near(e.major * e.minor, Math.abs(R.det(J2)), 1e-9, "the ellipse's area over π is |det J|");
});

test("inverse 2R (ch. 5, p. 10): tip (4, 3), l1 = 3, l2 = 4 has θ = (90°, −90°) and (−16.26°, 90°)", () => {
  const s = R.ik2r(3, 4, 4, 3).solutions.map(x => [deg(x.t1), deg(x.t2)]);
  near(s[0][0], -16.26, 0.005, "θ1"); near(s[0][1], 90, 1e-9, "θ2");
  near(s[1][0], 90, 1e-9, "θ1"); near(s[1][1], -90, 1e-9, "θ2");
});

test("inverse 2R (ch. 5, pp. 19–20): (2, 1) with 4 and 1 is out of reach; (6, 5.93) with 5 and 4 gives ±41.05° and 44.66 ∓ 18.14", () => {
  const none = R.ik2r(4, 1, 2, 1);
  assert.equal(none.reachable, false); near(none.reach.min, 9, 0, "(l1 − l2)²"); near(none.reach.r2, 5, 1e-12, "x² + y²");
  const s = R.ik2r(5, 4, 6, 5.93).solutions;
  near(deg(s[0].t2), 41.05, 0.005, "θ2"); near(deg(Math.atan2(5.93, 6)), 44.66, 0.005, "atan2(y, x)");
  near(deg(s[0].t1), 44.66 - 18.14, 0.01, "θ1, elbow one way"); near(deg(s[1].t1), 44.66 + 18.14, 0.01, "θ1, the other way");
});

test("forward then inverse returns the joints, and the triangle route (ch. 5, p. 13) agrees with atan2", () => {
  for (const [t1, t2] of [[0.3, 1.2], [-2.1, 0.4], [2.6, -1.7], [1, -0.2]]) {
    const tip = R.planar2r(5, 3, t1, t2).tip, s = R.ik2r(5, 3, tip[0], tip[1]).solutions.find(x => Math.sign(x.t2) === Math.sign(t2));
    const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
    near(wrap(s.t1 - t1), 0, 1e-9, "θ1"); near(s.t2, t2, 1e-9, "θ2");
    if (t2 > 0) { const g = R.ik2rTriangle(5, 3, tip[0], tip[1]); near(wrap(g.t1 - t1), 0, 1e-9, "triangle θ1"); near(g.t2, t2, 1e-9, "triangle θ2"); }
  }
  const p = R.fkTurnTilt(1, 2, 0.7, -0.3), b = R.ikTurnTilt(1, 2, p);
  near(b.t1, 0.7, 1e-12, "turn"); near(b.t2, -0.3, 1e-12, "tilt"); assert.ok(b.reachable);
});

test("the student's seven-row DH table gives his printed home pose and this lab's flange at any axes (forward_kinematics(jupyter).ipynb)", () => {
  nearM(R.irb120Student([0, 0, 0, 0, 0, 0])[7], [[0, 0, 1, 374], [0, -1, 0, 0], [1, 0, 0, 630], [0, 0, 0, 1]], 1e-9, "home");
  const q = [0.3, -0.5, 0.4, 1, 0.7, -0.2];
  nearM(R.irb120Student(q)[7], R.irb120(q)[6], 1e-9, "both tables");
});

test("the three-link arm backs off to its wrist and reaches the TCP at the tool angle (round trip, by definition)", () => {
  const s = R.ik3r(3, 4, 2, 4, 3, rad(30));
  for (const x of s.solutions) {
    const e = R.planar2r(3, 4, x.t1, x.t2).tip, tip = [e[0] + 2 * Math.cos(x.t1 + x.t2 + x.t3), e[1] + 2 * Math.sin(x.t1 + x.t2 + x.t3)];
    near(tip[0], 4, 1e-9, "x"); near(tip[1], 3, 1e-9, "y"); near(x.t1 + x.t2 + x.t3, rad(30), 1e-9, "φ");
  }
});

test("the IRB 120's wrist split gives axes that reach the same flange pose, over 200 poses (round trip, by definition)", () => {
  for (let k = 0; k < 200; k++) {
    const q = [1 - 2 * Math.sin(k), Math.cos(3 * k), 0.8 * Math.sin(5 * k) - 0.3, 2 * Math.sin(7 * k), 0.2 + 1.5 * Math.abs(Math.sin(11 * k)), Math.sin(13 * k)];
    const T = R.irb120(q)[6], s = R.ikIrb120(T, R.irb120);
    assert.equal(s.solutions.length, 2, `pose ${k}: two elbows`);
    for (const x of s.solutions) nearM(R.irb120(x.q)[6], T, 1e-8, `pose ${k}, elbow ${x.sign}`);
  }
});
