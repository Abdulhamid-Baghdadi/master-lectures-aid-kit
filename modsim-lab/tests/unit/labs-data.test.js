// Every practice answer in data/labs.json (the source's value, or the lab's worked one, its source named beside it)
// agrees with the answer the core works out from the question's data. A typo in the data or a wrong law fails here.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { solve, isRight } from "../../src/core/index.js";
import { typeset } from "../../../kit/ui/math.js";

const data = JSON.parse(readFileSync(new URL("../../data/labs.json", import.meta.url), "utf8"));

test("labs.json names its format and version", () => {
  assert.equal(data.format, "modsim-lab labs");
  assert.equal(data.version, 1);
});

test("every lab sits under exactly one part, and every part's labs exist", () => {
  const listed = data.lectures.flatMap(l => l.labs);
  assert.deepEqual([...listed].sort(), data.labs.map(l => l.id).sort());
  assert.equal(new Set(listed).size, listed.length);
  const families = new Set(data.families.map(f => f.id));
  for (const l of data.lectures) {
    assert.ok(l.number && l.pages && l.title && l.labs.length, `part ${l.number} is complete`);
    assert.ok(families.has(l.family), `part ${l.number}'s family ${l.family} is listed in families`);
  }
});

// Right result by definition (brief of 11 Nov 2026): every symbol list entry has tex and meaning and typesets, every
// equation with letters has a list, and the main law has one (its own, or the list of the equation it repeats).
test("every equation's symbol list has tex and meaning, and each symbol typesets (VO and task sheet, 11 Nov 2026)", () => {
  for (const w of data.labs) {
    const lists = [w.lawWhere, ...(w.equations ?? []).map(e => e.where)].filter(Boolean);
    for (const list of lists) for (const s of list) {
      assert.ok(s.tex && s.means, `${w.id}: a where entry lacks tex or means`);
      assert.ok(!typeset(s.tex).error, `${w.id}: ${s.tex} does not typeset`);
    }
    for (const e of w.equations ?? []) if (e.tex && /[A-Za-z]/.test(e.tex.replace(/\\[A-Za-z]+/g, ""))) assert.ok(e.where?.length, `${w.id}: ${e.tex} has no symbol list`);
    if (w.lawTex) assert.ok(w.lawWhere ?? (w.equations ?? []).find(e => e.tex === w.lawTex)?.where, `${w.id}: the main law has no symbol list`);
  }
});

test("every lab has practice questions", () => {
  for (const lab of data.labs) assert.ok(lab.practice.length >= 1, lab.id);
});

for (const lab of data.labs) {
  for (const q of lab.practice) {
    test(`${lab.id}: ${q.question}`, () => {
      assert.ok(q.source, "every question names its source");
      const worked = solve(q.compute);
      assert.ok(isRight(worked, q.answer, q.tolerance ?? 0.02), `the core works out ${worked}, labs.json says ${q.answer}`);
    });
  }
}
