import Link from "next/link";
import { ArrowUpRight, ChevronRight } from "lucide-react";

import { weekdayShort, todayIso } from "@/lib/date";
import type { Standing } from "@/lib/friends";
import { DAILY_GOAL } from "@/lib/rules";
import { Avatar, Flame } from "./ui";

/** The daily goal ring, the week of activity under it, and the streak. */
export function DailyGoalCard({
  earnedToday,
  streak,
  activeToday,
  week,
}: {
  earnedToday: number;
  streak: number;
  activeToday: boolean;
  week: { day: string; points: number }[];
}) {
  const progress = Math.min(1, earnedToday / DAILY_GOAL);
  const r = 26;
  const c = 2 * Math.PI * r;
  const today = todayIso();

  return (
    <section className="card p-5">
      <div className="flex items-center gap-4">
        <svg viewBox="0 0 64 64" className="size-16 flex-none -rotate-90" aria-hidden>
          <circle cx="32" cy="32" r={r} fill="none" stroke="var(--sunken)" strokeWidth="7" />
          <circle
            cx="32"
            cy="32"
            r={r}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - progress)}
            className="transition-[stroke-dashoffset] duration-700"
          />
        </svg>
        <div>
          <h2 className="text-[15px] font-semibold">Цель на сегодня</h2>
          <p className="tabular text-sm text-muted">
            {progress >= 1 ? "Выполнена — отличная работа" : `${earnedToday} из ${DAILY_GOAL} очков`}
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-7 gap-1 text-center">
        {week.map(({ day, points }) => (
          <div key={day} className="flex flex-col items-center gap-1.5">
            <span className={`text-[11px] ${day === today ? "font-semibold text-ink" : "text-subtle"}`}>{weekdayShort(day)}</span>
            <span
              className={`grid size-7 place-items-center rounded-full text-[10px] font-semibold ${
                points >= DAILY_GOAL ? "bg-accent text-white" : points > 0 ? "bg-accent-soft text-accent" : "bg-sunken text-subtle"
              } ${day === today ? "ring-2 ring-line-strong ring-offset-2 ring-offset-surface" : ""}`}
              title={`${points} очков`}
            >
              {points > 0 ? points : ""}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center gap-3 rounded-lg bg-sunken px-3 py-2.5">
        <Flame className="size-6 flex-none" active={activeToday} />
        <p className="text-sm">
          <span className="tabular font-semibold">{streak}</span>{" "}
          <span className="text-muted">
            {streak === 0 ? "— начни серию с одного урока" : activeToday ? "дней подряд" : "дней подряд — пройди урок сегодня"}
          </span>
        </p>
      </div>
    </section>
  );
}

export function FriendsMini({ standings }: { standings: Standing[] }) {
  const top = standings.slice(0, 4);
  return (
    <section className="card p-5">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-[15px] font-semibold">Друзья за неделю</h2>
        <Link href="/friends" className="flex items-center text-xs font-medium text-muted hover:text-ink">
          Таблица <ChevronRight className="size-3.5" />
        </Link>
      </div>
      {standings.length <= 1 ? (
        <p className="text-sm text-muted">
          Добавь друзей — здесь появится рейтинг.{" "}
          <Link href="/friends" className="font-medium text-accent hover:underline">
            Добавить
          </Link>
        </p>
      ) : (
        <ol className="space-y-2">
          {top.map((s, i) => (
            <li key={s.id} className={`flex items-center gap-3 rounded-lg px-2 py-1.5 ${s.isMe ? "bg-accent-soft" : ""}`}>
              <span className="tabular w-4 text-sm font-semibold text-subtle">{i + 1}</span>
              <Avatar name={s.name} size={26} />
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{s.isMe ? "Ты" : s.name}</span>
              <span className="tabular text-sm text-muted">{s.earnedWeek}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

const OFFICIAL = [
  {
    title: "Пробные тесты в Bluebook",
    note: "Полные адаптивные тесты College Board",
    url: "https://satsuite.collegeboard.org/practice/practice-tests/bluebook",
  },
  {
    title: "Student Question Bank",
    note: "Все официальные задания по навыкам",
    url: "https://satsuite.collegeboard.org/practice/student-question-bank",
  },
  {
    title: "Khan Academy · Digital SAT",
    note: "Официальный партнёр College Board",
    url: "https://www.khanacademy.org/digital-sat",
  },
];

export function OfficialPractice() {
  return (
    <section className="card p-5">
      <h2 className="text-[15px] font-semibold">Официальная практика</h2>
      <p className="mt-1 text-xs leading-relaxed text-muted">
        Задания в 365step написаны по формату и навыкам College Board. Сами официальные задания — бесплатно на сайте College Board.
      </p>
      <ul className="mt-3 space-y-1">
        {OFFICIAL.map((o) => (
          <li key={o.url}>
            <a
              href={o.url}
              target="_blank"
              rel="noreferrer"
              className="group flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-sunken"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{o.title}</span>
                <span className="block text-xs text-muted">{o.note}</span>
              </span>
              <ArrowUpRight className="size-4 flex-none text-subtle group-hover:text-ink" />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
