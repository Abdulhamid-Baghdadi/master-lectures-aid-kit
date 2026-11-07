// The past exams' questions on one lab. A lab's data/labs.json keeps each exam task once, under "exams"; a lab's
// Practise tab shows the questions linked to it from there, so no question is copied into the lab's own practice.

/** The questions of every exam task linked to labId, each prefixed with its exam and task ("SS2014 Klausur group A,
 *  RB2: …"); short is what the exam calls a task, written before its number ("RB", "Aufgabe "). */
export function examQuestions(exams, labId, short) {
  return exams.flatMap(e => e.tasks.filter(t => t.lab === labId)
    .flatMap(t => (t.questions ?? []).map(q => ({ ...q, question: `${e.title}, ${short}${t.number}: ${q.question}` }))));
}
