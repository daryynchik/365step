import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { clsx } from "clsx";

import { ArenaWorkshop } from "@/components/arena/arena-workshop";
import { FightButton } from "@/components/arena/fight-button";
import { Avatar } from "@/components/ui";
import { getFighter, getOwnedItems, recentDuels, rewardedFightsToday } from "@/lib/arena";
import { FIGHT_REWARD, item, powerRating, REWARDED_FIGHTS_PER_DAY } from "@/lib/arena-rules";
import { currentUser } from "@/lib/auth";
import { timeAgo } from "@/lib/date";
import { getFriendIds } from "@/lib/friends";
import { balance } from "@/lib/game";

export const metadata: Metadata = { title: "Арена" };
export const dynamic = "force-dynamic";

export default async function ArenaPage({ searchParams }: { searchParams: Promise<{ opponent?: string }> }) {
  const user = await currentUser();
  if (!user) redirect("/signin");
  const { opponent } = await searchParams;

  const [me, owned, points, friendIds, duels, rewarded] = await Promise.all([
    getFighter(user.id),
    getOwnedItems(user.id),
    balance(user.id),
    getFriendIds(user.id),
    recentDuels(user.id),
    rewardedFightsToday(user.id),
  ]);
  const opponents = (await Promise.all(friendIds.map((id) => getFighter(id)))).sort((a, b) =>
    a.userId === opponent ? -1 : b.userId === opponent ? 1 : powerRating(b) - powerRating(a),
  );
  const myPower = powerRating(me);
  const left = Math.max(0, REWARDED_FIGHTS_PER_DAY - rewarded);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Арена</h1>
        <p className="max-w-2xl text-sm text-muted">
          Очки за уроки превращаются в снаряжение. Вызывай друзей: бой рассчитывается по уровню, оружию и щиту, а его можно пересмотреть в 3D.
        </p>
      </div>

      <ArenaWorkshop
        name={user.name}
        level={me.level}
        initial={{ color: me.color, weapon: me.weapon, shield: me.shield }}
        owned={[...owned]}
        balance={points}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-[15px] font-semibold">Соперники</h2>
            <span className="text-xs text-muted">
              Оплачиваемых боёв сегодня: {left} из {REWARDED_FIGHTS_PER_DAY}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted">
            Победа +{FIGHT_REWARD.win}, ничья +{FIGHT_REWARD.draw}, поражение +{FIGHT_REWARD.loss} очков.
          </p>

          {opponents.length === 0 ? (
            <p className="mt-4 text-sm text-muted">
              На арене сражаются только друзья.{" "}
              <Link href="/friends" className="font-medium text-accent hover:underline">
                Добавить друга
              </Link>
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-line">
              {opponents.map((o) => {
                const power = powerRating(o);
                const diff = power - myPower;
                return (
                  <li key={o.userId} className={clsx("flex items-center gap-3 py-3", o.userId === opponent && "-mx-2 rounded-lg bg-accent-soft/60 px-2")}>
                    <Avatar name={o.name} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{o.name}</p>
                      <p className="truncate text-xs text-muted">
                        Ур. {o.level} · {item(o.weapon).name} · {item(o.shield).name}
                      </p>
                    </div>
                    <span
                      className={clsx("tabular text-xs font-semibold", diff > 15 ? "text-danger" : diff < -15 ? "text-accent" : "text-muted")}
                      title="Сила соперника"
                    >
                      {power}
                    </span>
                    <FightButton opponentId={o.userId} highlight={o.userId === opponent} />
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="card p-5">
          <h2 className="text-[15px] font-semibold">Последние бои</h2>
          {duels.length === 0 ? (
            <p className="mt-2 text-sm text-muted">Боёв пока не было.</p>
          ) : (
            <ul className="mt-2 divide-y divide-line">
              {duels.map((d) => {
                const iAttacked = d.attacker.userId === user.id;
                const other = iAttacked ? d.defender : d.attacker;
                const result = d.winnerId === null ? "draw" : d.winnerId === user.id ? "win" : "loss";
                return (
                  <li key={d.id}>
                    <Link href={`/arena/duel/${d.id}`} className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-sunken">
                      <span
                        className={clsx(
                          "w-20 flex-none text-xs font-bold uppercase",
                          result === "win" ? "text-accent" : result === "loss" ? "text-danger" : "text-muted",
                        )}
                      >
                        {result === "win" ? "Победа" : result === "loss" ? "Поражение" : "Ничья"}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm">
                        {iAttacked ? "Ты против " : "Тебя вызвал(а) "}
                        <span className="font-medium">{other.name}</span>
                      </span>
                      <span className="flex-none text-xs text-subtle">{timeAgo(d.createdAt)}</span>
                      <ChevronRight className="size-4 flex-none text-subtle" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
