// Explore shows, beside the main law, every equation its drawing plots or its readouts report, so no curve appears
// without its equation. Right result: agreed, from reading each lab's steps and charts when they were built (7 Nov 2026).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const data = JSON.parse(readFileSync(new URL("../../data/labs.json", import.meta.url), "utf8"));
const app = readFileSync(new URL("../../src/app.js", import.meta.url), "utf8");
const plotted = { einmasse: [0], pendel: [1, 2], rolle: [3, 4], zweimasse: [0, 2, 3, 4], doppel: [0, 1, 2, 4], rlc: [0, 2],
  motor: [0, 1, 2], shaker: [1, 2], task2: [0, 2], task3: [0, 1], task5: [0, 1, 2], task6: [0, 1, 2], task7: [0, 1, 2],
  task1: [0, 1], task4: [0, 1], task8: [0, 1], task9: [0, 1], task10: [0, 1], task11: [0, 1], task12: [0, 1], task13: [0, 1] };

test("Explore renders the equations marked for it", () => {
  assert.match(app, /filter\(e => e\.explore\)/);
});

test("the equations each Explore drawing plots are marked for Explore", () => {
  for (const w of data.labs) {
    const marked = (w.equations ?? []).flatMap((e, i) => e.explore ? [i] : []);
    assert.deepEqual(marked, [...(plotted[w.id] ?? [])].sort((a, b) => a - b), w.id);
  }
});
