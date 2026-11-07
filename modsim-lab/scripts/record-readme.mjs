// Records the README's animation (the double pendulum's chaos, step 2) and stills with the kit's recorder (../../kit/scripts/record-readme.mjs).
//
//   python -m http.server 8772 --bind 127.0.0.1 --directory .. (in another terminal)
//   node scripts/record-readme.mjs
//
// Writes docs/doppel-light.gif and docs/doppel-dark.gif, docs/light.png (the overview) and docs/dark.png (#zweimasse).
import { fileURLToPath } from "node:url";
import { record } from "../../kit/scripts/record-readme.mjs";

await record({ root: fileURLToPath(new URL("..", import.meta.url)), url: process.env.LAB_URL ?? "http://127.0.0.1:8772/modsim-lab/#doppel",
  gif: "doppel", still: "#zweimasse", step: 1, height: 1900 });
