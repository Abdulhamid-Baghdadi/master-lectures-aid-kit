// The Python number writer (ui/python.js), shared by the labs' Python panels. Right results by definition: the
// strings numpy reads as these numbers (np.array of nested lists, a column as one-element rows, j for the imaginary
// unit), the numbers written with the MATLAB writer's six figures so the two panels show the same digits.
import { test } from "node:test";
import assert from "node:assert/strict";
import { num, cplx, arr, col, row, list, poleList } from "../ui/python.js";

test("numbers as Python input: the MATLAB writer's digits, j for the imaginary unit", () => {
  assert.equal(num(-0.769230769), "-0.769231");
  assert.equal(cplx([-1, 3]), "-1+3j");
  assert.equal(cplx([-2, 0]), "-2");
  assert.equal(poleList([[-1, 3], [-1, -3]]), "[-1+3j, -1-3j]");
});

test("matrices, columns and rows as numpy arrays, one matrix row per line", () => {
  assert.equal(arr([[1, 0], [0, -1]]), "np.array([[1, 0],\n              [0, -1]])");
  assert.equal(col([1, -1]), "np.array([[1], [-1]])");
  assert.equal(row([1, 0]), "np.array([[1, 0]])");
  assert.equal(list([0.5, 0]), "[0.5, 0]");
});
