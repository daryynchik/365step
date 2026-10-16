/**
 * Instant feedback on a speaking test transcript, along the IELTS criteria
 * that can be judged from words alone: fluency and coherence (length, linking),
 * lexical resource (variety) and grammatical range (complex structures).
 * Pronunciation needs a human or a model listening to audio, so it is not
 * scored here — the UI says so.
 *
 * Pure: runs in the browser for both voice (recognised speech) and text mode.
 */

import type { Speaking } from "@/content/types";
import { countWords, type CheckStatus } from "./writing";

export interface SpeakingTurn {
  role: "examiner" | "student";
  text: string;
}

export interface SpeakingCheck {
  id: string;
  criterion: string;
  status: CheckStatus;
  label: string;
  hint: string;
}

const LINKERS = /\b(because|so|but|although|though|however|for example|for instance|actually|as well|also|on the other hand|whereas|while|which|that's why|in addition|first|then|after that|eventually|finally)\b/gi;
const COMPLEX = /\b(although|which|who|whose|if|unless|would|could|might|had (been|\w+ed)|have been|has been|used to|while|whereas|since)\b/gi;
const FILLERS = /\b(um+|uh+|erm|like,|you know)\b/gi;

/** Expected words for answer `i` of this part. Part 2's long turn is the first answer. */
export function targetFor(spec: Speaking, i: number): [number, number] {
  if (spec.part === 2 && i > 0) return [15, 50];
  return spec.targetWords;
}

export function analyseSpeaking(spec: Speaking, answers: string[]): SpeakingCheck[] {
  const all = answers.join(" ");
  const words = all.match(/[\p{L}']+/gu)?.map((w) => w.toLowerCase()) ?? [];
  const unique = new Set(words.filter((w) => w.length > 3));
  const variety = words.length ? unique.size / Math.max(1, words.filter((w) => w.length > 3).length) : 0;

  const short = answers.filter((a, i) => countWords(a) < targetFor(spec, i)[0]).length;
  const linkers = new Set((all.match(LINKERS) ?? []).map((l) => l.toLowerCase()));
  const complex = all.match(COMPLEX)?.length ?? 0;
  const fillers = all.match(FILLERS)?.length ?? 0;
  const reasons = answers.filter((a) => /\b(because|since|that's why|so)\b/i.test(a)).length;

  const checks: SpeakingCheck[] = [
    {
      id: "length",
      criterion: "Fluency & Coherence",
      status: short === 0 ? "ok" : short <= Math.ceil(answers.length / 3) ? "warn" : "todo",
      label: short === 0 ? "Ответы развёрнутые" : `Коротких ответов: ${short} из ${answers.length}`,
      hint:
        spec.part === 2
          ? "В Части 2 говори до двух минут: пройди все пункты карточки и объясни последний."
          : "Схема ответа: ответ → причина → пример. Одно предложение — слишком мало.",
    },
    {
      id: "linking",
      criterion: "Fluency & Coherence",
      status: linkers.size >= 5 ? "ok" : linkers.size >= 3 ? "warn" : "todo",
      label: `Связки: ${linkers.size} разных`,
      hint: linkers.size >= 5 ? `Используешь: ${[...linkers].slice(0, 6).join(", ")}.` : "Связывай мысли: because, although, for example, on the other hand.",
    },
    {
      id: "reasons",
      criterion: "Fluency & Coherence",
      status: reasons >= Math.ceil(answers.length / 2) ? "ok" : "warn",
      label: `Ответов с объяснением: ${reasons} из ${answers.length}`,
      hint: "Экзаменатор хочет слышать, почему ты так думаешь, — добавляй because / that's why.",
    },
    {
      id: "variety",
      criterion: "Lexical Resource",
      status: variety >= 0.7 ? "ok" : variety >= 0.55 ? "warn" : "todo",
      label: `Разнообразие слов: ${Math.round(variety * 100)}%`,
      hint: variety >= 0.7 ? "Слова почти не повторяются." : "Ты часто повторяешь одни и те же слова. Подбирай синонимы и точные сочетания.",
    },
    {
      id: "grammar",
      criterion: "Grammatical Range",
      status: complex >= answers.length ? "ok" : complex >= Math.ceil(answers.length / 2) ? "warn" : "todo",
      label: `Сложные конструкции: ${complex}`,
      hint: "Смешивай простые предложения со сложными: although…, which…, if I had…, I would…, I used to…",
    },
  ];

  if (fillers > 2) {
    checks.push({
      id: "fillers",
      criterion: "Fluency & Coherence",
      status: "warn",
      label: `Слов-паразитов: ${fillers}`,
      hint: "Вместо «um» выиграй время фразой: «That's an interesting question…», «Let me think…».",
    });
  }
  return checks;
}

/** The dialogue as plain text, for saving with the lesson. */
export function transcriptText(turns: SpeakingTurn[]): string {
  return turns.map((t) => `${t.role === "examiner" ? "Examiner" : "Student"}: ${t.text}`).join("\n\n");
}
