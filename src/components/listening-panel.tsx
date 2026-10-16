"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Headphones, Pause, Play, RotateCcw } from "lucide-react";
import { clsx } from "clsx";

import type { Listening } from "@/content/types";
import { ModeSwitch } from "./mode-switch";

export type ListenMode = "audio" | "text";
export const LISTEN_MODES = ["audio", "text"] as const;

/**
 * The recording for a listening task.
 *
 * Audio mode reads the script aloud with the browser's speech synthesis —
 * a distinct voice (or pitch) per speaker, no audio files to host. Text mode
 * shows the script as a transcript. The questions are identical in both, so a
 * student who cannot listen loses nothing but the listening itself.
 */
export function ListeningPanel({
  listening,
  mode,
  onModeChange,
}: {
  listening: Listening;
  mode: ListenMode;
  onModeChange: (mode: ListenMode) => void;
}) {
  const [supported, setSupported] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [line, setLine] = useState(0);
  const [finished, setFinished] = useState(false);
  const [rate, setRate] = useState(1);
  const voices = useRef<SpeechSynthesisVoice[]>([]);
  const cancelled = useRef(false);

  const speakers = [...new Set(listening.lines.map((l) => l.speaker))];

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setSupported(false);
      onModeChange("text");
      return;
    }
    const load = () => {
      const all = window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith("en"));
      // British voices first: IELTS recordings are mostly British English.
      voices.current = [...all.filter((v) => /en-gb/i.test(v.lang)), ...all.filter((v) => !/en-gb/i.test(v.lang))];
    };
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", load);
      window.speechSynthesis.cancel();
    };
  }, [onModeChange]);

  // Leaving audio mode stops the recording.
  useEffect(() => {
    if (mode === "text" && typeof window !== "undefined" && "speechSynthesis" in window) {
      cancelled.current = true;
      window.speechSynthesis.cancel();
      setPlaying(false);
    }
  }, [mode]);

  const playFrom = useCallback(
    (start: number) => {
      const synth = window.speechSynthesis;
      synth.cancel();
      cancelled.current = false;
      setFinished(false);
      setPlaying(true);

      const speakLine = (i: number) => {
        if (cancelled.current) return;
        if (i >= listening.lines.length) {
          setPlaying(false);
          setFinished(true);
          setLine(0);
          return;
        }
        setLine(i);
        const { speaker, text } = listening.lines[i];
        const index = speakers.indexOf(speaker);
        const utterance = new SpeechSynthesisUtterance(text);
        const voice = voices.current[index % Math.max(1, voices.current.length)];
        if (voice) utterance.voice = voice;
        utterance.lang = voice?.lang ?? "en-GB";
        utterance.rate = rate;
        // With only one voice installed, a different pitch still tells speakers apart.
        utterance.pitch = voices.current.length > 1 ? 1 : index % 2 === 0 ? 1 : 1.25;
        utterance.onend = () => speakLine(i + 1);
        utterance.onerror = (e) => {
          if (e.error !== "interrupted" && e.error !== "canceled") {
            setPlaying(false);
            setSupported(false);
            onModeChange("text");
          }
        };
        synth.speak(utterance);
      };
      speakLine(start);
    },
    [listening.lines, speakers, rate, onModeChange],
  );

  const pause = () => {
    cancelled.current = true;
    window.speechSynthesis.cancel();
    setPlaying(false);
  };

  return (
    <section className="mb-6 overflow-hidden rounded-xl border border-ielts/25 bg-surface">
      <div className="flex items-start gap-3 border-b border-line px-5 py-4">
        <span className="grid size-9 flex-none place-items-center rounded-lg bg-ielts-soft text-ielts">
          <Headphones className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="font-semibold">{listening.title}</p>
          <p className="text-sm text-muted">{listening.context}</p>
        </div>
      </div>

      {mode === "audio" ? (
        <div className="px-5 py-4">
          <div className="flex flex-wrap items-center gap-3">
            {playing ? (
              <button type="button" onClick={pause} className="grid size-12 place-items-center rounded-full bg-ielts text-white shadow-[0_3px_0_#8f3029]" aria-label="Пауза">
                <Pause className="size-5" fill="currentColor" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => playFrom(finished ? 0 : line)}
                className="grid size-12 place-items-center rounded-full bg-ielts text-white shadow-[0_3px_0_#8f3029]"
                aria-label={finished ? "Слушать снова" : "Слушать"}
              >
                {finished ? <RotateCcw className="size-5" /> : <Play className="size-5 translate-x-0.5" fill="currentColor" />}
              </button>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex gap-1" aria-hidden>
                {listening.lines.map((_, i) => (
                  <span
                    key={i}
                    className={clsx(
                      "h-1.5 flex-1 rounded-full",
                      finished || i < line ? "bg-ielts" : i === line && playing ? "animate-pulse bg-ielts/60" : "bg-sunken",
                    )}
                  />
                ))}
              </div>
              <p className="mt-1.5 text-xs text-muted">
                {finished
                  ? "Запись закончилась — отвечай на вопросы."
                  : playing
                    ? `Фрагмент ${line + 1} из ${listening.lines.length} · ${listening.lines[line].speaker}`
                    : line > 0
                      ? "Пауза"
                      : "Нажми, чтобы начать. Вопросы можно читать во время записи."}
              </p>
            </div>
            <label className="flex items-center gap-1.5 text-xs text-muted">
              Скорость
              <select
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                className="rounded-md border border-line bg-surface px-1.5 py-1 text-xs text-ink"
              >
                <option value={0.85}>0.85×</option>
                <option value={1}>1×</option>
                <option value={1.15}>1.15×</option>
              </select>
            </label>
          </div>
          <p className="mt-3 text-xs text-subtle">На экзамене запись звучит один раз. Здесь можно переслушать, но сначала попробуй ответить с первого раза.</p>
        </div>
      ) : (
        <div className="px-5 py-4">
          {!supported && (
            <p className="mb-3 rounded-lg bg-warn-soft px-3 py-2 text-xs text-warn">
              Этот браузер не умеет воспроизводить речь — включена текстовая транскрипция.
            </p>
          )}
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Транскрипт</p>
          <div className="max-h-80 space-y-2.5 overflow-y-auto pr-1">
            {listening.lines.map((l, i) => (
              <p key={i} className="passage text-[16px]">
                <span className="mr-1.5 font-sans text-xs font-bold uppercase tracking-wide text-ielts">{l.speaker}</span>
                {l.text}
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-line bg-bg/60 px-3 py-3">
        <ModeSwitch
          label="Режим аудирования"
          value={mode}
          onChange={onModeChange}
          options={[
            { value: "audio", icon: "🎧", label: "Слушать аудио" },
            { value: "text", icon: "🔇", label: "Не могу слушать" },
          ]}
        />
        {mode === "text" && supported && (
          <p className="mt-2 text-center text-xs text-muted">Читаешь транскрипт и отвечаешь на те же вопросы — разбор тот же.</p>
        )}
      </div>
    </section>
  );
}
