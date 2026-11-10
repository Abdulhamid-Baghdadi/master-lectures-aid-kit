// The labs; data/labs.json puts them in order under their parts. Adding a lab: write its module, add it here and its
// words to data/labs.json.
import einmasse from "./einmasse.js";
import pendel from "./pendel.js";
import rolle from "./rolle.js";
import zweimasse from "./zweimasse.js";
import doppel from "./doppel.js";
import rlc from "./rlc.js";
import motor from "./motor.js";
import shaker from "./shaker.js";
import { task2, task3 } from "./cart.js";
import { task5, task6, task7 } from "./chain.js";
import { task1, task4, task8, task9, task10, task11, task12, task13 } from "./tasks.js";

export const labs = [einmasse, pendel, rolle, zweimasse, doppel, rlc, motor, shaker, task2, task3, task5, task6, task7,
  task1, task4, task8, task9, task10, task11, task12, task13];
