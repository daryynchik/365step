"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Clock3, Loader2, Swords } from "lucide-react";

import { respondToFightAction } from "@/actions/arena";
import type { FightRequest } from "@/lib/arena";
import { Avatar, Button } from "../ui";

export function FightRequests({ requests, userId }: { requests: FightRequest[]; userId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  useEffect(() => {
    const refresh = () => { if (!document.hidden) router.refresh(); };
    const timer = window.setInterval(refresh, 15000);
    window.addEventListener("focus", refresh);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, [router]);

  const respond = (id: string, response: "accept" | "decline" | "cancel") => start(async () => {
    setError(null);
    setBusy(id);
    try {
      const result = await respondToFightAction(id, response);
      if (!result.ok) setError(result.error ?? "Не получилось обработать заявку.");
    } finally { setBusy(null); }
  });

  return (
    <section className="card p-5" aria-labelledby="fight-requests-title">
      <div className="flex items-center gap-2">
        <Swords className="size-4 text-accent" />
        <h2 id="fight-requests-title" className="text-[15px] font-semibold">Заявки на бой</h2>
        {requests.length > 0 && <span className="rounded-full bg-accent-soft px-2 text-xs font-semibold text-accent">{requests.length}</span>}
      </div>
      <p className="mt-1 text-xs text-muted">Бой начинается только после согласия соперника. Заявка действует 72 часа; снаряжение фиксируется в момент принятия.</p>
      {requests.length === 0 ? <p className="mt-4 text-sm text-muted">Заявок пока нет. Выбери друга в списке соперников и отправь вызов.</p> : (
        <ul className="mt-3 divide-y divide-line">
          {requests.map((r) => {
            const incoming = r.defenderId === userId;
            const name = incoming ? r.attackerName : r.defenderName;
            return (
              <li key={r.id} className="flex flex-wrap items-center gap-3 py-3">
                <Avatar name={name} size={34} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{name}</p>
                  <p className="flex items-center gap-1 text-xs text-muted"><Clock3 className="size-3" />{incoming ? "Вызывает тебя на бой" : "Ожидает ответа"} · до {new Date(r.expiresAt).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                </div>
                <div className="flex gap-2">
                  {incoming ? <>
                    <Button size="sm" disabled={pending} onClick={() => respond(r.id, "accept")}>{pending && busy === r.id ? <Loader2 className="size-3.5 animate-spin" /> : <Swords className="size-3.5" />}Принять бой</Button>
                    <Button size="sm" variant="ghost" disabled={pending} onClick={() => respond(r.id, "decline")}>Отклонить</Button>
                  </> : <Button size="sm" variant="ghost" disabled={pending} onClick={() => respond(r.id, "cancel")}>Отменить вызов</Button>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {error && <p role="alert" className="mt-3 text-sm text-danger">{error}</p>}
    </section>
  );
}
