import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { DuelReplay } from "@/components/arena/duel-replay";
import { getDuel } from "@/lib/arena";
import { currentUser } from "@/lib/auth";
import { formatDate } from "@/lib/date";

export const metadata: Metadata = { title: "Бой" };
export const dynamic = "force-dynamic";

export default async function DuelPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) redirect("/signin");
  const { id } = await params;

  const duel = await getDuel(user.id, id);
  if (!duel) notFound();

  const meIndex = duel.attacker.userId === user.id ? 0 : 1;
  const opponent = meIndex === 0 ? duel.defender : duel.attacker;

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/arena" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ChevronLeft className="size-4" /> Арена
      </Link>
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-bold tracking-tight">
          {duel.attacker.name} — {duel.defender.name}
        </h1>
        <span className="text-sm text-muted">{formatDate(duel.createdAt)}</span>
      </div>
      <DuelReplay
        attacker={duel.attacker}
        defender={duel.defender}
        fight={duel.fight}
        meIndex={meIndex}
        myPoints={meIndex === 0 ? duel.attackerPoints : duel.defenderPoints}
        opponentId={opponent.userId}
      />
    </div>
  );
}
