import "server-only";

import Anthropic from "@anthropic-ai/sdk";

import type { Speaking, WritingTask } from "@/content/types";

/**
 * Optional feedback from Claude: on written drafts (seminar arguments, IELTS
 * Writing, admissions essays) and on the speaking test.
 *
 * Only runs when ANTHROPIC_API_KEY is set; without it every task still has the
 * instant rule-based checks (lib/writing.ts, lib/speaking.ts). The model is
 * asked to coach, never to rewrite: the student does the writing.
 */

const MODEL = "claude-opus-5-5";

const KIND: Record<string, string> = {
  seminar: "an AP Seminar–style argument about Mary Shelley's Frankenstein",
  ielts1: "an IELTS Academic Writing Task 1 response; judge it on the four IELTS criteria and give one approximate overall band",
  ielts2: "an IELTS Academic Writing Task 2 essay; judge it on the four IELTS criteria and give one approximate overall band",
  statement: "a university admissions essay (Common App or a supplemental essay)",
  activities: "Common App activity descriptions (150 characters each)",
  ucas: "a UCAS personal statement (three questions, 4,000 characters)",
  plan: "a draft list of universities to apply to",
};

const SYSTEM = `You are a writing teacher helping high-school students in Kazakhstan prepare for university abroad.

Give feedback on the student's draft against the task and rubric. Write the feedback in Russian, but quote the student's English exactly when you refer to it.

Rules:
- Coach, do not rewrite. Never produce a corrected version of the text or write new sentences the student could paste in.
- Be specific: point to the exact sentence you mean.
- Judge the substance, not just the presence of features: does the reasoning hold, does the essay show who the student is?
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
    `This is ${KIND[task.checks.profile ?? "seminar"]}.`,
    `Task: ${task.prompt}`,
    ...(task.table ? [`Data (${task.table.caption ?? "table"}):\n${[task.table.head, ...task.table.rows].map((r) => r.join(" | ")).join("\n")}`] : []),
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

// -------------------------------------------------------------- speaking --

function textOf(response: Anthropic.Beta.BetaMessage): string {
  return response.content
    .filter((block): block is Anthropic.Beta.BetaTextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();
}

function dialogue(turns: { role: "examiner" | "student"; text: string }[]): string {
  return turns.map((t) => `${t.role === "examiner" ? "Examiner" : "Candidate"}: ${t.text}`).join("\n");
}

/**
 * One short follow-up question from the examiner, about what the candidate
 * just said. Used when an answer is too brief, as a real examiner would.
 */
export async function examinerFollowUp(spec: Speaking, turns: { role: "examiner" | "student"; text: string }[]): Promise<string | null> {
  if (!aiFeedbackEnabled()) return null;
  const client = new Anthropic();
  try {
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 2000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low" },
      system:
        `You are an IELTS Speaking examiner in Part ${spec.part}. The candidate's last answer was too short. ` +
        "Ask exactly ONE short, natural follow-up question (max 15 words) that invites them to extend that answer — usually asking why, how, or for an example. " +
        "Stay neutral: no praise, no feedback, no corrections. Output only the question.",
      messages: [{ role: "user", content: dialogue(turns.slice(-4)) }],
    });
    if (response.stop_reason === "refusal") return null;
    const text = textOf(response).split("\n")[0].replace(/^["“]|["”]$/g, "").trim();
    return text.length > 3 && text.length < 160 ? text : null;
  } catch (error) {
    if (error instanceof Anthropic.APIError) return null;
    throw error;
  }
}

const ASSESS_SYSTEM = `You are an experienced IELTS Speaking examiner giving feedback on a practice test for a student in Kazakhstan.

You only have a transcript (typed, or produced by speech recognition), so you cannot judge pronunciation; say so in one short line and do not give it a band.

Give, in Russian:
Оценка (ориентировочно):
• Fluency & Coherence — band X.X — one sentence why
• Lexical Resource — band X.X — one sentence why
• Grammatical Range & Accuracy — band X.X — one sentence why
Что улучшить:
• 2–3 concrete points, quoting the candidate's own words and showing a better English phrasing for one of them
Следующий шаг: one concrete exercise.

Be honest and calibrated: short or simple answers rarely deserve more than 5.5. Plain text, no markdown headings.`;

export async function speakingAssessment(
  spec: Speaking,
  turns: { role: "examiner" | "student"; text: string }[],
  mode: "voice" | "text",
): Promise<FeedbackResult> {
  if (!aiFeedbackEnabled()) return { ok: false, error: "ИИ-оценка не настроена на этом сервере." };
  const client = new Anthropic();
  try {
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 4000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low" },
      system: ASSESS_SYSTEM,
      messages: [
        {
          role: "user",
          content: `IELTS Speaking Part ${spec.part}. Mode: ${mode === "voice" ? "spoken, transcribed by speech recognition" : "typed answers"}.\n\n${dialogue(turns)}`,
        },
      ],
    });
    if (response.stop_reason === "refusal") return { ok: false, error: "Не удалось получить оценку. Попробуй ещё раз." };
    const text = textOf(response);
    return text ? { ok: true, text } : { ok: false, error: "Пустой ответ. Попробуй ещё раз." };
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) return { ok: false, error: "Слишком много запросов. Попробуй через минуту." };
    if (error instanceof Anthropic.APIError) return { ok: false, error: "Сервис оценки сейчас недоступен." };
    throw error;
  }
}
