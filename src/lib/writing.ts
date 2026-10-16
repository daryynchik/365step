/**
 * Instant feedback on a seminar draft. Deliberately simple and transparent:
 * it checks the things a teacher checks first (length, quotations, citations,
 * commentary, a counterargument) and says exactly what it looked for. It does
 * not grade ideas — that is what the rubric and a human reader are for.
 *
 * Pure, so it runs on every keystroke in the browser.
 */

import type { WritingTask } from "@/content/types";

export function countWords(text: string): number {
  const words = text.trim().match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu);
  return words ? words.length : 0;
}

export type CheckStatus = "ok" | "todo" | "warn";

export interface DraftCheck {
  id: string;
  status: CheckStatus;
  label: string;
  hint: string;
}

const QUOTE_RE = /[“"«]([^”"»]{8,})[”"»]/g;
const CITATION_RE = /\((?:ch\.?|chapter|letter|глава|письмо)\s*\d+[^)]*\)/gi;
const COMMENTARY_RE =
  /\b(this (shows|suggests|reveals|implies|means|demonstrates|highlights|emphasi[sz]es)|which (shows|suggests|reveals|means)|because|therefore|thus|as a result|in other words|the word)\b/gi;
const COUNTER_RE =
  /\b(however|although|though|admittedly|some (readers|critics|people|might|may|would) |on the other hand|it is true that|while it is true|one could argue|critics argue)\b/gi;
const SOURCE_RE = /(https?:\/\/\S+|\([A-ZА-Я][\p{L}-]+(?: (?:and|&|et al\.)[^)]*)?,? \d{4}\)|\b(19|20)\d{2}\b.*\b(journal|report|article|university|press)\b)/iu;

function sentences(text: string): string[] {
  return text
    .replace(QUOTE_RE, "quote")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function analyseDraft(text: string, task: WritingTask): DraftCheck[] {
  const checks: DraftCheck[] = [];
  const words = countWords(text);

  checks.push({
    id: "length",
    status: words < task.minWords ? "todo" : words > task.maxWords ? "warn" : "ok",
    label: `Объём: ${words} из ${task.minWords}–${task.maxWords} слов`,
    hint:
      words < task.minWords
        ? `Добавь ещё ${task.minWords - words} — скорее всего, в разборе цитат.`
        : words > task.maxWords
          ? "Работа длиннее нужного. Убери предложения, которые повторяют уже сказанное."
          : "Объём в норме.",
  });

  const quotes = text.match(QUOTE_RE)?.length ?? 0;
  if (task.checks.quotes > 0) {
    checks.push({
      id: "quotes",
      status: quotes >= task.checks.quotes ? "ok" : "todo",
      label: `Цитаты: ${quotes} из ${task.checks.quotes}`,
      hint:
        quotes >= task.checks.quotes
          ? "Цитаты есть. Проверь, что каждая подведена: кто говорит и когда."
          : "Возьми точные слова из книги в кавычки “…”.",
    });

    const citations = text.match(CITATION_RE)?.length ?? 0;
    checks.push({
      id: "citations",
      status: quotes === 0 ? "todo" : citations >= Math.min(quotes, task.checks.quotes) ? "ok" : "warn",
      label: "Ссылки на главы",
      hint:
        citations > 0
          ? `Найдено ссылок: ${citations}.`
          : "После каждой цитаты укажи, откуда она: (Ch. 5) или (Letter 4).",
    });
  }

  const commentary = text.match(COMMENTARY_RE)?.length ?? 0;
  checks.push({
    id: "commentary",
    status: commentary >= Math.max(1, task.checks.quotes) ? "ok" : words < 40 ? "todo" : "warn",
    label: "Разбор, а не пересказ",
    hint:
      commentary > 0
        ? "Есть слова-связки разбора (this shows, because…). Проверь, что после каждой цитаты объяснено, что она доказывает."
        : "Объясни цитаты: «This suggests that…», «The word “…” shows…».",
  });

  if (task.checks.counterargument) {
    const counter = text.match(COUNTER_RE)?.length ?? 0;
    checks.push({
      id: "counter",
      status: counter > 0 ? "ok" : "todo",
      label: "Контраргумент",
      hint: counter > 0 ? "Возражение есть — убедись, что ты на него ответил." : "Добавь: «Some readers argue that… However, …».",
    });
  }

  if (task.checks.outsideSource) {
    checks.push({
      id: "source",
      status: SOURCE_RE.test(text) ? "ok" : "todo",
      label: "Внешний источник",
      hint: SOURCE_RE.test(text)
        ? "Источник указан. Проверь: автор, название, год, ссылка."
        : "Укажи внешний источник: (Author, 2019) в тексте и полную ссылку в конце.",
    });
  }

  const first = sentences(text)[0] ?? "";
  if (words >= 40) {
    const startsWithQuote = /^[“"«]/.test(text.trim());
    checks.push({
      id: "claim",
      status: startsWithQuote || countWords(first) < 8 ? "warn" : "ok",
      label: "Начало с утверждения",
      hint: startsWithQuote
        ? "Не начинай с цитаты. Первое предложение — твоя мысль."
        : countWords(first) < 8
          ? "Первое предложение очень короткое. Сформулируй в нём утверждение целиком."
          : "Первое предложение похоже на утверждение. Можно ли с ним поспорить?",
    });
  }

  const long = sentences(text).filter((s) => countWords(s) > 45).length;
  if (long > 0) {
    checks.push({
      id: "long",
      status: "warn",
      label: "Длинные предложения",
      hint: `Предложений длиннее 45 слов: ${long}. Раздели их — так рассуждение легче проследить.`,
    });
  }

  return checks;
}
