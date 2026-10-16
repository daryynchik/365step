import "server-only";

import Anthropic from "@anthropic-ai/sdk";

import type { WritingTask } from "@/content/types";

/**
 * Optional teacher-style feedback on a seminar draft from Claude.
 *
 * Only runs when ANTHROPIC_API_KEY is set; without it the seminar still has the
 * instant rule-based checklist (lib/writing.ts). The model is asked to coach,
 * never to rewrite: the point of the course is that the student does the writing.
 */

const MODEL = "claude-opus-5-5";

const SYSTEM = `You are a writing teacher for an AP Seminar–style course in which high-school students in Kazakhstan read Mary Shelley's Frankenstein and write short arguments in English.

Give feedback on the student's draft against the task and rubric. Write the feedback in Russian, but quote the student's English exactly when you refer to it.

Rules:
- Coach, do not rewrite. Never produce a corrected version of the paragraph or write new sentences the student could paste in.
- Be specific: point to the exact sentence or quotation you mean.
- Judge the reasoning, not just the presence of features: does the commentary explain how the evidence supports the claim?
- Keep it short and kind but honest.

Format (plain text, no markdown headings):
Сильные стороны:
• …(1–2 points)
Что улучшить:
• …(2–3 points, most important first)
Следующий шаг: one concrete action for the next revision.`;

export function aiFeedbackEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export type FeedbackResult = { ok: true; text: string } | { ok: false; error: string };

export async function writingFeedback(task: WritingTask, draft: string): Promise<FeedbackResult> {
  if (!aiFeedbackEnabled()) return { ok: false, error: "ИИ-отзыв не настроен на этом сервере." };

  const client = new Anthropic();
  const prompt = [
    `Task: ${task.prompt}`,
    `Length: ${task.minWords}–${task.maxWords} words.`,
    `Rubric:\n${task.rubric.map((r) => `- ${r}`).join("\n")}`,
    `Student draft:\n"""\n${draft}\n"""`,
  ].join("\n\n");

  try {
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 4000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low" },
      system: SYSTEM,
      messages: [{ role: "user", content: prompt }],
    });

    if (response.stop_reason === "refusal") {
      return { ok: false, error: "Не удалось получить отзыв на этот текст. Попробуй изменить черновик." };
    }
    const text = response.content
      .filter((block): block is Anthropic.Beta.BetaTextBlock => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();
    return text ? { ok: true, text } : { ok: false, error: "Пустой ответ. Попробуй ещё раз." };
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) return { ok: false, error: "Слишком много запросов. Попробуй через минуту." };
    if (error instanceof Anthropic.APIError) {
      console.error("365step: writing feedback failed", error.status, error.message);
      return { ok: false, error: "Сервис отзывов сейчас недоступен." };
    }
    throw error;
  }
}
