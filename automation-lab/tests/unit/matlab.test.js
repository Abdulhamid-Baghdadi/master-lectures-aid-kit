// The MATLAB each view shows (src/labs/matlab.js): for known cases the generated code equals the expected text, written
// out by hand from the slides' code (p. 18 and p. 33) and the MathWorks reference pages (bibliography.json).
import { test } from "node:test";
import assert from "node:assert/strict";
import * as M from "../../src/labs/matlab.js";

const SYSTEM_A = { A: [[-2, 3], [3, 10]], b: [1, -1], c: [1, 0], d: 0 };

test("Beispiel 13 in MATLAB: the model, place, the closed loop and the prefilter as on slides p. 18", () => {
  assert.equal(`${M.model(SYSTEM_A)}\n${M.placement([[-1, 3], [-1, -3]])}`, [
    "A = [-2 3; 3 10];", "b = [1; -1];", "cT = [1 0];", "d = 0;", "SYS = ss(A,b,cT,d);",
    "p = [-1+3j; -1-3j];", "rT = place(A,b,p);   % or acker(A,b,p): the same rT for one input",
    "Ar = A - b*rT;", "Kf = inv(cT*inv(-A+b*rT)*b);", "SYSrKf = ss(Ar,b*Kf,cT,d);", "step(SYSrKf)"].join("\n"));
});

test("a repeated pole uses acker: place refuses a multiplicity above rank(b) (MathWorks, place)", () => {
  assert.match(M.placement([[-2, 0], [-2, 0], [-2, 0]]), /^p = \[-2; -2; -2\];\nrT = acker\(A,b,p\);/);
});

test("lab task 1's stepinfo names both limits; the defaults are left out (MathWorks, stepinfo)", () => {
  assert.equal(M.stepinfoCall("SYSrKf", [0.05, 0.95], 0.01), "S = stepinfo(SYSrKf,'RiseTimeLimits',[0.05 0.95],'SettlingTimeThreshold',0.01)");
  assert.equal(M.stepinfoCall("SYS"), "S = stepinfo(SYS)");
});

test("the observer as on slides p. 33: place on the transposed pair, the loop of order 2n", () => {
  assert.equal(M.observer([[-6, 2], [-6, -2]], 2), ["pB = [-6+2j; -6-2j];", "l = place(A',cT',pB)';",
    "Arb = [A -b*rT; l*cT A-l*cT-b*rT];", "brb = [b; b];", "cTrb = [cT zeros(1,2)];", "SYSrb = ss(Arb,brb*Kf,cTrb,d);", "step(SYSrb)"].join("\n"));
});

test("numbers as MATLAB input: no plus sign, six figures, exponents for the very large and small", () => {
  assert.equal(M.num(-0.769230769), "-0.769231");
  assert.equal(M.num(321e-6), "3.21e-4");
  assert.equal(M.num(205913), "2.05913e5");
  assert.equal(M.cplx([-0.1, -1]), "-0.1-1j");
  assert.equal(M.mat([[0, 1], [29, 8]]), "[0 1; 29 8]");
});

test("the course's RNF from tf2ss: the states reversed, since tf2ss puts −a in the first row (MathWorks, tf2ss)", () => {
  const code = M.normalForm([1, -13], [1, -8, -29], "BNF");
  assert.match(code, /\[A1,B1,C1,D1\] = tf2ss\(num,den\);/);
  assert.match(code, /ARNF = P\*A1\*P; bRNF = P\*B1; cTRNF = C1\*P;/);
  assert.match(code, /ABNF = ARNF\.'; bBNF = cTRNF\.'; cTBNF = bRNF\.';/);
});
