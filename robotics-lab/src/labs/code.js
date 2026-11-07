// The code a student would type for a stepped view, written from the view's current values: Python with numpy in the
// style of the student's own forward_kinematics(spyder).py (a DH matrix written out, the joints named m0_1, m1_2, …,
// multiplied in order), and MATLAB with the Robotics System Toolbox or plain matrices. Only text: no page, no law.
// MATLAB calls as the MathWorks reference pages give them (read 7 Nov 2026; bibliography.json): setFixedTransform(jnt,
// [a alpha d theta],'dh') ignores theta for a revolute joint and d for a prismatic one, so those come from the joint
// position; rigidBodyTree('DataFormat','row') takes a row of joint positions; getTransform(robot,q,body) gives the
// body's frame in the base; geometricJacobian lists the angular speeds in rows 1–3, the linear in rows 4–6;
// inverseKinematics weighs orientation in the first three weights, position in the last three.
// The kit's step player shows both panels: a view returns code (MATLAB), python and pyCheck.
import { num, mat } from "../../../kit/ui/matlab.js";
import { arr } from "../../../kit/ui/python.js";
export { num, mat };

/** A number as Python input (the same digits as the MATLAB writer). */
export const py = num;
export const pyMat = arr;

/** The head of every Python snippet: numpy and the DH matrix, as the student's script writes it (ch. 3, p. 21). */
export const PY_HEAD = ["import numpy as np", "from numpy import cos, sin, pi", "",
  "def dh(theta, alpha, a, d):   # one DH step, ch. 3, p. 21",
  "    return np.array([[cos(theta), -sin(theta)*cos(alpha), sin(theta)*sin(alpha), a*cos(theta)],",
  "                     [sin(theta), cos(theta)*cos(alpha), -cos(theta)*sin(alpha), a*sin(theta)],",
  "                     [0, sin(alpha), cos(alpha), d],",
  "                     [0, 0, 0, 1]])", ""].join("\n");

/** "theta1 = np.deg2rad(20)" lines from [[name, degrees]]. */
export const pyAngles = list => list.map(([n, d]) => `${n} = np.deg2rad(${num(d)})`).join("\n");

/** A rigidBodyTree from DH rows [{ a, alpha, d, theta, type }] (alpha, theta in rad), one body per row, unrolled so
 *  each line can be read on its own. */
export function matlabTree(rows) {
  const lines = [`dhparams = [${rows.map(r => [r.a, r.alpha, r.d, r.theta].map(num).join(" ")).join("; ")}];   % [a alpha d theta], one row per joint`,
    "robot = rigidBodyTree('DataFormat','row');"];
  rows.forEach((r, i) => {
    const k = i + 1;
    lines.push(`body${k} = rigidBody('body${k}');`, `jnt${k} = rigidBodyJoint('jnt${k}','${r.type ?? "revolute"}');`,
      `setFixedTransform(jnt${k},dhparams(${k},:),'dh');   % theta (revolute) or d (prismatic) comes from q`,
      `body${k}.Joint = jnt${k};`, `addBody(robot,body${k},'${i ? `body${i}` : "base"}');`);
  });
  return lines.join("\n");
}
