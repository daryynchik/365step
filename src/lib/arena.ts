/**
 * The arena: each user's fighter, the gear they own, and fights between friends.
 *
 * Fights are asynchronous — you challenge a friend's fighter as it is equipped
 * right now, the server simulates the fight once with a random seed, and both
 * players can replay it. Both loadouts are frozen into the duel row, so a replay
 * never changes when someone buys new gear later.
 */

import { randomInt, randomUUID } from "node:crypto";

import {
  COLORS,
  DEFAULT_SHIELD,
  DEFAULT_WEAPON,
  FIGHT_REWARD,
  isColor,
  ITEMS,
  REWARDED_FIGHTS_PER_DAY,
  simulate,
  type Fighter,
  type FighterColor,
  type FightResult,
} from "./arena-rules";
import { all, json, num, one, run, scalar, str, transaction } from "./db";
import { nowIso, todayIso } from "./date";
import { areFriends } from "./friends";
import { addPoints, balance, earned } from "./game";
import { levelFor } from "./rules";

export interface Result {
  ok: boolean;
  error?: string;
}

async function ensureFighterRow(userId: string): Promise<void> {
  const row = await one("SELECT user_id FROM arena_fighters WHERE user_id = ?", [userId]);
  if (!row) {
    // Spread first-time colours across the palette so friends do not all look alike.
    const palette = Object.keys(COLORS) as FighterColor[];
    const color = palette[parseInt(userId.replace(/[^0-9a-f]/gi, "").slice(0, 6) || "0", 16) % palette.length];
    await run(
      "INSERT INTO arena_fighters (user_id, color, weapon, shield, updated_at) VALUES (?, ?, ?, ?, ?)",
      [userId, color, DEFAULT_WEAPON, DEFAULT_SHIELD, nowIso()],
    );
  }
}

export async function getFighter(userId: string): Promise<Fighter> {
  await ensureFighterRow(userId);
  const [row, user, total] = await Promise.all([
    one("SELECT color, weapon, shield FROM arena_fighters WHERE user_id = ?", [userId]),
    one("SELECT name FROM users WHERE id = ?", [userId]),
    earned(userId),
  ]);
  const color = str(row?.color, "blue");
  return {
    userId,
    name: str(user?.name, "Игрок"),
    level: levelFor(total).level,
    color: isColor(color) ? color : "blue",
    weapon: str(row?.weapon, DEFAULT_WEAPON),
    shield: str(row?.shield, DEFAULT_SHIELD),
  };
}

export async function getOwnedItems(userId: string): Promise<Set<string>> {
  const rows = await all("SELECT item_id FROM arena_items WHERE user_id = ?", [userId]);
  // Starter gear is owned by everyone.
  return new Set([DEFAULT_WEAPON, DEFAULT_SHIELD, ...rows.map((r) => str(r.item_id))]);
}

export async function buyItem(userId: string, itemId: string): Promise<Result> {
  const target = ITEMS.find((i) => i.id === itemId);
  if (!target) return { ok: false, error: "Такого предмета нет." };

  return transaction(async () => {
    const owned = await getOwnedItems(userId);
    if (owned.has(itemId)) return { ok: false, error: "Этот предмет уже твой." };
    const points = await balance(userId);
    if (points < target.price) return { ok: false, error: `Не хватает ${target.price - points} очков.` };

    await run("INSERT INTO arena_items (user_id, item_id, price, purchased_at) VALUES (?, ?, ?, ?)", [
      userId,
      itemId,
      target.price,
      nowIso(),
    ]);
    await addPoints(userId, -target.price, `Покупка: ${target.name}`, itemId);
    await equipItem(userId, itemId);
    return { ok: true };
  });
}

export async function equipItem(userId: string, itemId: string): Promise<Result> {
  const target = ITEMS.find((i) => i.id === itemId);
  if (!target) return { ok: false, error: "Такого предмета нет." };
  if (!(await getOwnedItems(userId)).has(itemId)) return { ok: false, error: "Сначала купи этот предмет." };

  await ensureFighterRow(userId);
  const column = target.kind === "weapon" ? "weapon" : "shield";
  await run(`UPDATE arena_fighters SET ${column} = ?, updated_at = ? WHERE user_id = ?`, [itemId, nowIso(), userId]);
  return { ok: true };
}

export async function setColor(userId: string, color: string): Promise<Result> {
  if (!isColor(color)) return { ok: false, error: "Такого цвета нет." };
  await ensureFighterRow(userId);
  await run("UPDATE arena_fighters SET color = ?, updated_at = ? WHERE user_id = ?", [color, nowIso(), userId]);
  return { ok: true };
}

// ----------------------------------------------------------------- fights --

export async function rewardedFightsToday(userId: string): Promise<number> {
  return scalar("SELECT COUNT(*) FROM duels WHERE attacker_id = ? AND day = ? AND attacker_points > 0", [userId, todayIso()]);
}

export type FightOutcome = { ok: true; duelId: string } | { ok: false; error: string };

export async function startFight(userId: string, opponentId: string): Promise<FightOutcome> {
  if (userId === opponentId) return { ok: false, error: "С собой сражаться нельзя." };
  if (!(await areFriends(userId, opponentId))) return { ok: false, error: "Сражаться можно только с друзьями." };

  return transaction(async () => {
    const [attacker, defender, rewarded] = await Promise.all([
      getFighter(userId),
      getFighter(opponentId),
      rewardedFightsToday(userId),
    ]);

    const seed = randomInt(0, 2 ** 31);
    const fight = simulate(attacker, defender, seed);
    const winnerId = fight.winner === 0 ? userId : fight.winner === 1 ? opponentId : null;

    // The challenger is paid for the first few fights a day. The defender gets a
    // small bonus for a successful defence, so being challenged is never a loss.
    const pays = rewarded < REWARDED_FIGHTS_PER_DAY;
    const attackerPoints = pays
      ? fight.winner === 0
        ? FIGHT_REWARD.win
        : fight.winner === null
          ? FIGHT_REWARD.draw
          : FIGHT_REWARD.loss
      : 0;
    const defenderPoints = pays && fight.winner === 1 ? FIGHT_REWARD.loss : 0;

    const id = randomUUID();
    await run(
      `INSERT INTO duels (id, attacker_id, defender_id, attacker_fighter, defender_fighter, seed, log, winner_id,
                          attacker_points, defender_points, day, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        userId,
        opponentId,
        JSON.stringify(attacker),
        JSON.stringify(defender),
        seed,
        JSON.stringify(fight),
        winnerId,
        attackerPoints,
        defenderPoints,
        todayIso(),
        nowIso(),
      ],
    );
    await addPoints(userId, attackerPoints, "Бой на арене", id);
    await addPoints(opponentId, defenderPoints, "Защита на арене", id);
    return { ok: true as const, duelId: id };
  });
}

export interface Duel {
  id: string;
  attacker: Fighter;
  defender: Fighter;
  fight: FightResult;
  winnerId: string | null;
  attackerPoints: number;
  defenderPoints: number;
  createdAt: string;
}

function toDuel(row: Record<string, unknown>): Duel {
  return {
    id: str(row.id),
    attacker: json<Fighter>(row.attacker_fighter, {} as Fighter),
    defender: json<Fighter>(row.defender_fighter, {} as Fighter),
    fight: json<FightResult>(row.log, { hits: [], winner: null, maxHp: [100, 100] }),
    winnerId: row.winner_id ? str(row.winner_id) : null,
    attackerPoints: num(row.attacker_points),
    defenderPoints: num(row.defender_points),
    createdAt: str(row.created_at),
  };
}

/** A duel, if the user took part in it. */
export async function getDuel(userId: string, duelId: string): Promise<Duel | null> {
  const row = await one("SELECT * FROM duels WHERE id = ? AND (attacker_id = ? OR defender_id = ?)", [duelId, userId, userId]);
  return row ? toDuel(row) : null;
}

export async function recentDuels(userId: string, limit = 8): Promise<Duel[]> {
  const rows = await all(
    "SELECT * FROM duels WHERE attacker_id = ? OR defender_id = ? ORDER BY created_at DESC LIMIT ?",
    [userId, userId, limit],
  );
  return rows.map(toDuel);
}
