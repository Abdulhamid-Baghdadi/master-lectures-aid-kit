// The MATLAB a student would type for a view, written from the view's current values in the course's names (A, b,
// cT, d; SYS = ss(A,b,cT,d); rT; Kf; l) and in the style of the student's own lab scripts. Only text: no page, no law.
// Argument orders as the MathWorks reference pages give them (read 7 Nov 2026; see bibliography.json):
// place(A,B,p) makes eig(A − B·K) = p and the observer is place(A',C',p)'; lqr(A,B,Q,R) returns K with u = −Kx;
// tf2ss puts −a in the FIRST row, the course's RNF has it in the last; stepinfo's defaults are a 10–90 % rise time
// and a 2 % settling band; feedback(G,1) closes a unity negative loop; pidtune(sys,'PI',opts) tunes a PI.

// The number, vector and matrix writers are the kit's, shared with the ModSim lab.
import { num, cplx, vec, mat, poleVec } from "../../../kit/ui/matlab.js";
export { num, cplx, vec, mat, poleVec };

/** The model, as the slides' code starts (slides p. 18). */
export const model = ({ A, b, c, d = 0 }) =>
  `A = ${mat(A)};\nb = ${vec(b)};\ncT = ${vec(c, false)};\nd = ${num(d)};\nSYS = ss(A,b,cT,d);`;
/** A MIMO model: B, C and D as matrices. */
export const modelMimo = ({ A, B, C, D }) =>
  `A = ${mat(A)};\nB = ${mat(B)};\nC = ${mat(C)};\nD = ${mat(D)};\nSYS = ss(A,B,C,D);`;

/** The course's RNF from num/den: tf2ss, then the order of the states reversed (P = fliplr(eye(n))), so −a moves to
 *  the last row and b to [0 … 0 1]ᵀ. The BNF is its transpose pair. */
export const normalForm = (numr, den, which = "RNF") => [
  `num = ${vec(numr, false)};`, `den = ${vec(den, false)};`,
  "[A1,B1,C1,D1] = tf2ss(num,den);   % companion form: -a in the FIRST row",
  "n = numel(den)-1; P = fliplr(eye(n));",
  "ARNF = P*A1*P; bRNF = P*B1; cTRNF = C1*P; dRNF = D1;   % course RNF: -a in the last row",
  ...(which === "BNF" ? ["ABNF = ARNF.'; bBNF = cTRNF.'; cTBNF = bRNF.'; dBNF = dRNF;   % BNF: the transpose pair"] : []),
  `SYS = ss(A${which},b${which},cT${which},d${which});`, "tf(SYS)"].join("\n");

/** The tests of controllability, observability and stability (slides pp. 6–9). */
export const checks = () => ["QS = ctrb(A,b)", "det(QS)", "rank(QS)", "QB = obsv(A,cT)", "det(QB)", "rank(QB)", "pole(SYS)"].join("\n");

/** Pole placement with the prefilter, as on slides p. 18. acker for repeated poles: place refuses a pole repeated
 *  more often than rank(b) = 1. */
export const placement = poles => {
  const repeated = poles.some((p, i) => poles.some((q, j) => j !== i && Math.hypot(p[0] - q[0], p[1] - q[1]) < 1e-9));
  return [`p = ${poleVec(poles)};`,
    repeated ? "rT = acker(A,b,p);   % place(A,b,p) refuses a pole repeated more than rank(b) times" : "rT = place(A,b,p);   % or acker(A,b,p): the same rT for one input",
    "Ar = A - b*rT;", "Kf = inv(cT*inv(-A+b*rT)*b);", "SYSrKf = ss(Ar,b*Kf,cT,d);", "step(SYSrKf)"].join("\n");
};
/** The course's route by hand in RNF coordinates, with S to carry rT back (x_RNF = S·x). */
export const placementRnf = (a, p) => [
  `a = ${vec(a, false)};   % det(sE-A) = s^n + ... : a0 first`,
  `pc = ${vec(p, false)};   % wanted polynomial, p0 first`,
  "rT_RNF = pc - a;",
  "n = numel(a); ARNF = [zeros(n-1,1) eye(n-1); -a]; bRNF = [zeros(n-1,1); 1];   % RNF, slides p. 8",
  "S = ctrb(ARNF,bRNF)*inv(ctrb(A,b));   % x_RNF = S*x",
  "rT = rT_RNF*S;"].join("\n");

/** The Luenberger observer (slides p. 33): the gain by place on the transposed pair, the loop of order 2n. */
export const observer = (poles, n) => [`pB = ${poleVec(poles)};`, "l = place(A',cT',pB)';",
  "Arb = [A -b*rT; l*cT A-l*cT-b*rT];", "brb = [b; b];", `cTrb = [cT zeros(1,${n})];`,
  "SYSrb = ss(Arb,brb*Kf,cTrb,d);", "step(SYSrb)"].join("\n");
export const observerBnf = (a, p) => [
  `a = ${vec(a, false)};`, `pc = ${vec(p, false)};`, "l_BNF = (pc - a).';",
  "n = numel(a); ABNF = [[zeros(1,n-1); eye(n-1)] -a.']; cTBNF = [zeros(1,n-1) 1];   % BNF, slides p. 9",
  "S = inv(obsv(ABNF,cTBNF))*obsv(A,cT);   % x_BNF = S*x", "l = inv(S)*l_BNF;"].join("\n");

/** stepinfo with the limits a task asks for; MATLAB's defaults are [0.1 0.9] and 0.02. */
export const stepinfoCall = (sys, rise = [0.1, 0.9], settle = 0.02) => {
  const args = [];
  if (rise[0] !== 0.1 || rise[1] !== 0.9) args.push(`'RiseTimeLimits',${vec(rise, false)}`);
  if (settle !== 0.02) args.push(`'SettlingTimeThreshold',${num(settle)}`);
  return `S = stepinfo(${[sys, ...args].join(",")})`;
};

/** The LQ controller (slides p. 15): rT = lqr(A,b,Q,R). */
export const lq = (Q, R) => [`Q = ${mat(Q)};`, `R = ${num(R)};`, "rT = lqr(A,b,Q,R);"].join("\n");
