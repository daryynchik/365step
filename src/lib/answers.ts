/**
 * Answer checking, shared by the lesson player (instant feedback) and the
 * server (which re-grades everything before awarding points). Pure functions,
 * safe to import on the client.
 */

import type { Question } from "@/content/types";

/** A response is an option index for choice questions, typed text for input ones. */
export type Response = number | string;

/** "3,000" / "3 000" / " .50 " -> "3000" / "3000" / ".50"; unicode minus -> "-". */
function normalise(text: string): string {
  return text.trim().toLowerCase().replace(/[\s,]/g, "").replace(/−/g, "-");
}

/** Parses integers, decimals and simple fractions. Returns null for anything else. */
export function parseNumber(text: string): number | null {
  const value = normalise(text);
  if (/^-?\d*\.?\d+$/.test(value)) return Number(value);
  const fraction = value.match(/^(-?\d+)\/(\d+)$/);
  if (fraction && Number(fraction[2]) !== 0) return Number(fraction[1]) / Number(fraction[2]);
  return null;
}

export function isCorrect(question: Question, response: Response | null | undefined): boolean {
  if (response === null || response === undefined) return false;

  if (question.kind === "choice") return response === question.answer;

  if (typeof response !== "string" || !response.trim()) return false;
  const given = normalise(response);
  const givenNumber = parseNumber(response);
  return question.answers.some((accepted) => {
    if (normalise(accepted) === given) return true;
    const acceptedNumber = parseNumber(accepted);
    return acceptedNumber !== null && givenNumber !== null && Math.abs(acceptedNumber - givenNumber) < 1e-9;
  });
}

/** The answer as it should be shown after a wrong attempt. */
export function correctAnswerLabel(question: Question): string {
  if (question.kind === "choice") {
    return `${String.fromCharCode(65 + question.answer)}. ${question.options[question.answer]}`;
  }
  return question.answers[0];
}
