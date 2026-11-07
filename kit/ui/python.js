// Numbers, vectors and matrices written as Python (numpy) input, for the Python panel beside the MATLAB one (added on
// 7 Nov 2026 for the Robotics, Advanced Automation and ModSim labs). The digits are the MATLAB writer's, so the two
// panels show the same numbers. Only text: no page, no law.
import { num } from "./matlab.js";
export { num };

/** A complex number as Python writes it: -1+3j (the same form as MATLAB's). */
export const cplx = ([re, im]) => Math.abs(im) < 1e-12 ? num(re) : `${num(re)}${im < 0 ? "-" : "+"}${num(Math.abs(im))}j`;
/** A matrix as np.array, one row per line. */
export const arr = M => `np.array([${M.map(r => `[${r.map(num).join(", ")}]`).join(",\n              ")}])`;
/** A column (n × 1) and a row (1 × n): 2-D, so A @ b and b @ rT keep MATLAB's shapes. */
export const col = v => `np.array([${v.map(x => `[${num(x)}]`).join(", ")}])`;
export const row = v => `np.array([[${v.map(num).join(", ")}]])`;
export const list = v => `[${v.map(num).join(", ")}]`;
export const poleList = p => `[${p.map(cplx).join(", ")}]`;
