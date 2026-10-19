"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Check, Flag, Loader2, UserPlus, X } from "lucide-react";
import { clsx } from "clsx";

import { removeFriendAction, respondToRequestAction, sendFriendRequestAction } from "@/actions/friends";
import type { FriendRequest, Standing } from "@/lib/friends";
import { Avatar, Button, ErrorNote, Flame } from "./ui";

export function AddFriendForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  return (
    <form
      className="flex flex-col gap-2 sm:flex-row"
      onSubmit={(e) => {
        e.preventDefault();
        setMessage(null);
        start(async () => {
          const res = await sendFriendRequestAction(email);
          if (res.ok) {
            setMessage({ ok: true, text: "Заявка отправлена." });
            setEmail("");
          } else {
            setMessage({ ok: false, text: res.error ?? "Не получилось." });
          }
        });
      }}
    >
      <div className="flex-1">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email друга"
          aria-label="Email друга"
          className="h-10 w-full rounded-[10px] border border-line-strong bg-surface px-3 text-sm outline-none focus:border-accent"
        />
        {message && (
          <p className={clsx("mt-1.5 text-xs", message.ok ? "text-accent" : "text-danger")} role="status">
            {message.text}
          </p>
        )}
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
        Добавить
      </Button>
    </form>
  );
}

export function RequestRow({ request, incoming }: { request: FriendRequest; incoming: boolean }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const respond = (accept: boolean) =>
    start(async () => {
      const res = await respondToRequestAction(request.id, accept);
      if (!res.ok) setError(res.error ?? "Не получилось.");
    });

  return (
    <li className="flex items-center gap-3 py-2.5">
      <Avatar name={request.person.name} size={34} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{request.person.name}</p>
        <p className="truncate text-xs text-muted">{incoming ? "хочет учиться вместе" : "ждёт ответа"}</p>
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
      {incoming && (
        <div className="flex gap-1.5">
          <Button size="sm" onClick={() => respond(true)} disabled={pending} aria-label="Принять">
            <Check className="size-4" /> Принять
          </Button>
          <Button size="sm" variant="ghost" onClick={() => respond(false)} disabled={pending} aria-label="Отклонить">
            <X className="size-4" />
          </Button>
        </div>
      )}
    </li>
  );
}

type Range = "week" | "all";

export function Leaderboard({ standings }: { standings: Standing[] }) {
  const [range, setRange] = useState<Range>("week");
  const [removing, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const rows = [...standings].sort((a, b) =>
    range === "week" ? b.earnedWeek - a.earnedWeek || b.earned - a.earned : b.earned - a.earned || b.earnedWeek - a.earnedWeek,
  );

  return (
    <section className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <h2 className="text-[15px] font-semibold">Рейтинг друзей</h2>
          <p className="text-xs text-muted">Очки за уроки, работы и бои. Покупки на арене рейтинг не уменьшают.</p>
        </div>
        <div className="flex rounded-lg border border-line bg-sunken p-0.5 text-sm" role="tablist">
          {(["week", "all"] as const).map((r) => (
            <button
              key={r}
              type="button"
              role="tab"
              aria-selected={range === r}
              onClick={() => setRange(r)}
              className={clsx("rounded-md px-3 py-1 font-medium", range === r ? "bg-surface shadow-card" : "text-muted hover:text-ink")}
            >
              {r === "week" ? "Неделя" : "Всё время"}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="tabular w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-muted">
              <th className="w-12 px-5 py-2.5 font-medium">#</th>
              <th className="px-2 py-2.5 font-medium">Игрок</th>
              <th className="px-2 py-2.5 text-right font-medium">{range === "week" ? "За неделю" : "Всего"}</th>
              <th className="px-2 py-2.5 text-right font-medium">Уровень</th>
              <th className="px-2 py-2.5 text-right font-medium">Уроки</th>
              <th className="px-2 py-2.5 text-right font-medium">Серия</th>
              <th className="px-2 py-2.5 text-right font-medium">Гонки</th>
              <th className="w-24 px-5 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {rows.map((s, i) => (
              <tr key={s.id} className={clsx("border-b border-line last:border-0", s.isMe && "bg-accent-soft/60")}>
                <td className="px-5 py-3">
                  <span
                    className={clsx(
                      "grid size-7 place-items-center rounded-full text-xs font-bold",
                      i === 0 ? "bg-coin text-white" : i === 1 ? "bg-[#b5b0a6] text-white" : i === 2 ? "bg-[#c08a5a] text-white" : "text-muted",
                    )}
                  >
                    {i + 1}
                  </span>
                </td>
                <td className="px-2 py-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={s.name} size={30} />
                    <span className="font-medium">{s.isMe ? `${s.name} (ты)` : s.name}</span>
                  </div>
                </td>
                <td className="px-2 py-3 text-right font-semibold">{range === "week" ? s.earnedWeek : s.earned}</td>
                <td className="px-2 py-3 text-right">{s.level}</td>
                <td className="px-2 py-3 text-right">{s.lessons}</td>
                <td className="px-2 py-3 text-right">
                  <span className="inline-flex items-center gap-1">
                    <Flame className="size-4" active={s.streak > 0} />
                    {s.streak}
                  </span>
                </td>
                <td className="px-2 py-3 text-right text-muted">
                  {s.wins}–{s.losses}
                </td>
                <td className="px-5 py-3 text-right">
                  {!s.isMe && (
                    <div className="flex justify-end gap-1">
                      <Link
                        href={`/arena?friend=${s.id}`}
                        className="rounded-md p-1.5 text-subtle hover:bg-sunken hover:text-ink"
                        aria-label={`Пригласить ${s.name} на соревнование`}
                        title="Пригласить на соревнование"
                      >
                        <Flag className="size-4" />
                      </Link>
                      <button
                        type="button"
                        disabled={removing}
                        onClick={() => {
                          if (!confirm(`Удалить ${s.name} из друзей?`)) return;
                          start(async () => {
                            const res = await removeFriendAction(s.id);
                            if (!res.ok) setError(res.error ?? "Не получилось.");
                          });
                        }}
                        className="rounded-md p-1.5 text-subtle hover:bg-sunken hover:text-danger"
                        aria-label={`Удалить ${s.name} из друзей`}
                        title="Удалить из друзей"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {error && (
        <div className="p-4">
          <ErrorNote>{error}</ErrorNote>
        </div>
      )}
    </section>
  );
}
