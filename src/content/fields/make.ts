import type { Lesson, Question } from "../types";

/**
 * Field reading: short academic texts in the student's chosen field, five
 * questions each. Authoring helper so each text reads as data.
 */

/** [prompt, options, index of the correct option, explanation in Russian] */
export type Q = [string, string[], number, string];

export interface FieldMeta {
  id: string;
  title: string;
  /** For the chip on the path: "Медицина". */
  short: string;
  intro: string;
}

export function makeText(field: FieldMeta, n: number, title: string, passage: string, questions: Q[]): Lesson {
  if (questions.length !== 5) throw new Error(`${field.id}-${n}: expected 5 questions`);
  const text = `**${title}**\n\n${passage.trim()}`;
  return {
    id: `${field.id}-${n}`,
    title,
    summary: "Текст по специальности и 5 вопросов",
    skill: field.short,
    minutes: 8,
    theory: [
      { body: field.intro },
      {
        heading: "Как читать",
        body:
          "• Сначала пробеги текст за 30 секунд: о чём он и как устроен.\n• Потом читай вопросы и возвращайся к нужному месту.\n• Незнакомое слово часто объясняется соседним предложением — не останавливайся на нём.",
      },
    ],
    questions: questions.map(
      ([prompt, options, answer, explanation]): Question => ({
        kind: "choice",
        passages: [{ text }],
        prompt,
        options,
        answer,
        explanation,
      }),
    ),
  };
}

export const TFNG = ["True", "False", "Not Given"];
