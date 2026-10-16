"use client";

import { useState, useTransition } from "react";
import { Check, Plus, X } from "lucide-react";
import { clsx } from "clsx";

import { addDeadlineAction, removeDeadlineAction, toggleDeadlineAction } from "@/actions/deadlines";
import type { Deadline } from "@/lib/deadlines";
import { plural } from "@/lib/date";
import { Button } from "./ui";

function countdown(days: number): { text: string; tone: string } {
  if (days < 0) return { text: "прошёл", tone: "text-subtle" };
  if (days === 0) return { text: "сегодня", tone: "text-danger" };
  const text = `${days} ${plural(days, "день", "дня", "дней")}`;
  return { text, tone: days <= 14 ? "text-danger" : days <= 45 ? "text-warn" : "text-muted" };
}

export function DeadlinesCard({ deadlines }: { deadlines: Deadline[] }) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const add = () =>
    start(async () => {
      setError(null);
      const res = await addDeadlineAction(title, date);
      if (res.ok) {
        setTitle("");
        setDate("");
        setAdding(false);
      } else setError(res.error ?? "Не получилось.");
    });

  return (
    <section className="card p-5">
      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="text-[15px] font-semibold">Мои дедлайны</h2>
        {!adding && (
          <button type="button" onClick={() => setAdding(true)} className="flex items-center gap-1 text-xs font-medium text-muted hover:text-ink">
            <Plus className="size-3.5" /> Добавить
          </button>
        )}
      </div>

      {deadlines.length === 0 && !adding && (
        <p className="text-sm text-muted">Запиши дедлайны вузов и стипендий — здесь появится обратный отсчёт.</p>
      )}

      {deadlines.length > 0 && (
        <ul className="space-y-1">
          {deadlines.map((d) => {
            const c = countdown(d.daysLeft);
            return (
              <li key={d.id} className="group flex items-center gap-2.5 rounded-lg px-1 py-1.5">
                <button
                  type="button"
                  onClick={() => start(() => toggleDeadlineAction(d.id))}
                  aria-label={d.done ? "Отметить как невыполненный" : "Отметить как выполненный"}
                  className={clsx(
                    "grid size-5 flex-none place-items-center rounded-md border",
                    d.done ? "border-accent bg-accent text-white" : "border-line-strong hover:border-accent",
                  )}
                >
                  {d.done && <Check className="size-3.5" strokeWidth={3} />}
                </button>
                <span className={clsx("min-w-0 flex-1 truncate text-sm", d.done && "text-subtle line-through")}>{d.title}</span>
                {!d.done && <span className={clsx("tabular flex-none text-xs font-medium", c.tone)}>{c.text}</span>}
                <button
                  type="button"
                  onClick={() => start(() => removeDeadlineAction(d.id))}
                  aria-label="Удалить"
                  className="flex-none rounded p-0.5 text-subtle opacity-0 hover:text-danger group-hover:opacity-100 focus:opacity-100"
                >
                  <X className="size-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {adding && (
        <form
          className="mt-2 space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            add();
          }}
        >
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Например: MIT — Early Action"
            aria-label="Название"
            maxLength={80}
            className="h-9 w-full rounded-lg border border-line-strong bg-surface px-3 text-sm outline-none focus:border-accent"
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-label="Дата"
            className="h-9 w-full rounded-lg border border-line-strong bg-surface px-3 text-sm outline-none focus:border-accent"
          />
          {error && <p className="text-xs text-danger">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={pending}>
              Сохранить
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setAdding(false)}>
              Отмена
            </Button>
          </div>
          <p className="text-xs text-subtle">Точные даты проверяй на сайте вуза — они меняются каждый год.</p>
        </form>
      )}
    </section>
  );
}
