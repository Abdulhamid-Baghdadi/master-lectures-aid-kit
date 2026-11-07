// Records the README's animations of the four stepped exercise labs (dhsteps, irbsteps, jacsteps, iksteps), step 1 of
// each, with the kit's recorder (../../kit/scripts/record-readme.mjs).
//
//   python -m http.server 8781 --bind 127.0.0.1 (in the repository's root, in another terminal)
//   node scripts/record-steps.mjs
//
// Writes docs/<lab>-light.gif and docs/<lab>-dark.gif, and again the stills docs/light.png (the overview) and
// docs/dark.png (#ik), as scripts/record-readme.mjs does.
import { fileURLToPath } from "node:url";
import { record } from "../../kit/scripts/record-readme.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const base = process.env.LAB_URL ?? "http://127.0.0.1:8781/robotics-lab/";
for (const gif of ["dhsteps", "irbsteps", "jacsteps", "iksteps"]) await record({ root, url: `${base}#${gif}`, gif, still: "#ik" });
