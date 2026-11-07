// Records the README's animation (the crane task) and stills with the kit's recorder (../../kit/scripts/record-readme.mjs).
//
//   python -m http.server 8773 --bind 127.0.0.1 --directory .. (in another terminal)
//   node scripts/record-readme.mjs
//
// Writes docs/crane-light.gif and docs/crane-dark.gif, docs/light.png (the overview) and docs/dark.png (#placement).
import { fileURLToPath } from "node:url";
import { record } from "../../kit/scripts/record-readme.mjs";

await record({ root: fileURLToPath(new URL("..", import.meta.url)), url: process.env.LAB_URL ?? "http://127.0.0.1:8773/automation-lab/#task2",
  gif: "crane", still: "#placement" });
