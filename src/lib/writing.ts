/**
 * Instant feedback on a written draft. Deliberately simple and transparent: it
 * checks what a teacher checks first for each kind of task, and says exactly
 * what it looked for. It does not grade ideas — the rubric and a human reader
 * (or the optional AI feedback) do that.
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
const LINKERS = [
  "however", "moreover", "furthermore", "in addition", "on the other hand", "in contrast", "whereas", "while",
  "therefore", "as a result", "consequently", "for example", "for instance", "in conclusion", "to conclude",
  "although", "despite", "overall", "firstly", "secondly", "finally", "similarly", "nevertheless",
];
const CLICHES = [
  "since i was a child", "ever since i was", "make the world a better place", "make a difference",
  "dream school", "defines", "passion for", "i have always wanted", "from a young age", "comfort zone",
];

function sentences(text: string): string[] {
  return text
    .replace(QUOTE_RE, "quote")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function paragraphs(text: string): string[] {
  return text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
}

function lengthCheck(text: string, task: WritingTask, hardLimit = false): DraftCheck {
  const words = countWords(text);
  const over = words > task.maxWords;
  return {
    id: "length",
    status: words < task.minWords ? "todo" : over ? "warn" : "ok",
    label: `Объём: ${words} из ${task.minWords}–${task.maxWords} слов`,
    hint:
      words < task.minWords
        ? `Добавь ещё ${task.minWords - words}.`
        : over
          ? hardLimit
            ? `Лимит превышен на ${words - task.maxWords} — сократи, иначе текст не поместится в форму.`
            : "Текст длиннее нужного. Убери повторы — за объём баллов не добавляют."
          : "Объём в норме.",
  };
}

function linkerCheck(text: string): DraftCheck {
  const lower = text.toLowerCase();
  const used = LINKERS.filter((l) => new RegExp(`\\b${l}\\b`).test(lower));
  return {
    id: "linkers",
    status: used.length >= 4 ? "ok" : used.length >= 2 ? "warn" : "todo",
    label: `Связки: ${used.length} разных`,
    hint:
      used.length >= 4
        ? `Есть: ${used.slice(0, 5).join(", ")}. Следи, чтобы они стояли там, где действительно нужна логическая связь.`
        : "Добавь разнообразные связки: however, as a result, for example, in contrast.",
  };
}

function paragraphCheck(text: string, min: number): DraftCheck {
  const count = paragraphs(text).length;
  return {
    id: "paragraphs",
    status: count >= min ? "ok" : "todo",
    label: `Абзацы: ${count}`,
    hint: count >= min ? "Структура видна." : `Нужно хотя бы ${min} абзаца — раздели текст пустой строкой.`,
  };
}

function seminarChecks(text: string, task: WritingTask): DraftCheck[] {
  const checks: DraftCheck[] = [];
  const words = countWords(text);
  const needQuotes = task.checks.quotes ?? 0;
  const quotes = text.match(QUOTE_RE)?.length ?? 0;

  if (needQuotes > 0) {
    checks.push({
      id: "quotes",
      status: quotes >= needQuotes ? "ok" : "todo",
      label: `Цитаты: ${quotes} из ${needQuotes}`,
      hint: quotes >= needQuotes ? "Цитаты есть. Проверь, что каждая подведена: кто говорит и когда." : "Возьми точные слова из книги в кавычки “…”.",
    });
    const citations = text.match(CITATION_RE)?.length ?? 0;
    checks.push({
      id: "citations",
      status: quotes === 0 ? "todo" : citations >= Math.min(quotes, needQuotes) ? "ok" : "warn",
      label: "Ссылки на главы",
      hint: citations > 0 ? `Найдено ссылок: ${citations}.` : "После каждой цитаты укажи, откуда она: (Ch. 5) или (Letter 4).",
    });
  }

  const commentary = text.match(COMMENTARY_RE)?.length ?? 0;
  checks.push({
    id: "commentary",
    status: commentary >= Math.max(1, needQuotes) ? "ok" : words < 40 ? "todo" : "warn",
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
    const ok = SOURCE_RE.test(text);
    checks.push({
      id: "source",
      status: ok ? "ok" : "todo",
      label: "Внешний источник",
      hint: ok ? "Источник указан. Проверь: автор, название, год, ссылка." : "Укажи внешний источник: (Author, 2019) в тексте и полную ссылку в конце.",
    });
  }

  if (words >= 40) {
    const first = sentences(text)[0] ?? "";
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
  return checks;
}

function ieltsTask1Checks(text: string): DraftCheck[] {
  const lower = text.toLowerCase();
  const numbers = text.match(/\d[\d,.]*/g)?.length ?? 0;
  const overview = /\b(overall|in general|it is clear that|it can be seen that|generally)\b/.test(lower);
  const opinion = /\b(i think|i believe|in my opinion|i feel)\b/.test(lower);
  return [
    paragraphCheck(text, 3),
    {
      id: "overview",
      status: overview ? "ok" : "todo",
      label: "Overview",
      hint: overview ? "Есть общий обзор тенденций." : "Добавь overview: «Overall, …» — главные тенденции без цифр. Без него редко бывает выше 5.0 за Task Achievement.",
    },
    {
      id: "data",
      status: numbers >= 4 ? "ok" : "todo",
      label: `Данные: ${numbers} чисел`,
      hint: numbers >= 4 ? "Цифры подкрепляют описание." : "Подкрепи сравнения ключевыми цифрами из таблицы.",
    },
    {
      id: "opinion",
      status: opinion ? "warn" : "ok",
      label: "Без личного мнения",
      hint: opinion ? "В Task 1 мнение не нужно — убери «I think» и подобное." : "Мнения нет — так и нужно.",
    },
    linkerCheck(text),
  ];
}

function ieltsTask2Checks(text: string): DraftCheck[] {
  const paras = paragraphs(text);
  const intro = (paras[0] ?? "").toLowerCase();
  const lower = text.toLowerCase();
  const position = /\b(i (believe|think|agree|disagree|would argue)|in my (view|opinion)|this essay (will )?argues?|i am convinced)\b/.test(intro);
  const conclusion = /\b(in conclusion|to conclude|to sum up|overall)\b/.test(lower);
  const contractions = text.match(/\b\w+'(t|re|s|ve|ll|d)\b/gi)?.filter((c) => !/^(it|that|what|there)'s$/i.test(c)).length ?? 0;
  const examples = /\b(for example|for instance|such as)\b/.test(lower);
  return [
    paragraphCheck(text, 4),
    {
      id: "position",
      status: position ? "ok" : "todo",
      label: "Позиция во введении",
      hint: position ? "Позиция заявлена сразу." : "Заяви позицию уже во введении: «I believe that…».",
    },
    linkerCheck(text),
    {
      id: "examples",
      status: examples ? "ok" : "warn",
      label: "Примеры",
      hint: examples ? "Идеи подкреплены примерами." : "Подкрепи хотя бы одну идею примером: «For example, …».",
    },
    {
      id: "conclusion",
      status: conclusion ? "ok" : "todo",
      label: "Заключение",
      hint: conclusion ? "Есть заключение." : "Заверши эссе абзацем «In conclusion, …» с повтором позиции.",
    },
    {
      id: "register",
      status: contractions > 0 ? "warn" : "ok",
      label: "Академический стиль",
      hint: contractions > 0 ? `Сокращений: ${contractions}. В эссе лучше писать полностью: do not, it is.` : "Сокращений нет.",
    },
  ];
}

function statementChecks(text: string): DraftCheck[] {
  const lower = text.toLowerCase();
  const found = CLICHES.filter((c) => lower.includes(c));
  const details = (text.match(/\d/g)?.length ?? 0) + (text.match(/(?<=[a-z,] )[A-Z][a-z]+/g)?.length ?? 0);
  const reflection = /\b(i (learned|learnt|reali[sz]ed|understood|noticed|discovered)|taught me|now i|i now|this experience|changed (how|the way))\b/i.test(text);
  const selfPraise = text.match(/\bi am (a |an |very )?(hardworking|passionate|dedicated|motivated|responsible|creative)\b/gi)?.length ?? 0;
  return [
    {
      id: "details",
      status: details >= 4 ? "ok" : "warn",
      label: "Конкретика",
      hint: details >= 4 ? "Есть детали: имена, места, цифры." : "Добавь конкретики: место, время, имя, число. Детали делают историю твоей.",
    },
    {
      id: "reflection",
      status: reflection ? "ok" : "todo",
      label: "Рефлексия",
      hint: reflection ? "Есть вывод о себе." : "Объясни, что ты понял: «I realised that…», «This taught me…».",
    },
    {
      id: "show",
      status: selfPraise > 0 ? "warn" : "ok",
      label: "Show, don't tell",
      hint: selfPraise > 0 ? "Вместо «I am hardworking» покажи действие, из которого это видно." : "Ты не хвалишь себя напрямую — хорошо.",
    },
    {
      id: "cliches",
      status: found.length > 0 ? "warn" : "ok",
      label: "Клише",
      hint: found.length > 0 ? `Замени: «${found.slice(0, 3).join("», «")}».` : "Клише не найдены.",
    },
  ];
}

function activitiesChecks(text: string): DraftCheck[] {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const tooLong = lines.filter((l) => l.length > 150);
  const withNumbers = lines.filter((l) => /\d/.test(l)).length;
  const verbStart = lines.filter((l) => /^[A-Z][a-z]+ed\b|^(Led|Built|Ran|Won|Taught|Wrote|Made|Began|Grew|Set|Held|Sold|Spoke|Found)\b/.test(l)).length;
  return [
    {
      id: "count",
      status: lines.length >= 3 ? "ok" : "todo",
      label: `Активностей: ${lines.length} из 3`,
      hint: lines.length >= 3 ? "Три активности есть." : "Каждую активность — с новой строки.",
    },
    {
      id: "limit",
      status: lines.length === 0 ? "todo" : tooLong.length === 0 ? "ok" : "warn",
      label: "До 150 знаков в строке",
      hint:
        tooLong.length === 0
          ? `Самая длинная строка: ${Math.max(0, ...lines.map((l) => l.length))} знаков.`
          : `Слишком длинные строки: ${tooLong.map((l) => `${l.length} зн.`).join(", ")}. Common App обрежет их.`,
    },
    {
      id: "verbs",
      status: verbStart >= Math.min(3, lines.length) && lines.length > 0 ? "ok" : "warn",
      label: "Глаголы действия",
      hint: "Начинай с глагола: Founded, Organized, Led, Taught, Built.",
    },
    {
      id: "numbers",
      status: withNumbers >= Math.min(2, lines.length) && lines.length > 0 ? "ok" : "warn",
      label: "Цифры и результат",
      hint: `Строк с цифрами: ${withNumbers}. Масштаб и результат в числах убедительнее слов.`,
    },
  ];
}

function ucasChecks(text: string): DraftCheck[] {
  const chars = text.length;
  const parts = ["Q1:", "Q2:", "Q3:"].filter((q) => text.includes(q)).length;
  const subject = /\b(i (read|studied|explored|researched|built|analysed|analyzed|solved)|this taught me|i realised|i realized)\b/i.test(text);
  return [
    {
      id: "chars",
      status: chars > 4000 ? "warn" : chars < 1500 ? "todo" : "ok",
      label: `Знаков: ${chars} из 4 000`,
      hint: chars > 4000 ? `Сократи на ${chars - 4000} знаков — больше форма UCAS не примет.` : "Лимит UCAS — 4 000 знаков с пробелами на все три ответа.",
    },
    {
      id: "parts",
      status: parts === 3 ? "ok" : "todo",
      label: `Ответы: ${parts} из 3`,
      hint: parts === 3 ? "Все три вопроса UCAS на месте." : "Начни каждый ответ с «Q1:», «Q2:», «Q3:».",
    },
    {
      id: "subject",
      status: subject ? "ok" : "warn",
      label: "Действия и выводы",
      hint: subject ? "Есть примеры того, что ты делал и что понял." : "Покажи, что ты читал, решал, исследовал, — и что из этого понял.",
    },
  ];
}

function planChecks(text: string): DraftCheck[] {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const lower = text.toLowerCase();
  const groups = ["reach", "match", "safety"].filter((g) => lower.includes(g));
  return [
    {
      id: "lines",
      status: lines.length >= 6 ? "ok" : "todo",
      label: `Вузов: ${lines.length} из 6`,
      hint: "Один вуз — одна строка.",
    },
    {
      id: "groups",
      status: groups.length === 3 ? "ok" : "todo",
      label: `Группы: ${groups.length} из 3`,
      hint: groups.length === 3 ? "Есть reach, match и safety." : "Пометь каждый вуз: Reach, Match или Safety.",
    },
  ];
}

export function analyseDraft(text: string, task: WritingTask): DraftCheck[] {
  const profile = task.checks.profile ?? "seminar";
  const checks: DraftCheck[] = [];
  if (profile !== "activities" && profile !== "ucas") checks.push(lengthCheck(text, task, profile === "statement"));

  switch (profile) {
    case "seminar":
      checks.push(...seminarChecks(text, task));
      break;
    case "ielts1":
      checks.push(...ieltsTask1Checks(text));
      break;
    case "ielts2":
      checks.push(...ieltsTask2Checks(text));
      break;
    case "statement":
      checks.push(...statementChecks(text));
      break;
    case "activities":
      checks.push(...activitiesChecks(text));
      break;
    case "ucas":
      checks.push(...ucasChecks(text));
      break;
    case "plan":
      checks.push(...planChecks(text));
      break;
  }

  const long = sentences(text).filter((s) => countWords(s) > 45).length;
  if (long > 0) {
    checks.push({
      id: "long",
      status: "warn",
      label: "Длинные предложения",
      hint: `Предложений длиннее 45 слов: ${long}. Раздели их — так мысль легче проследить.`,
    });
  }
  return checks;
}
