// The code text the stepped views show (src/labs/code.js), for known cases, written out by hand from the MathWorks
// reference pages (setFixedTransform with 'dh' takes [a alpha d theta]; rigidBodyTree('DataFormat','row');
// bibliography.json) and the student's forward_kinematics(spyder).py (the DH matrix written out).
import { test } from "node:test";
import assert from "node:assert/strict";
import { matlabTree, PY_HEAD, pyAngles, pyMat } from "../../src/labs/code.js";

test("a DH row becomes [a alpha d theta] and one body per joint, the first on 'base' (MathWorks, setFixedTransform)", () => {
  assert.equal(matlabTree([{ a: 3, alpha: Math.PI / 2, d: 3, theta: 0 }, { a: 0, alpha: 0, d: 0, theta: 0, type: "prismatic" }]), [
    "dhparams = [3 1.5708 3 0; 0 0 0 0];   % [a alpha d theta], one row per joint", "robot = rigidBodyTree('DataFormat','row');",
    "body1 = rigidBody('body1');", "jnt1 = rigidBodyJoint('jnt1','revolute');",
    "setFixedTransform(jnt1,dhparams(1,:),'dh');   % theta (revolute) or d (prismatic) comes from q", "body1.Joint = jnt1;", "addBody(robot,body1,'base');",
    "body2 = rigidBody('body2');", "jnt2 = rigidBodyJoint('jnt2','prismatic');",
    "setFixedTransform(jnt2,dhparams(2,:),'dh');   % theta (revolute) or d (prismatic) comes from q", "body2.Joint = jnt2;", "addBody(robot,body2,'body1');"].join("\n"));
});

test("the Python head writes the DH matrix as the student's script does, row by row (ch. 3, p. 21)", () => {
  assert.match(PY_HEAD, /return np\.array\(\[\[cos\(theta\), -sin\(theta\)\*cos\(alpha\), sin\(theta\)\*sin\(alpha\), a\*cos\(theta\)\],/);
  assert.match(PY_HEAD, /\[0, sin\(alpha\), cos\(alpha\), d\],\n\s+\[0, 0, 0, 1\]\]\)/);
  assert.equal(pyAngles([["theta1", 20]]), "theta1 = np.deg2rad(20)");
  assert.equal(pyMat([[1, 0], [0, -1]]), "np.array([[1, 0],\n              [0, -1]])");
});
