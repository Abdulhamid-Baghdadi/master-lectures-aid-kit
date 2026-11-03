// Explore shows, beside the main law, every equation its drawing plots or its readouts report, so no curve appears
// without its equation. Right result: agreed, from the audit of 3 Nov 2026 that read each lab's drawing and readouts.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const data = JSON.parse(readFileSync(new URL("../../data/labs.json", import.meta.url), "utf8"));
const app = readFileSync(new URL("../../src/app.js", import.meta.url), "utf8");
const plotted = {"springs": [1], "polygon": [1, 2], "bar": [3], "beam": [2, 3, 5], "shapes": [1, 2], "extrapolation": [2], "nonlinear": [1, 0], "modal": [2, 3], "timestep": [2, 4, 5]};

test("Explore renders the equations marked for it", () => {
  assert.match(app, /filter\(e => e\.explore\)/);
});

test("the equations each Explore drawing plots are marked for Explore", () => {
  for (const w of data.labs) {
    const marked = (w.equations ?? []).flatMap((e, i) => e.explore ? [i] : []);
    assert.deepEqual(marked, [...(plotted[w.id] ?? [])].sort((a, b) => a - b), w.id);
  }
});
