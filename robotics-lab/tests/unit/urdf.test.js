// The lab's IRB 120 chain against the ROS-Industrial description the student's project used (catkin_irb, read
// 7 Nov 2026): irb120_support/urdf/irb120_2.urdf, joints joint_1…joint_6 at lines 209–254 and the tool flange
// joint_endeffector at line 257. Each joint is Trans(xyz) · Rot(z, yaw) · Rot(y, pitch) · Rot(x, roll) · Rot(axis, q),
// every axis z = (0 0 1); the URDF is in metres, the lab in millimetres. The mapping is the identity: the URDF's joint
// angle is the lab's axis angle (the lab adds its −90° to θ2 itself), and the URDF's flange frame is the lab's frame 6.
import { test } from "node:test";
import assert from "node:assert/strict";
import { irb120, IRB120, rad } from "../../src/core/index.js";

// [xyz in mm, rpy in rad] of joint_1…joint_6 (lines 210, 218, 226, 234, 242, 250); the flange 72 mm on (line 258).
const H = 1.5708; // the URDF writes 90° to four decimals
const JOINTS = [[[0, 0, 165], [0, 0, 0]], [[0, 0, 125], [-H, 0, 0]], [[0, -270, 0], [0, 0, -H]],
  [[70, 0, 0], [-H, 0, 0]], [[0, 0, 302], [H, 0, 0]], [[0, 0, 0], [-H, 0, 0]]];
const FLANGE = [0, 0, 72];
// Limits in rad (lines 213, 221, 229, 237, 245, 253).
const LIMITS = [[-2.87979, 2.87979], [-1.91986, 1.91986], [-1.91986, 1.22173], [-2.79253, 2.79253], [-2.094395, 2.094395], [-6.98132, 6.98132]];

const mul = (A, B) => A.map(r => B[0].map((_, j) => r.reduce((s, v, k) => s + v * B[k][j], 0)));
const tr = p => [[1, 0, 0, p[0]], [0, 1, 0, p[1]], [0, 0, 1, p[2]], [0, 0, 0, 1]];
const rx = t => [[1, 0, 0, 0], [0, Math.cos(t), -Math.sin(t), 0], [0, Math.sin(t), Math.cos(t), 0], [0, 0, 0, 1]];
const ry = t => [[Math.cos(t), 0, Math.sin(t), 0], [0, 1, 0, 0], [-Math.sin(t), 0, Math.cos(t), 0], [0, 0, 0, 1]];
const rz = t => [[Math.cos(t), -Math.sin(t), 0, 0], [Math.sin(t), Math.cos(t), 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]];
const urdf = q => mul(JOINTS.reduce((T, [p, [r, pi, y]], i) => mul(mul(mul(mul(mul(T, tr(p)), rz(y)), ry(pi)), rx(r)), rz(q[i])), tr([0, 0, 0])), tr(FLANGE));

// Seeded (mulberry32), so the same 50 poses every run.
function rng(seed) {
  return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

test("the lab's IRB 120 chain gives the URDF's flange pose at 50 seeded poses", () => {
  const r = rng(120);
  for (let n = 0; n < 50; n++) {
    const q = IRB120.limits.map(([lo, hi]) => lo + (hi - lo) * r());
    const A = urdf(q), B = irb120(q)[6];
    for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) {
      // 1.5708 is 90° + 3.7e-6 rad: up to ~0.01 mm over the arm's 0.8 m, 1e-5 in a rotation entry.
      assert.ok(Math.abs(A[i][j] - B[i][j]) < (j === 3 ? 0.01 : 1e-4), `q = ${q.map(v => v.toFixed(3))}: T[${i}][${j}] ${A[i][j]} vs ${B[i][j]}`);
    }
  }
});

test("the same seed gives the same poses", () => {
  const a = rng(120), b = rng(120);
  for (let n = 0; n < 300; n++) assert.equal(a(), b());
});

test("the lab's axis ranges (ABB p. 32) match the URDF's limits", () => {
  // The URDF writes ±400° for axis 6 as ±6.98132 rad, the specification's extended range.
  IRB120.limits.forEach(([lo, hi], i) => {
    assert.ok(Math.abs(lo - LIMITS[i][0]) < 1e-5 && Math.abs(hi - LIMITS[i][1]) < 1e-5, `axis ${i + 1}`);
  });
  assert.ok(Math.abs(rad(400) - LIMITS[5][1]) < 1e-5);
});
