// The past exams' calculation tasks (data/labs.json "exams"). The exams have no solution sheet, so every answer is
// worked here and checked two ways: the core recomputes it from the question's data (as labs-data.test.js does for
// the Beispiele), and the designs are checked by definition: eig(A − b rᵀ) and eig(A − ℓcᵀ) are the wanted poles,
// Q_S and Q_B have full rank, the tangent of each nonlinear system is the hand-written A, b, cᵀ, d.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { solve, isRight, tangent, placeByRnf, observeByBnf, closedLoop, poles, ctrb, obsv, rank, matAdd, ss2tf,
  examQuestions } from "../../src/core/index.js";

const data = JSON.parse(readFileSync(new URL("../../data/labs.json", import.meta.url), "utf8"));
const labIds = new Set(data.labs.map(l => l.id));
const close = (a, b, tol = 1e-6) => assert.ok(Math.abs(a - b) < tol, `${a} is not ${b}`);
/** Two pole sets, as [re, im] pairs, are the same up to order. */
const samePoles = (got, want) => {
  const key = p => p.map(z => [Math.round(z[0] * 1e6) / 1e6, Math.round(Math.abs(z[1]) * 1e6) / 1e6 * Math.sign(z[1] || 1)]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  assert.deepEqual(key(got).map(z => z.map(v => v + 0)), key(want).map(z => z.map(v => v + 0)));
};

test("the five exams are listed, by year and group, each with its file", () => {
  assert.deepEqual(data.exams.map(e => e.id), ["ss2014-a", "ss2014-b", "ss2014-wh-a", "ss2017-a", "ss2017-b"]);
  for (const e of data.exams) {
    assert.match(e.file, /^AAU_Pruefung_SS20\d\d_.*\.pdf$/, e.id);
    assert.equal(e.tasks.length, 3, `${e.id}: three Rechenbeispiele`);
  }
});

test("every exam task names its page, links an existing lab and has questions citing file and page", () => {
  for (const e of data.exams) for (const t of e.tasks) {
    assert.ok(Number.isInteger(t.page), `${e.id} RB${t.number}`);
    assert.ok(labIds.has(t.lab), `${e.id} RB${t.number}: lab ${t.lab}`);
    assert.ok(t.questions.length >= 1);
    for (const q of t.questions) {
      assert.ok(q.source.includes(e.file) && q.source.includes(`p. ${t.page}`), q.question);
      assert.ok(q.source.includes("no solution sheet; worked here"), q.question);
    }
  }
});

test("exam questions sit only in the exams, not copied into a lab's practice", () => {
  for (const lab of data.labs) for (const q of lab.practice) assert.doesNotMatch(q.question, /^Exam/, lab.id);
});

test("a lab's practice gains the exam questions linked to it, labelled with exam and task", () => {
  const qs = examQuestions(data.exams, "observer");
  assert.equal(qs.length, 4);
  assert.match(qs[0].question, /^SS2014 WH-Klausur group A, RB3: /);
  assert.deepEqual(examQuestions(data.exams, "task0"), []);
});

for (const e of data.exams) for (const t of e.tasks) for (const q of t.questions) {
  test(`${e.id} RB${t.number}: ${q.question}`, () => {
    const worked = solve(q.compute);
    assert.ok(isRight(worked, q.answer, q.tolerance ?? 0.02), `the core works out ${worked}, labs.json says ${q.answer}`);
  });
}

// By definition: the designs give the wanted poles.
const placements = [
  ["SS2014 GrA RB1", [[0, 1], [3, -4]], [0, 1], [3, -2], [[-3, 1], [-3, -1]], [13, 2]],
  ["SS2014 GrB RB2", [[0, 1], [-2, 3]], [0, 1], [-1, 3], [[-2, 2], [-2, -2]], [6, 7]],
  ["SS2017 GrB RB3", [[-4, 3], [2, -4]], [-2, 3], [5, -5], [[-3, 0], [-4, 0]], [2, -1]],
];
for (const [name, A, b, c, want, rRnf] of placements) {
  test(`${name}: eig(A − b rᵀ) are the wanted poles, rᵀ_RNF as hand-worked`, () => {
    const { r, rRnf: got } = placeByRnf(A, b, c, want);
    got.forEach((v, k) => close(v, rRnf[k]));
    samePoles(poles(closedLoop(A, b, r)), want);
  });
}
const observers = [
  ["SS2014 WH-Klausur GrA RB3", [[0, -3], [1, 6]], [-8, 16], [0, 1], [[-3, 1], [-3, -1]], [7, 12]],
  ["SS2017 GrA RB2", [[-4, 3], [2, -4]], [-2, 3], [-5, 5], [[-1, 2], [-1, -2]], [-5, -6]],
];
for (const [name, A, b, c, want, lBnf] of observers) {
  test(`${name}: eig(A − ℓcᵀ) are the wanted poles, ℓ_BNF as hand-worked`, () => {
    const { l, lBnf: got } = observeByBnf(A, b, c, want);
    got.forEach((v, k) => close(v, lBnf[k]));
    samePoles(poles(matAdd(A, l.map(li => c.map(cj => li * cj)), -1)), want);
  });
}

test("SS2014 GrA RB2 and GrB RB3: Q_S and Q_B have rank 2, so both are controllable and observable", () => {
  for (const [A, b, c] of [[[[-3, 4], [1, -2]], [1, -3], [-2, 1]], [[[2, -8], [-3, 5]], [-3, 1], [1, -2]]]) {
    assert.equal(rank(ctrb(A, b)), 2);
    assert.equal(rank(obsv(A, c)), 2);
  }
});

test("SS2014 WH-Klausur GrA RB2: G(s) = (2s² + 7s − 21)/(s² + 2s − 9), hand-worked", () => {
  const G = ss2tf([[-2, 3], [3, 0]], [3, -1], [1, 0], 2);
  [2, 7, -21].forEach((v, k) => close(G.num[k], v));
  [1, 2, -9].forEach((v, k) => close(G.den[k], v));
});

// The tangents, hand-worked from the exam's equations (the slopes at x0 = 0, u0 = 0).
const tangents = {
  "SS2014 GrB RB1 (C = 1 … 11)": ["exam14b", { C: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] },
    { A: [[-2, -3], [-6 / 5, -7 / 5]], b: [-4, -8 / 5], c: [-9, -10], d: -11 }],
  "SS2017 GrA RB3": ["exam17a", {},
    { A: [[1.3, 1, 0], [-2.1, 0, -3.7], [-1, 0, 0]], b: [-2.2, 0, -0.7], c: [-2.8, 0.3, 0], d: 0 }],
  "SS2017 GrB RB1": ["exam17b", {},
    { A: [[0, 1, 0], [-1.35, -2.1, -2.1], [0, -2.7, -1]], b: [0, 0, 1.2], c: [0, 1.8, 6.7], d: 0 }],
};
for (const [name, [system, params, want]] of Object.entries(tangents)) {
  test(`${name}: the tangent is the hand-worked A, b, cᵀ, d`, () => {
    const got = tangent(system, params);
    want.A.forEach((row, i) => row.forEach((v, j) => close(got.A[i][j], v, 1e-5)));
    want.b.forEach((v, i) => close(got.b[i], v, 1e-5));
    want.c.forEach((v, i) => close(got.c[i], v, 1e-5));
    close(got.d, want.d, 1e-5);
  });
}
