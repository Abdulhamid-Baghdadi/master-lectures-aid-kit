// Numbers, vectors and matrices written as MATLAB input, for the labs that show the MATLAB of a view (moved here from
// the Advanced Automation lab on 7 Nov 2026, when the ModSim lab wanted them too). Only text: no page, no law.

/** A number as MATLAB input: up to 6 significant figures, no trailing zeros, no "+" sign. */
export const num = v => {
  if (Math.abs(v) < 1e-12) return "0";
  const t = Number(v.toPrecision(6));
  return Math.abs(t) >= 1e5 || Math.abs(t) < 1e-3 ? t.toExponential().replace("e+", "e") : String(t);
};
/** A complex number as MATLAB writes it: -1+3j. */
export const cplx = ([re, im]) => Math.abs(im) < 1e-12 ? num(re) : `${num(re)}${im < 0 ? "-" : "+"}${num(Math.abs(im))}j`;
/** [1; -1] for a column, [1 0] for a row. */
export const vec = (v, column = true) => `[${v.map(num).join(column ? "; " : " ")}]`;
export const mat = M => `[${M.map(r => r.map(num).join(" ")).join("; ")}]`;
export const poleVec = p => `[${p.map(cplx).join("; ")}]`;
