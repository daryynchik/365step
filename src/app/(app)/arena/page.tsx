import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { clsx } from "clsx";

import { Hero } from "@/components/arena/hero";
import { HeroEditor } from "@/components/arena/hero-editor";
import { FightRequests } from "@/components/arena/fight-requests";
import { FightButton } from "@/components/arena/fight-button";
import { getFightRequests, getFighter, getHero, recentDuels, rewardedFightsToday } from "@/lib/arena";
import { FIGHT_REWARD, powerRating, REWARDED_FIGHTS_PER_DAY, speciesById } from "@/lib/arena-rules";
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

  const [hero, points, friendIds, duels, rewarded, requests] = await Promise.all([
    getHero(user.id),
    balance(user.id),
    getFriendIds(user.id),
    recentDuels(user.id),
    rewardedFightsToday(user.id),
    getFightRequests(user.id),
  ]);
  const opponents = (await Promise.all(friendIds.map((id) => getFighter(id)))).sort((a, b) =>
    a.userId === opponent ? -1 : b.userId === opponent ? 1 : powerRating(b.gear) - powerRating(a.gear),
  );
  const me = hero.fighter;
  const myPower = powerRating(me.gear);
  const left = Math.max(0, REWARDED_FIGHTS_PER_DAY - rewarded);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Арена</h1>
        <p className="max-w-2xl text-sm text-muted">
          Выбери своего героя, улучшай меч, шлем и броню за очки с уроков. Отправь другу вызов и дождись согласия — после принятия вы увидите бой своих героев.
        </p>
      </div>

      <HeroEditor
        name={user.name}
        studyLevel={me.level}
        initialLook={me.look}
        chosen={hero.chosen}
        gear={me.gear}
        balance={points}
      />

      <FightRequests requests={requests} userId={user.id} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
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
                const power = powerRating(o.gear);
                const diff = power - myPower;
                return (
                  <li key={o.userId} className={clsx("flex items-center gap-3 py-3", o.userId === opponent && "-mx-2 rounded-lg bg-accent-soft/60 px-2")}>
                    <span className="grid size-12 flex-none place-items-center overflow-hidden rounded-xl bg-sunken">
                      <Hero look={o.look} gear={o.gear} crop="bust" className="size-12" label={`Герой: ${speciesById(o.look.species)?.name ?? ""}`} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{o.name}</p>
                      <p className="truncate text-xs text-muted">
                        {speciesById(o.look.species)?.name} · меч {o.gear.sword} · шлем {o.gear.helmet} · броня {o.gear.armor}
                      </p>
                    </div>
                    <span
                      className={clsx("tabular text-xs font-semibold", diff > 15 ? "text-danger" : diff < -15 ? "text-accent" : "text-muted")}
                      title="Сила соперника"
                    >
                      {power}
                    </span>
                    <FightButton key={`${o.userId}-${requests.some((r) => r.attackerId === o.userId || r.defenderId === o.userId)}`} opponentId={o.userId} highlight={o.userId === opponent} requested={requests.some((r) => r.attackerId === o.userId || r.defenderId === o.userId)} />
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
                      <span className="grid size-9 flex-none place-items-center overflow-hidden rounded-lg bg-sunken">
                        <Hero look={other.look} gear={other.gear} crop="bust" className="size-9" />
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
