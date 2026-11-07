// The past exams as pages: the overview's "Past exams" list and one page per exam with its calculation tasks in order,
// each with the lab that animates its kind. The exams live in a lab's data/labs.json under "exams"; the words that
// differ between courses (what a task is called, what the page says about solutions) come from the lab.
import { h, practice } from "./kit.js";

/** The overview's list of past exams, or null when the lab has none. */
export function examList(exams) {
  if (!exams.length) return null;
  return h("section", { class: "lecture-row exams" },
    h("h2", {}, "Past exams", h("span", { class: "date" }, "calculation tasks")),
    h("ul", { class: "exam-list" }, exams.map(e => h("li", {},
      h("a", { href: `#exam-${e.id}` }, e.title), e.minutes ? ` · ${e.date}, ${e.minutes} min` : ` · ${e.date}`))));
}

/** One exam's page. task names a task ("Rechenbeispiel", "Aufgabe"); note says what the page rests on, unless the
 *  exam brings its own; labTitle names a linked lab; parse reads the answers. A task with no lab says why in its note. */
export function examPanel(e, { task, note, labTitle, parse }) {
  return h("section", { class: "panel", "aria-labelledby": `title-exam-${e.id}` },
    h("a", { href: "#", class: "back" }, "← All labs"),
    h("header", { class: "tab-head" }, h("p", { class: "eyebrow" }, `Past exam · ${e.date}${e.minutes ? ` · ${e.minutes} min` : ""}`),
      h("h2", { id: `title-exam-${e.id}`, tabindex: "-1" }, e.title)),
    h("p", { class: "source" }, `${e.note ?? note} Source: ${e.file}.`),
    e.tasks.map(t => h("section", { class: "exam-task" },
      h("h3", {}, `${task} ${t.number} (${t.where ?? `p. ${t.page}`})`),
      h("p", {}, t.task),
      t.lab ? h("p", { class: "source" }, t.repeats ? `Repeats ${t.repeats}: ` : "Same kind as: ",
        h("a", { href: `#${t.lab}` }, labTitle(t.lab))) : null,
      t.note ? h("p", { class: "source" }, t.note) : null,
      t.questions?.length ? h("div", { class: "practice-list" }, t.questions.map(q => practice({ ...q, parse }))) : null)));
}
