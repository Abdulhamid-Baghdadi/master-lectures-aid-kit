// The Python beside each view's MATLAB, written to read as close to it as possible: python-control's MATLAB layer
// (from control.matlab import ss, step, place, …), numpy for the matrices (A @ b, np.linalg.inv) and the course's names
// (A, b, cT, d; SYS; rT; Kf; l). Only text: no page, no law. Calls as python-control 0.10.2's reference pages give them
// and as the installed version behaves (both checked 7 Nov 2026; bibliography.json). Where it differs from MATLAB:
// place(A, B, p) makes eig(A − B K) = p as MATLAB's does and also refuses a pole repeated more than rank(B) times;
// acker returns a 1-D array in 0.10.2 (its page says 2-D), so it is made a row with np.atleast_2d; lqr returns K, S, E
// (E the closed-loop poles, MATLAB's P); step and lsim return y, t (and x) in MATLAB's order; stepinfo takes MATLAB's
// names as keywords, SettlingTimeThreshold and RiseTimeLimits; tf2ss gives MATLAB's companion form, −a in the first row.
import { num, arr, col, row, list, poleList } from "../../../kit/ui/python.js";
export { num, arr, col, row, list, poleList };

/** The imports every snippet starts with. */
export const HEAD = ["import numpy as np", "import control as ct",
  "from control.matlab import ss, step, place, acker, lqr, ctrb, obsv, tf, feedback, stepinfo, lsim, tf2ss, pole"].join("\n");
const inv = "np.linalg.inv";

/** The model, as the slides' code starts (slides p. 18). */
export const model = ({ A, b, c, d = 0 }) =>
  `${HEAD}\n\nA = ${arr(A)}\nb = ${col(b)}\ncT = ${row(c)}\nd = ${num(d)}\nSYS = ss(A, b, cT, d)`;
export const modelMimo = ({ A, B, C, D }) => `${HEAD}\n\nA = ${arr(A)}\nB = ${arr(B)}\nC = ${arr(C)}\nD = ${arr(D)}\nSYS = ss(A, B, C, D)`;

/** The course's RNF (and BNF) from num/den: tf2ss, then the states in reverse order. */
export const normalForm = (numr, den, which = "RNF") => [HEAD, "", `num = ${list(numr)}`, `den = ${list(den)}`,
  "SYS1 = tf2ss(num, den)   # companion form: -a in the FIRST row, as MATLAB's tf2ss",
  "A1, B1, C1, D1 = SYS1.A, SYS1.B, SYS1.C, SYS1.D", "n = len(den) - 1; P = np.fliplr(np.eye(n))",
  "ARNF = P @ A1 @ P; bRNF = P @ B1; cTRNF = C1 @ P; dRNF = D1   # course RNF: -a in the last row",
  ...(which === "BNF" ? ["ABNF = ARNF.T; bBNF = cTRNF.T; cTBNF = bRNF.T; dBNF = dRNF   # BNF: the transpose pair"] : []),
  `SYS = ss(A${which}, b${which}, cT${which}, d${which})`, "print(tf(SYS))"].join("\n");

/** Controllability, observability and stability (slides pp. 6–9). */
export const checks = () => ["QS = ctrb(A, b)", "print(np.linalg.det(QS), np.linalg.matrix_rank(QS))",
  "QB = obsv(A, cT)", "print(np.linalg.det(QB), np.linalg.matrix_rank(QB))", "print(pole(SYS))"].join("\n");

const prefilter = ["Ar = A - b @ rT", `Kf = ${inv}(cT @ ${inv}(-A + b @ rT) @ b)`, "SYSrKf = ss(Ar, b @ Kf, cT, d)"];
/** Pole placement with the prefilter (slides p. 18); acker for repeated poles. */
export const placement = poles => {
  const repeated = poles.some((p, i) => poles.some((q, j) => j !== i && Math.hypot(p[0] - q[0], p[1] - q[1]) < 1e-9));
  return [`p = ${poleList(poles)}`,
    repeated ? "rT = np.atleast_2d(acker(A, b, p))   # place refuses a pole repeated more than rank(b) times; acker gives a 1-D array"
      : "rT = place(A, b, p)   # eig(A - b @ rT) = p, as MATLAB's place",
    ...prefilter, "y, t = step(SYSrKf)   # y first, then t, as MATLAB's [y,t]"].join("\n");
};
export const gainLoop = rT => [`rT = ${row(rT)}`, ...prefilter].join("\n");
/** The course's route by hand in RNF coordinates, S carrying rT back (x_RNF = S x). */
export const placementRnf = (a, p) => [`a = np.array(${list(a)})   # det(sE-A) = s^n + ...: a0 first`,
  `pc = np.array(${list(p)})   # wanted polynomial, p0 first`, "rT_RNF = (pc - a).reshape(1, -1)",
  "n = len(a); ARNF = np.vstack([np.hstack([np.zeros((n-1, 1)), np.eye(n-1)]), -a]); bRNF = np.vstack([np.zeros((n-1, 1)), [[1]]])   # RNF, slides p. 8",
  `S = ctrb(ARNF, bRNF) @ ${inv}(ctrb(A, b))   # x_RNF = S @ x`, "rT = rT_RNF @ S"].join("\n");
export const prefilterOnly = `Kf = ${inv}(cT @ ${inv}(-A + b @ rT) @ b)`;

/** The Luenberger observer (slides p. 33): place on the transposed pair, the loop of order 2n. */
export const observer = (poles, n) => [`pB = ${poleList(poles)}`, "l = place(A.T, cT.T, pB).T   # MATLAB: l = place(A',cT',pB)'",
  "Arb = np.block([[A, -b @ rT], [l @ cT, A - l @ cT - b @ rT]])", "brb = np.vstack([b, b])", `cTrb = np.hstack([cT, np.zeros((1, ${n}))])`,
  "SYSrb = ss(Arb, brb @ Kf, cTrb, d)", "y, t = step(SYSrb)"].join("\n");
export const observerBnf = (a, p) => [`a = np.array(${list(a)})`, `pc = np.array(${list(p)})`, "l_BNF = (pc - a).reshape(-1, 1)",
  "n = len(a); ABNF = np.hstack([np.vstack([np.zeros((1, n-1)), np.eye(n-1)]), -a.reshape(-1, 1)]); cTBNF = np.hstack([np.zeros((1, n-1)), [[1]]])   # BNF, slides p. 9",
  `S = ${inv}(obsv(ABNF, cTBNF)) @ obsv(A, cT)   # x_BNF = S @ x`, `l = ${inv}(S) @ l_BNF`].join("\n");

/** stepinfo with the limits a task asks for, as keywords with MATLAB's names; the defaults are (0.1, 0.9) and 0.02. */
export const stepinfoCall = (sys, rise = [0.1, 0.9], settle = 0.02, out = "S") => {
  const args = [];
  if (rise[0] !== 0.1 || rise[1] !== 0.9) args.push(`RiseTimeLimits=(${rise.map(num).join(", ")})`);
  if (settle !== 0.02) args.push(`SettlingTimeThreshold=${num(settle)}`);
  return `${out} = stepinfo(${[sys, ...args].join(", ")})`;
};

/** The poles of a matrix as numbers a check can compare: real parts and |imaginary parts|, each sorted. */
export const PY_POLES = M => `[np.sort(np.linalg.eigvals(${M}).real), np.sort(np.abs(np.linalg.eigvals(${M}).imag))]`;
export const polesKey = pl => [pl.map(p => p[0]).sort((x, y) => x - y), pl.map(p => Math.abs(p[1])).sort((x, y) => x - y)];

/** A MATLAB expression of the labs' own (x(1), K(2), ^, sin) as Python: 0-based indices, **, numpy's functions. */
export const pyExpr = e => e.replace(/\b(x|K)\((\d+)\)/g, (_, v, i) => `${v}[${i - 1}]`).replace(/\^/g, "**")
  .replace(/(?<![\w.])(sin|cos|tan|sqrt|exp)\(/g, "np.$1(").replace(/(?<![\w.])pi\b/g, "np.pi");
/** A MATLAB column "[a; b]" or matrix "[a b; c d]" of expressions as np.array. */
export const pyVec = e => `np.array([${pyExpr(e.slice(1, -1)).split(";").map(s => s.trim()).join(", ")}])`;
export const pyMatStr = e => `np.array([${e.slice(1, -1).split(";").map(r => `[${pyExpr(r.trim()).split(/\s+/).join(", ")}]`).join(", ")}])`;
