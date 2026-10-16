"use client";

import { useState, useTransition } from "react";
import { Loader2, Swords } from "lucide-react";

import { startFightAction } from "@/actions/arena";
import { Button } from "../ui";

export function FightButton({ opponentId, highlight }: { opponentId: string; highlight?: boolean }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        size="sm"
        variant={highlight ? "primary" : "secondary"}
        disabled={pending}
        onClick={() =>
          start(async () => {
            // On success the action redirects to the replay.
            const res = await startFightAction(opponentId);
            if (res && !res.ok) setError(res.error ?? "Не получилось.");
          })
        }
      >
        {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Swords className="size-3.5" />}В бой
      </Button>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
