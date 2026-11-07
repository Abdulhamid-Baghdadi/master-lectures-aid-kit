// The exercises' systems as the task sheet gives them (Kubinger 2021a, Beispiel N on PDF page N + 1), and what the
// solution sheets wrote (docs/sources/solution-sheets.md: S1, S2, M with their pages). Two transcriptions, kept apart
// on purpose: the lab compares them and says when they differ.

/** Task sheet: ẋ = A x + B u, v = C x + D u, written as matrices row by row from the printed equations. */
export const SYSTEMS = {
  A: { title: "System A (Beispiel 1)", page: 2, A: [[-2, 3], [3, 10]], B: [[1], [-1]], C: [[1, 0]], D: [[0]] },
  B: { title: "System B (Beispiel 1)", page: 2, A: [[1, -2, 5], [0, 10, -1], [-3, 1, -2]], B: [[-1], [2], [1]], C: [[2, -1, -1]], D: [[0]] },
  C: { title: "System C (Beispiel 1)", page: 2, A: [[2, -2, 1], [0, -3, 3], [1, 1, 1]], B: [[1, 1], [0, 2], [-1, 3]], C: [[1, -1, 1], [2, 3, -4]], D: [[2, -1], [0, 2]] },
  S1: { title: "System 1 (Beispiel 2)", page: 3, A: [[-1, 2], [2, 3]], B: [[3], [-2]], C: [[2, 0]], D: [[0]] },
  S2: { title: "System 2 (Beispiel 2)", page: 3, A: [[2, -3, -4], [0, -2, 5], [-1, 2, -4]], B: [[-2], [3], [-1]], C: [[-1, 2, -3]], D: [[0]] },
  S3: { title: "System 3 (Beispiel 2)", page: 3, A: [[2, 3, 1, -2], [1, -2, 4, 1], [1, -1, 4, -3], [2, -2, -4, 0]], B: [[-2], [3], [0], [1]], C: [[3, -2, 2, 0]], D: [[3]] },
  S4: { title: "System 4 (Beispiel 2) = Beispiel 3", page: 3, A: [[1, -1, 1], [0, -2, 4], [2, -3, 2]], B: [[1, 1], [2, -3], [0, 2]], C: [[2, -2, 3], [1, -3, -2]], D: [[3, -2], [0, 3]] },
};
/** What the solution sheets wrote for the same systems (S1 pp. 1–4). */
export const SHEETS = {
  A: { source: "S1, p. 1", A: [[-2, 3], [3, 10]], B: [[1], [-1]], C: [[1, 0]], D: [[0]] },
  B: { source: "S1, p. 1", A: [[1, -2, 5], [0, 10, -1], [-3, 1, -2]], B: [[-1], [2], [1]], C: [[2, -1, -1]], D: [[0]] },
  C: { source: "S1, p. 1", A: [[2, -2, 1], [0, -3, 3], [1, 1, 1]], B: [[1, 1], [0, 2], [-1, 3]], C: [[1, -1, 1], [2, 3, -4]], D: [[2, -1], [0, 2]] },
  S1: { source: "S1, p. 2", A: [[-1, 2], [2, 3]], B: [[3], [-2]], C: [[2, 0]], D: [[0]] },
  S2: { source: "S1, p. 2", A: [[2, -3, -4], [0, -2, 5], [-1, 2, -4]], B: [[-2], [3], [-1]], C: [[-1, 2, -3]], D: [[0]] },
  S3: { source: "S1, p. 3", A: [[2, 3, 1, -2], [1, -2, 4, 1], [1, -1, 4, -3], [2, -2, -4, 0]], B: [[-2], [3], [0], [1]], C: [[3, -2, 2, 0]], D: [[3]] },
  S4: { source: "S1, pp. 3–4", A: [[1, -1, 1], [0, -2, 4], [2, -3, 2]], B: [[1, 1], [2, -3], [0, 2]], C: [[2, -2, 3], [1, -3, -2]], D: [[3, -2], [0, 3]] },
};

/** A SISO system from the MIMO form. */
export const siso = S => ({ A: S.A, b: S.B.map(r => r[0]), c: S.C[0], d: S.D[0][0] });

/** System A (Beispiele 5–7, 13, 19), System 5 (14, 17), System 6 (12) and the others of part 3 and 4. */
export const SISO = {
  A: { title: "System A", A: [[-2, 3], [3, 10]], b: [1, -1], c: [1, 0], d: 0 },
  S5: { title: "System 5", A: [[-2, 3], [1, 2]], b: [4, -2], c: [2, -1], d: 0 },
  S6: { title: "System 6", A: [[-1, 2], [2, -3]], b: [2, -2], c: [-1, 1], d: 0 },
  B10: { title: "Beispiel 10", A: [[-1, 2], [2, -8]], b: [3, -2], c: [3, 0], d: 0 },
  B11: { title: "Beispiel 11", A: [[0, 4], [-1, 3]], b: [3, -4], c: [3, -4], d: 3 },
  B15: { title: "Beispiele 15 and 16", A: [[0, 1], [4, -8]], b: [0, 1], c: [2, 4], d: 0 },
  B18: { title: "Beispiel 18", A: [[0, -3], [1, 6]], b: [-8, 16], c: [0, 1], d: 0 },
  GrA: { title: "Exam SS2014 GrA, RB2", A: [[-3, 4], [1, -2]], b: [1, -3], c: [-2, 1], d: 2 },
  GrB: { title: "Exam SS2014 GrB, RB3", A: [[2, -8], [-3, 5]], b: [-3, 1], c: [1, -2], d: -1 },
};

/** The lines of ẋ = A x + B u, v = C x + D u as terms, each keyed by the matrix cell it fills ("A0,1"), so a view can
 *  light the term and the cell together. */
export function odeTerms(S) {
  const n = S.A.length, m = S.B[0].length, p = S.C.length;
  const u = j => (m > 1 ? `u${j + 1}` : "u"), v = i => (p > 1 ? `v${i + 1}` : "v");
  const line = (lhs, row, rowB, kA, kB, x = j => `x${j + 1}`) => {
    const parts = [];
    row.forEach((a, j) => a && parts.push([a, x(j), `${kA}${j}`]));
    rowB.forEach((a, j) => a && parts.push([a, u(j), `${kB}${j}`]));
    return [[`${lhs} = `], ...parts.map(([a, name, key], k) => [`${a < 0 ? (k ? " − " : "−") : k ? " + " : ""}${Math.abs(a) === 1 ? "" : Math.abs(a)}${name}`, key])];
  };
  return [...S.A.map((r, i) => line(`ẋ${i + 1}`, r, S.B[i], `A${i},`, `B${i},`)),
          ...S.C.map((r, i) => line(v(i), r, S.D[i], `C${i},`, `D${i},`))];
}
/** The order the cells are filled in: A row by row, then B, C, D, each with its key. */
export const cellOrder = S => ["A", "B", "C", "D"].flatMap(M => S[M].flatMap((r, i) => r.map((_, j) => ({ M, i, j, key: `${M}${i},${j}` }))));
