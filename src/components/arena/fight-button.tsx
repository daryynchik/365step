"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, Swords } from "lucide-react";

import { requestFightAction } from "@/actions/arena";
import { Button } from "../ui";

export function FightButton({ opponentId, highlight, requested = false }: { opponentId: string; highlight?: boolean; requested?: boolean }) {
  const [pending, start] = useTransition();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const waiting = requested || sent;

  return (
    <div className="flex flex-col items-end gap-1">
      <Button size="sm" variant={highlight ? "primary" : "secondary"} disabled={pending || waiting}
        onClick={() => start(async () => {
          setError(null);
          const result = await requestFightAction(opponentId);
          if (result.ok) setSent(true);
          else setError(result.error ?? "Не получилось отправить вызов.");
        })}>
        {pending ? <Loader2 className="size-3.5 animate-spin" /> : waiting ? <Check className="size-3.5" /> : <Swords className="size-3.5" />}
        {waiting ? "Ожидание" : "Вызвать"}
      </Button>
      {sent && <p role="status" className="max-w-40 text-right text-xs text-accent">Заявка отправлена. Ждём ответа друга.</p>}
      {error && <p role="alert" className="max-w-48 text-right text-xs text-danger">{error}</p>}
    </div>
  );
}
