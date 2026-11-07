// The past exams' calculation tasks (data/labs.json "exams"). Only the 2015 exam has a solution sheet (photos of its
// Musterlösung); the rest is worked here. Every answer is recomputed by the core from the question's data, and the
// motion laws are checked by definition: the 5th-order polynomial meets its boundary values.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { solve, isRight, quintic, polynomial, characteristic, examQuestions } from "../../src/core/index.js";

const data = JSON.parse(readFileSync(new URL("../../data/labs.json", import.meta.url), "utf8"));
const labIds = new Set(data.labs.map(l => l.id));
const close = (a, b, tol = 1e-3) => assert.ok(Math.abs(a - b) < tol, `${a} is not ${b}`);

test("the four exams are listed by year, each with its file", () => {
  assert.deepEqual(data.exams.map(e => e.id), ["iha-2015", "iha-2016", "iha-2017", "iha-2018"]);
  for (const e of data.exams) assert.ok(e.file && e.tasks.length >= 4, e.id);
});

test("every exam task says where it is; a linked lab exists; a task with no lab says why", () => {
  for (const e of data.exams) for (const t of e.tasks) {
    assert.ok(t.where, `${e.id} Aufgabe ${t.number}`);
    if (t.lab) assert.ok(labIds.has(t.lab), `${e.id} Aufgabe ${t.number}: lab ${t.lab}`);
    else assert.ok(t.note && !t.questions?.length, `${e.id} Aufgabe ${t.number}`);
  }
});

test("every question cites the exam's file and the task's place, and says whether a solution sheet exists", () => {
  for (const e of data.exams) for (const t of e.tasks) for (const q of t.questions ?? []) {
    assert.ok(q.source.includes(e.file) && q.source.includes(t.where), q.question);
    assert.match(q.source, e.id === "iha-2015" ? /Musterlösung/ : /no solution sheet; worked here/, q.question);
  }
});

test("a lab's practice gains the exam questions linked to it, labelled with exam and task", () => {
  const qs = examQuestions(data.exams, "deadcentre", "Aufgabe ");
  assert.equal(qs.length, 4);
  assert.ok(qs[0].question.startsWith(`${data.exams[0].title}, Aufgabe 2: `), qs[0].question);
  assert.equal(data.exams[0].title, "IHA exam 2015");
  assert.deepEqual(examQuestions(data.exams, "cam", "Aufgabe "), []);
});

for (const e of data.exams) for (const t of e.tasks) for (const q of t.questions ?? []) {
  test(`${e.id} Aufgabe ${t.number}: ${q.question}`, () => {
    const worked = solve(q.compute);
    assert.ok(isRight(worked, q.answer, q.tolerance ?? 0.02), `the core works out ${worked}, labs.json says ${q.answer}`);
  });
}

// Hand-worked: rest at P3, then the straight line G (slope −30°/60°) at P4. Normed over Δφ = 90°, Δψ = −30°:
// f′(1) = (−0.5)·90/(−30) = 1.5, so a3 + a4 + a5 = 1, 3a3 + 4a4 + 5a5 = 1.5, 6a3 + 12a4 + 20a5 = 0.
test("2016 Aufgabe 4 (= 2017 Aufgabe 4, 2018 Aufgabe 5): f = 4z³ − 4.5z⁴ + 1.5z⁵ meets its boundary values", () => {
  const c = quintic({ f1: 1, v1: 1.5 });
  [0, 0, 0, 4, -4.5, 1.5].forEach((v, k) => close(c[k], v, 1e-12));
  const f = polynomial(c);
  close(f.f(0), 0); close(f.v(0), 0); close(f.a(0), 0); close(f.f(1), 1); close(f.v(1), 1.5); close(f.a(1), 0);
  // f″ = 6z(5z − 4)(z − 1) is zero at z = 0.8, where f′ = 1.536 > f′(1) = 1.5; f‴ = 0 at z = (9 − √21)/15.
  const C = characteristic(f), z = (9 - Math.sqrt(21)) / 15;
  close(C.Cv.value, 1.536); close(C.Cv.z, 0.8);
  close(C.Ca.value, 30 * z ** 3 - 54 * z ** 2 + 24 * z);
});

test("2015 Aufgabe 4: the rest-to-rest law's Cv is 1.875 at z = 0.5, as the Musterlösung prints", () => {
  const C = characteristic(polynomial(quintic({ f1: 1 })));
  close(C.Cv.value, 1.875); close(C.Cv.z, 0.5);
});
