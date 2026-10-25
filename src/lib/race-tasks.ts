/**
 * Questions for study races. Only objectively checked formats:
 *   SAT    — Math and Reading and Writing from the task bank (multiple choice, grid-in)
 *   IELTS  — Reading from the task bank, Listening from the race set with recorded audio
 * Writing and Speaking are never raced: they cannot be marked automatically.
 *
 * Every task is original 365step material checked by `pnpm validate:content`
 * (one right answer, explanation, topic, difficulty); none is presented as an
 * official exam question.
 */

import { bankTasks, toQuestion } from "@/content/bank/tasks";
import { skillById } from "@/content/bank/taxonomy";
import listeningSet from "@/content/race/ielts-listening.json";
import listeningAudio from "@/content/race/listening-audio.json";
import type { Question } from "@/content/types";
import { parseNumber } from "./answers";
import type { Level, Track } from "./race-rules";

export type RaceSection = "sat-math" | "sat-rw" | "ielts-reading" | "ielts-listening";

export const SECTION_NAMES: Record<RaceSection, string> = {
  "sat-math": "SAT Math",
  "sat-rw": "SAT Reading and Writing",
  "ielts-reading": "IELTS Reading",
  "ielts-listening": "IELTS Listening",
};

export const TRACK_SECTIONS: Record<Track, RaceSection[]> = {
  sat: ["sat-math", "sat-rw"],
  ielts: ["ielts-reading", "ielts-listening"],
};

export interface RaceAudio {
  src: string;
  ms: number;
  /** Times the recording may be played. Same for both students. */
  plays: number;
  context: string;
}

export interface RaceTask {
  id: string;
  track: Track;
  section: RaceSection;
  topic: string;
  difficulty: Level;
  question: Question;
  audio?: RaceAudio;
  /** Answer time, from the moment the student receives the question. */
  timeMs: number;
}

const SECONDS: Record<Exclude<RaceSection, "ielts-listening">, Record<Level, number>> = {
  "sat-math": { easy: 70, medium: 85, hard: 100 },
  "sat-rw": { easy: 60, medium: 75, hard: 90 },
  "ielts-reading": { easy: 120, medium: 135, hard: 150 },
};

export const LISTENING_PLAYS = 2;
/** Time to answer after hearing the recording twice. */
const LISTENING_EXTRA_MS = 25_000;

interface ListeningItem {
  id: string;
  difficulty: Level;
  topic: string;
  context: string;
  lines: { voice: string; text: string }[];
  question: string;
  choices: string[];
  answer: number;
  explanation: string;
}

const LISTENING_TOPICS = listeningSet.topics as Record<string, string>;
const AUDIO = listeningAudio as Record<string, { ms: number }>;

export function listeningItems(): ListeningItem[] {
  return listeningSet.items as ListeningItem[];
}

function fromListening(item: ListeningItem): RaceTask {
  const ms = AUDIO[item.id]?.ms ?? 12_000;
  return {
    id: `ielts-listening.${item.id}`,
    track: "ielts",
    section: "ielts-listening",
    topic: LISTENING_TOPICS[item.topic] ?? item.topic,
    difficulty: item.difficulty,
    question: {
      kind: "choice",
      prompt: item.question,
      options: item.choices,
      answer: item.answer,
      explanation: `${item.explanation}\n\nТранскрипт: ${item.lines.map((l) => l.text).join(" ")}`,
    },
    audio: { src: `/audio/listening/${item.id}.mp3`, ms, plays: LISTENING_PLAYS, context: item.context },
    timeMs: ms * LISTENING_PLAYS + LISTENING_EXTRA_MS,
  };
}

function skillOf(taskId: string): string {
  return taskId.split(".").slice(0, 2).join(".");
}

let built: Map<string, RaceTask> | null = null;

function build(): Map<string, RaceTask> {
  const map = new Map<string, RaceTask>();
  for (const t of bankTasks()) {
    // Multi-root textbook practice is not a single-number SAT race question.
    if (t.source !== "original" || t.answerFormat === "number-set") continue;
    if (t.type !== "mcq" && t.type !== "grid-in" && t.type !== "short-answer") continue;
    const section = t.exam === "sat" ? (t.section === "math" ? "sat-math" : t.section === "rw" ? "sat-rw" : null) : t.section === "reading" ? "ielts-reading" : null;
    if (!section) continue;
    const skill = skillById(skillOf(t.id));
    map.set(t.id, {
      id: t.id,
      track: t.exam,
      section,
      topic: skill?.title ?? t.skill,
      difficulty: t.difficulty,
      question: toQuestion(t),
      timeMs: SECONDS[section][t.difficulty] * 1000,
    });
  }
  for (const item of listeningItems()) {
    const task = fromListening(item);
    map.set(task.id, task);
  }
  return map;
}

export function raceTasks(): Map<string, RaceTask> {
  built ??= build();
  return built;
}

export function raceTask(id: string): RaceTask | undefined {
  return raceTasks().get(id);
}

/** Tasks of one section and level. */
export function raceTasksOf(section: RaceSection, level: Level): RaceTask[] {
  return [...raceTasks().values()].filter((t) => t.section === section && t.difficulty === level);
}

/** What a student sees before answering: no answer, no explanation. */
export interface PublicQuestion {
  kind: "choice" | "input";
  prompt: string;
  options?: string[];
  passages?: Question["passages"];
  table?: Question["table"];
  /** Input questions: a number (SAT grid-in) rather than words. */
  numeric?: boolean;
}

export function publicQuestion(task: RaceTask): PublicQuestion {
  const q = task.question;
  return {
    kind: q.kind,
    prompt: q.prompt,
    options: q.kind === "choice" ? q.options : undefined,
    passages: q.passages,
    table: q.table,
    numeric: q.kind === "input" ? q.answers.every((a) => parseNumber(a) !== null) : undefined,
  };
}
