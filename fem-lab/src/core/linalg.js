// Small dense linear algebra for the labs' models of a few dozen unknowns: the solve of [K]{u} = {f} and the
// eigenvalues of a symmetric matrix. Dense on purpose: the models here are tiny and the code should read like the
// lecture's matrices, not like a sparse solver.

/** A matrix of n rows and m columns filled with zeros. */
export const zeros = (n, m = n) => Array.from({ length: n }, () => new Array(m).fill(0));

/** {x} with [A]{x} = {b}, by Gaussian elimination with partial pivoting; a singular [A] (a model that can move as a
 *  rigid body) is an error, as a solver reports it. */
export function solve(A, b) {
  const n = b.length, M = A.map((row, i) => [...row, b[i]]);
  const scale = Math.max(...A.flat().map(Math.abs)) || 1;
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    if (Math.abs(M[p][c]) <= 1e-12 * scale) throw new Error("The stiffness matrix is singular: the model is not held against rigid-body motion. Add a support.");
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = c + 1; r < n; r++) {
      const f = M[r][c] / M[c][c];
      for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
    }
  }
  const x = new Array(n).fill(0);
  for (let r = n - 1; r >= 0; r--) {
    let s = M[r][n];
    for (let k = r + 1; k < n; k++) s -= M[r][k] * x[k];
    x[r] = s / M[r][r];
  }
  return x;
}

/** [A]{x}. */
export const mulVec = (A, x) => A.map(row => row.reduce((s, a, k) => s + a * x[k], 0));

/** Eigenvalues (ascending) and eigenvectors (columns, unit length) of a symmetric matrix, by Jacobi rotations: slow
 *  for big matrices, exact enough and short for the handful of degrees of freedom here. */
export function eigSym(A) {
  const n = A.length, a = A.map(r => [...r]), V = zeros(n);
  for (let i = 0; i < n; i++) V[i][i] = 1;
  for (let sweep = 0; sweep < 100; sweep++) {
    let off = 0;
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) off += a[i][j] ** 2;
    if (off < 1e-22 * (1 + a.reduce((s, r, i) => s + r[i] ** 2, 0))) break;
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) {
      if (a[p][q] === 0) continue;
      const theta = (a[q][q] - a[p][p]) / (2 * a[p][q]);
      const t = Math.sign(theta || 1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
      const c = 1 / Math.sqrt(t * t + 1), s = t * c;
      for (let k = 0; k < n; k++) {
        const akp = a[k][p], akq = a[k][q];
        a[k][p] = c * akp - s * akq; a[k][q] = s * akp + c * akq;
      }
      for (let k = 0; k < n; k++) {
        const apk = a[p][k], aqk = a[q][k];
        a[p][k] = c * apk - s * aqk; a[q][k] = s * apk + c * aqk;
      }
      for (let k = 0; k < n; k++) {
        const vkp = V[k][p], vkq = V[k][q];
        V[k][p] = c * vkp - s * vkq; V[k][q] = s * vkp + c * vkq;
      }
    }
  }
  const order = a.map((r, i) => i).sort((i, j) => a[i][i] - a[j][j]);
  return { values: order.map(i => a[i][i]), vectors: order.map(i => V.map(r => r[i])) };
}
