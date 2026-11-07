// Explore shows, beside the main law, every equation its drawing plots or its readouts report, so no curve appears
// without its equation. Right result: agreed, from reading each lab's steps and readouts when they were built (7 Nov 2026).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const data = JSON.parse(readFileSync(new URL("../../data/labs.json", import.meta.url), "utf8"));
const app = readFileSync(new URL("../../src/app.js", import.meta.url), "utf8");
const plotted = { models: [1], normalforms: [0, 1, 2], ctrbobsv: [0, 1, 2], placement: [1, 4], observer: [1, 2], combined: [0, 1],
  linearise: [0, 1, 2], circuit: [0], motor: [0], crane: [0, 1], circuits: [0], task0: [0, 1], task1: [0, 1], task2: [0, 1] };

test("Explore renders the equations marked for it", () => {
  assert.match(app, /filter\(e => e\.explore\)/);
});

test("the equations each Explore drawing plots are marked for Explore", () => {
  for (const w of data.labs) {
    const marked = (w.equations ?? []).flatMap((e, i) => e.explore ? [i] : []);
    assert.deepEqual(marked, [...(plotted[w.id] ?? [])].sort((a, b) => a - b), w.id);
  }
});
