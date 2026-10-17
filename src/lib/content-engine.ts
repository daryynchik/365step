import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { randomUUID } from "node:crypto";

import { findByKey, type PathEntry } from "@/content";
import type { ChoiceQuestion, Question } from "@/content/types";
import { aiFeedbackEnabled } from "./ai-feedback";
import { all, json, one, run, scalar, str } from "./db";
import { nowIso, todayIso } from "./date";

/**
 * Fresh practice: new question sets for a lesson's skill.
 *
 * Where the material comes from:
 *   - IELTS Reading: a real passage from Wikipedia (CC BY-SA 4.0, attributed
 *     and linked), with questions written for it in the lesson's format.
 *   - SAT Reading & Writing, SAT Math, IELTS Vocabulary: original questions
 *     generated in the format and skill of the lesson, using the lesson's own
 *     questions as examples.
 *
 * Official College Board and Cambridge/IELTS questions are copyrighted and have
 * no public API, so they are linked, never copied.
 *
 * Every generated question is answered a second time by an independent call
 * that does not see the key; questions where the two disagree are dropped.
 * Sets are stored and shared by all users, so each is generated once.
 */

const MODEL = "claude-opus-5-5";
const SETS_PER_USER_PER_DAY = 6;
const MIN_QUESTIONS = 3;

export interface PracticeSource {
  kind: "generated" | "wikipedia";
  title?: string;
  url?: string;
  license?: string;
}

export interface PracticeSet {
  id: string;
  lessonKey: string;
  title: string;
  questions: Question[];
  source: PracticeSource;
  createdAt: string;
}

export function practiceEnabled(): boolean {
  return aiFeedbackEnabled();
}

export function isGeneratable(entry: PathEntry): boolean {
  const { lesson, course } = entry;
  if (lesson.tutorial || lesson.listening || lesson.speaking || lesson.writing) return false;
  if (lesson.questions.length === 0) return false;
  return course.id === "sat-rw" || course.id === "sat-math" || course.id === "ielts" || course.id === "reading";
}

// ------------------------------------------------------------- wikipedia --

/** Academic topics of the kind IELTS Reading passages are written about. */
const TOPICS = [
  "Urban heat island", "Coral reef", "Printing press", "Honey bee", "Silk Road", "Photosynthesis", "Glacier",
  "Multilingualism", "Desalination", "Vertical farming", "Bioluminescence", "Placebo", "Circadian rhythm",
  "Wind power", "Plate tectonics", "Microplastics", "Domestication", "Antimicrobial resistance", "Rewilding",
  "Bird migration", "Library of Alexandria", "Tea", "Bamboo", "History of coffee", "Salt", "Volcano",
  "Recycling", "Sleep deprivation", "Origami", "Lighthouse",
];

type WikiPassage = { title: string; url: string; text: string };

/** Topics for fresh reading in each field. */
const FIELD_TOPICS: Record<string, string[]> = {
  medicine: ["Immune system", "Vaccine", "Antibiotic", "Insulin", "Neuron", "Circadian rhythm", "Stem cell", "Blood donation", "Malaria", "Penicillin"],
  engineering: ["Suspension bridge", "Reinforced concrete", "Wind turbine", "Hydroelectricity", "Electric motor", "Desalination", "Skyscraper", "Jet engine", "Solar cell", "Robotics"],
  cs: ["Algorithm", "Internet protocol suite", "Public-key cryptography", "Machine learning", "Compiler", "Database", "Computer virus", "Open-source software", "Search engine", "Quantum computing"],
  business: ["Supply and demand", "Inflation", "Comparative advantage", "Microfinance", "Stock market", "Entrepreneurship", "Behavioral economics", "Globalization", "Central bank", "Brand"],
  social: ["Cognitive bias", "Urbanization", "Rule of law", "Silk Road", "Bilingualism", "Democracy", "Memory", "Migration", "Human rights", "Archaeology"],
  science: ["Photosynthesis", "Plate tectonics", "Greenhouse effect", "Catalysis", "Black hole", "Water cycle", "Keystone species", "Speed of light", "Periodic table", "Coral reef"],
};

/** A passage on a random academic topic; tries a few topics, since the API rate-limits bursts. */
export async function wikipediaPassage(attempts = 3, topics: string[] = TOPICS): Promise<WikiPassage | null> {
  const shuffled = [...topics].sort(() => Math.random() - 0.5);
  for (let i = 0; i < attempts; i++) {
    const passage = await fetchPassage(shuffled[i]).catch(() => null);
    if (passage) return passage;
    await new Promise((resolve) => setTimeout(resolve, 800 * (i + 1)));
  }
  return null;
}

async function fetchPassage(topic: string): Promise<WikiPassage | null> {
  const api =
    "https://en.wikipedia.org/w/api.php?action=query&prop=extracts|info&inprop=url&explaintext=1&exsectionformat=plain" +
    `&exlimit=1&redirects=1&format=json&titles=${encodeURIComponent(topic)}`;
  const response = await fetch(api, {
    // Wikimedia asks API clients to identify themselves.
    headers: { "User-Agent": "365step/1.0 (https://github.com/daryynchik/365step; education app)" },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) return null;
  const data = (await response.json()) as { query?: { pages?: Record<string, { title?: string; extract?: string; fullurl?: string }> } };
  const page = Object.values(data.query?.pages ?? {})[0];
  if (!page?.extract) return null;

  // Keep whole paragraphs up to roughly IELTS length, dropping section headings.
  const paragraphs = page.extract
    .split(/\n+/)
    .map((p) => p.trim())
    .filter((p) => p.split(/\s+/).length > 20 && !/(\.\.\.|…)$/.test(p));
  const kept: string[] = [];
  let words = 0;
  for (const p of paragraphs) {
    if (words > 300) break;
    kept.push(p);
    words += p.split(/\s+/).length;
  }
  if (words < 180) return null;
  return { title: page.title ?? topic, url: page.fullurl ?? `https://en.wikipedia.org/wiki/${encodeURIComponent(topic)}`, text: kept.join("\n\n") };
}

// ---------------------------------------------------------------- claude --

const SET_SCHEMA = {
  type: "object",
  properties: {
    questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          passage: { type: "string" },
          prompt: { type: "string" },
          options: { type: "array", items: { type: "string" } },
          answer: { type: "integer" },
          explanation: { type: "string" },
        },
        required: ["passage", "prompt", "options", "answer", "explanation"],
        additionalProperties: false,
      },
    },
  },
  required: ["questions"],
  additionalProperties: false,
};

const ANSWER_SCHEMA = {
  type: "object",
  properties: { answers: { type: "array", items: { type: "integer" } } },
  required: ["answers"],
  additionalProperties: false,
};

interface RawQuestion {
  passage: string;
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
}

async function askJson<T>(client: Anthropic, system: string, prompt: string, schema: Record<string, unknown>): Promise<T | null> {
  const response = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "medium", format: { type: "json_schema", schema } },
    system,
    messages: [{ role: "user", content: prompt }],
  });
  if (response.stop_reason === "refusal" || response.stop_reason === "max_tokens") return null;
  const text = response.content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

function examplesOf(entry: PathEntry): string {
  return JSON.stringify(
    entry.lesson.questions
      .filter((q): q is ChoiceQuestion => q.kind === "choice")
      .slice(0, 2)
      .map((q) => ({ passage: q.passages?.map((p) => (p.label ? `${p.label}: ${p.text}` : p.text)).join("\n\n") ?? "", prompt: q.prompt, options: q.options, answer: q.answer })),
    null,
    1,
  );
}

const GENERATOR_SYSTEM = `You write practice questions for students in Kazakhstan preparing for the digital SAT and IELTS Academic.

Rules:
- Match the format, difficulty and style of the official exam and of the example questions exactly.
- Every question must have exactly one defensible correct answer. Distractors must be clearly wrong on close reading.
- Write passages and questions in English. Write each explanation in Russian, 1–3 sentences, saying why the answer is right and why the most tempting distractor is wrong.
- Never copy questions from College Board, Cambridge, IDP or British Council materials; write original ones.
- Facts in passages you write yourself must be accurate or clearly hypothetical (unnamed researchers, a fictional town).
- "answer" is the 0-based index of the correct option.`;

const SOLVER_SYSTEM = `You are taking a practice test. For each numbered question, choose the single best option.
Return the 0-based index of your choice for every question, in order.`;

function buildRequest(entry: PathEntry, passage: { title: string; text: string } | null): string {
  const lesson = entry.lesson;
  const skill = `${entry.course.title} — ${entry.unit.title} — ${lesson.title}`;
  const base = [
    `Skill: ${skill}`,
    `What the lesson teaches: ${lesson.summary}. ${lesson.theory.map((t) => t.heading).filter(Boolean).join("; ")}`,
    `Example questions in the target format (JSON):\n${examplesOf(entry)}`,
  ];
  if (passage) {
    base.push(
      `Use ONLY this passage (a Wikipedia extract titled "${passage.title}"). Put the full passage text, unchanged, in the "passage" field of every question. Every answer must be decidable from the passage alone.\n\n"""\n${passage.text}\n"""`,
      "Write 5 questions of exactly the type shown in the examples.",
    );
  } else if (entry.course.id === "sat-math") {
    base.push('Write 5 new multiple-choice questions with 4 options each. Leave "passage" empty. Use plain text math (x², √, π, ≤). Double-check every calculation.');
  } else {
    base.push('Write 5 new questions with 4 options each. Each question gets its own short passage in the "passage" field (25–150 words), as on the digital SAT, unless the example format has none.');
  }
  return base.join("\n\n");
}

function validRaw(q: RawQuestion): boolean {
  return (
    typeof q.prompt === "string" &&
    q.prompt.trim().length > 5 &&
    Array.isArray(q.options) &&
    q.options.length >= 3 &&
    q.options.length <= 5 &&
    new Set(q.options).size === q.options.length &&
    Number.isInteger(q.answer) &&
    q.answer >= 0 &&
    q.answer < q.options.length &&
    typeof q.explanation === "string"
  );
}

async function generate(entry: PathEntry): Promise<{ questions: Question[]; source: PracticeSource } | null> {
  const client = new Anthropic();
  const fieldReading = entry.course.id === "reading";
  const wantsPassage = fieldReading || (entry.course.id === "ielts" && entry.unit.id.startsWith("reading"));
  const topics = fieldReading ? FIELD_TOPICS[entry.unit.id] ?? TOPICS : TOPICS;
  const passage = wantsPassage ? await wikipediaPassage(3, topics).catch(() => null) : null;
  if (wantsPassage && !passage) return null;

  const set = await askJson<{ questions: RawQuestion[] }>(client, GENERATOR_SYSTEM, buildRequest(entry, passage), SET_SCHEMA);
  const raw = (set?.questions ?? []).filter(validRaw).slice(0, 6);
  if (raw.length < MIN_QUESTIONS) return null;

  // Independent check: a second call answers without seeing the key.
  const test = raw
    .map((q, i) => `Question ${i + 1}\n${q.passage ? `${q.passage}\n\n` : ""}${q.prompt}\n${q.options.map((o, j) => `${j}) ${o}`).join("\n")}`)
    .join("\n\n---\n\n");
  const solved = await askJson<{ answers: number[] }>(client, SOLVER_SYSTEM, test, ANSWER_SCHEMA);
  const agreed = raw.filter((q, i) => solved?.answers?.[i] === q.answer);
  if (agreed.length < MIN_QUESTIONS) return null;

  const questions: Question[] = agreed.map((q) => ({
    kind: "choice",
    passages: q.passage.trim() ? [{ text: q.passage.trim() }] : undefined,
    prompt: q.prompt.trim(),
    options: q.options.map((o) => o.trim()),
    answer: q.answer,
    explanation: q.explanation.trim(),
  }));

  return {
    questions,
    source: passage
      ? { kind: "wikipedia", title: passage.title, url: passage.url, license: "CC BY-SA 4.0" }
      : { kind: "generated" },
  };
}

// --------------------------------------------------------------- storage --

function toSet(row: Record<string, unknown>): PracticeSet {
  const payload = json<{ title: string; questions: Question[] }>(row.payload, { title: "", questions: [] });
  return {
    id: str(row.id),
    lessonKey: str(row.lesson_key),
    title: payload.title,
    questions: payload.questions,
    source: json<PracticeSource>(row.source, { kind: "generated" }),
    createdAt: str(row.created_at),
  };
}

export async function getPracticeSet(id: string): Promise<PracticeSet | null> {
  const row = await one("SELECT * FROM practice_sets WHERE id = ?", [id]);
  return row ? toSet(row) : null;
}

export type PracticeOutcome = { ok: true; id: string } | { ok: false; error: string };

/**
 * A set for this lesson the user has not done yet: an existing one if there
 * is one, otherwise a freshly generated one.
 */
export async function getOrCreatePractice(userId: string, key: string): Promise<PracticeOutcome> {
  const entry = findByKey(key);
  if (!entry || !isGeneratable(entry)) return { ok: false, error: "Для этого урока свежие задания недоступны." };

  const existing = await all(
    `SELECT id FROM practice_sets
      WHERE lesson_key = ? AND id NOT IN (SELECT set_id FROM practice_results WHERE user_id = ?)
      ORDER BY created_at DESC LIMIT 1`,
    [key, userId],
  );
  if (existing[0]) return { ok: true, id: str(existing[0].id) };

  if (!practiceEnabled()) {
    return { ok: false, error: "Генерация заданий не настроена на этом сервере. Пока можно потренироваться на официальных материалах по ссылке в уроке." };
  }
  const today = await scalar("SELECT COUNT(*) FROM practice_sets WHERE created_by = ? AND day = ?", [userId, todayIso()]);
  if (today >= SETS_PER_USER_PER_DAY) return { ok: false, error: "На сегодня новых наборов хватит — возвращайся завтра." };

  let made: Awaited<ReturnType<typeof generate>> = null;
  try {
    made = await generate(entry);
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) return { ok: false, error: "Сервис перегружен. Попробуй через минуту." };
    if (error instanceof Anthropic.APIError) {
      console.error("365step: practice generation failed", error.status, error.message);
      return { ok: false, error: "Не получилось подготовить задания. Попробуй ещё раз." };
    }
    throw error;
  }
  if (!made) return { ok: false, error: "Не получилось подготовить надёжный набор. Попробуй ещё раз." };

  const id = randomUUID();
  await run(
    "INSERT INTO practice_sets (id, lesson_key, payload, source, created_by, created_at, day) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [
      id,
      key,
      JSON.stringify({ title: entry.lesson.title, questions: made.questions }),
      JSON.stringify(made.source),
      userId,
      nowIso(),
      todayIso(),
    ],
  );
  return { ok: true, id };
}
