"use client";

import { useMemo, useState, useTransition } from "react";
import { CalendarDays, Check, Loader2 } from "lucide-react";
import { clsx } from "clsx";

import { saveGoalAction } from "@/actions/profile";
import { FIELD_OPTIONS, type FieldId } from "@/content/fields/ids";
import { applicationDeadline, COUNTRIES, daysBetween, type CountryId } from "@/content/goal";
import { plural } from "@/lib/date";
import { Button, ErrorNote } from "./ui";

const MONTHS = ["январь", "февраль", "март", "апрель", "май", "июнь", "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"];
const GRADES = [8, 9, 10, 11, 12];

/** Kazakhstani schools finish after grade 11, in late May. */
function suggestGraduation(grade: number, today: Date): string {
  const schoolYearEnd = today.getUTCMonth() >= 5 ? today.getUTCFullYear() + 1 : today.getUTCFullYear();
  const year = schoolYearEnd + Math.max(0, 11 - Math.min(grade, 11));
  return `${year}-05`;
}

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

export interface GoalDefaults {
  country: CountryId;
  field: FieldId;
  grade: number;
  graduationMonth: string;
}

export function GoalForm({ defaults, editing }: { defaults: GoalDefaults | null; editing: boolean }) {
  const today = useMemo(() => new Date(), []);
  const [country, setCountry] = useState<CountryId | null>(defaults?.country ?? null);
  const [field, setField] = useState<FieldId | null>(defaults?.field ?? null);
  const [grade, setGrade] = useState<number>(defaults?.grade ?? 11);
  const [graduation, setGraduation] = useState<string>(defaults?.graduationMonth ?? suggestGraduation(11, today));
  const [touchedDate, setTouchedDate] = useState(Boolean(defaults));
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const [gradYear, gradMonth] = graduation.split("-").map(Number);
  const years = Array.from({ length: 6 }, (_, i) => today.getUTCFullYear() + i);
  const todayIso = today.toISOString().slice(0, 10);
  const graduationIso = `${graduation}-01`;
  const days = daysBetween(todayIso, graduationIso);
  const deadline = country ? applicationDeadline({ country, graduation: graduationIso }) : null;
  const toDeadline = deadline ? daysBetween(todayIso, deadline) : null;
  const countryInfo = COUNTRIES.find((c) => c.id === country);

  const chooseGrade = (g: number) => {
    setGrade(g);
    if (!touchedDate) setGraduation(suggestGraduation(g, today));
  };

  const submit = () => {
    setError(null);
    if (!country || !field) {
      setError("Выбери страну и направление.");
      return;
    }
    start(async () => {
      const res = await saveGoalAction({ country, field, grade, graduationMonth: graduation });
      if (res && !res.ok) setError(res.error);
    });
  };

  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-lg font-semibold">1. Куда хочешь поступать?</h2>
        <p className="text-sm text-muted">От страны зависят сроки подачи и то, какие эссе нужны.</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {COUNTRIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCountry(c.id)}
              aria-pressed={country === c.id}
              className={clsx(
                "flex items-center justify-between rounded-xl border-[1.5px] border-b-[3px] px-4 py-3 text-left font-semibold transition-colors",
                country === c.id ? "border-accent bg-accent-soft" : "border-line-strong bg-surface hover:bg-sunken",
              )}
            >
              {c.title}
              {country === c.id && <Check className="size-4 text-accent" strokeWidth={3} />}
            </button>
          ))}
        </div>
        {countryInfo && <p className="mt-2 text-xs text-muted">{countryInfo.deadlineNote}</p>}
      </section>

      <section>
        <h2 className="text-lg font-semibold">2. Какое направление?</h2>
        <p className="text-sm text-muted">По нему ты будешь регулярно читать короткие тексты и отвечать на 5 вопросов к каждому.</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {FIELD_OPTIONS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setField(f.id)}
              aria-pressed={field === f.id}
              className={clsx(
                "rounded-xl border-[1.5px] border-b-[3px] px-4 py-3 text-left transition-colors",
                field === f.id ? "border-accent bg-accent-soft" : "border-line-strong bg-surface hover:bg-sunken",
              )}
            >
              <span className="flex items-center justify-between font-semibold">
                {f.title}
                {field === f.id && <Check className="size-4 text-accent" strokeWidth={3} />}
              </span>
              <span className="block text-xs text-muted">{f.hint}</span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold">3. В каком ты классе?</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {GRADES.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => chooseGrade(g)}
              aria-pressed={grade === g}
              className={clsx(
                "tabular h-12 w-14 rounded-xl border-[1.5px] border-b-[3px] text-lg font-bold transition-colors",
                grade === g ? "border-accent bg-accent-soft text-accent" : "border-line-strong bg-surface hover:bg-sunken",
              )}
            >
              {g}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold">4. Когда заканчиваешь школу?</h2>
        <p className="text-sm text-muted">До этой даты мы построим весь твой путь — сколько бы времени ни оставалось.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <select
            aria-label="Месяц"
            value={gradMonth}
            onChange={(e) => {
              setTouchedDate(true);
              setGraduation(`${gradYear}-${String(e.target.value).padStart(2, "0")}`);
            }}
            className="h-11 rounded-xl border border-line-strong bg-surface px-3 text-[15px]"
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
          <select
            aria-label="Год"
            value={gradYear}
            onChange={(e) => {
              setTouchedDate(true);
              setGraduation(`${e.target.value}-${String(gradMonth).padStart(2, "0")}`);
            }}
            className="h-11 rounded-xl border border-line-strong bg-surface px-3 text-[15px]"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="card flex gap-4 p-5">
        <CalendarDays className="mt-0.5 size-6 flex-none text-accent" />
        <div className="text-sm">
          {days < 21 ? (
            <p className="text-danger">До этой даты меньше трёх недель — выбери дату позже.</p>
          ) : (
            <>
              <p className="font-semibold">
                Твой путь: {days} {plural(days, "день", "дня", "дней")} до выпуска
              </p>
              {deadline && toDeadline !== null && (
                <p className="mt-1 text-muted">
                  {toDeadline >= 14
                    ? `Подготовка к экзаменам и эссе — до ${formatDate(deadline)} (ориентировочный основной дедлайн), дальше — чтение по специальности и повторение.`
                    : "Обычный дедлайн для этого года уже близко или прошёл — план построим до выпуска, с расчётом на поздний приём или следующий год."}
                </p>
              )}
              <p className="mt-1 text-muted">
                {days < 120
                  ? "Срок короткий — уроков в день будет больше."
                  : days > 400
                    ? "Времени много — уроки распределятся спокойно, с регулярным повторением."
                    : "Каждый день — 2–3 коротких урока."}
              </p>
            </>
          )}
        </div>
      </section>

      {error && <ErrorNote>{error}</ErrorNote>}

      <Button size="lg" onClick={submit} disabled={pending || !country || !field || days < 21} className="w-full sm:w-auto">
        {pending && <Loader2 className="size-4 animate-spin" />}
        {editing ? "Сохранить и перестроить план" : "Построить мой путь"}
      </Button>
      {editing && <p className="text-xs text-muted">Пройденные уроки останутся пройденными — изменится только расписание.</p>}
    </div>
  );
}
