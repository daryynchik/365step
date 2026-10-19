/**
 * The arena: each student's hero, their gear, and fights between friends.
 *
 * A friend must accept an invitation before a fight is simulated. Both
 * players can then replay the same saved result. Both heroes are frozen into
 * the duel row, so a replay never changes when someone upgrades gear later.
 */

import { randomInt, randomUUID } from "node:crypto";

import {
  defaultLook,
  FIGHT_REWARD,
  gearFromLegacy,
  isSlot,
  itemName,
  MAX_GEAR_LEVEL,
  normalizeFighter,
  REWARDED_FIGHTS_PER_DAY,
  simulate,
  speciesById,
  upgradeCost,
  validateLook,
  type Fighter,
  type FightResult,
  type Gear,
  type Look,
  type Slot,
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

const LEGACY_COLOR_PALETTE: Record<string, number> = { blue: 0, green: 1, red: 2, amber: 3, violet: 4, slate: 1 };

/**
 * Creates the hero row the first time a student opens the arena. Gear bought
 * in the first arena becomes gear levels here; the balance is left untouched.
 */
async function ensureHero(userId: string): Promise<void> {
  if (await one("SELECT user_id FROM arena_heroes WHERE user_id = ?", [userId])) return;
  const [legacy, items] = await Promise.all([
    one("SELECT color FROM arena_fighters WHERE user_id = ?", [userId]),
    all("SELECT item_id FROM arena_items WHERE user_id = ?", [userId]),
  ]);
  const look = defaultLook(userId);
  const color = legacy ? LEGACY_COLOR_PALETTE[str(legacy.color)] : undefined;
  if (color !== undefined) look.palette = Math.min(color, speciesById(look.species)!.palettes.length - 1);
  const gear = gearFromLegacy(items.map((r) => str(r.item_id)));
  await run(
    `INSERT INTO arena_heroes (user_id, look, chosen, sword, helmet, armor, updated_at)
     VALUES (?, ?, 0, ?, ?, ?, ?) ON CONFLICT DO NOTHING`,
    [userId, JSON.stringify(look), gear.sword, gear.helmet, gear.armor, nowIso()],
  );
}

export interface Hero {
  fighter: Fighter;
  /** False until the student picks a hero in the editor. */
  chosen: boolean;
}

export async function getHero(userId: string): Promise<Hero> {
  await ensureHero(userId);
  const [row, user, total] = await Promise.all([
    one("SELECT look, chosen, sword, helmet, armor FROM arena_heroes WHERE user_id = ?", [userId]),
    one("SELECT name FROM users WHERE id = ?", [userId]),
    earned(userId),
  ]);
  const checked = validateLook(json<unknown>(row?.look, null));
  return {
    chosen: num(row?.chosen) === 1,
    fighter: {
      userId,
      name: str(user?.name, "Игрок"),
      level: levelFor(total).level,
      look: checked.ok ? checked.look : defaultLook(userId),
      gear: { sword: num(row?.sword, 1), helmet: num(row?.helmet, 1), armor: num(row?.armor, 1) },
    },
  };
}

export async function getFighter(userId: string): Promise<Fighter> {
  return (await getHero(userId)).fighter;
}

export async function saveLook(userId: string, input: unknown): Promise<Result & { look?: Look }> {
  const checked = validateLook(input);
  if (!checked.ok) return { ok: false, error: checked.error };
  await ensureHero(userId);
  await run("UPDATE arena_heroes SET look = ?, chosen = 1, updated_at = ? WHERE user_id = ?", [
    JSON.stringify(checked.look),
    nowIso(),
    userId,
  ]);
  return { ok: true, look: checked.look };
}

export type UpgradeResult = { ok: true; level: number; price: number; balance: number } | { ok: false; error: string };

class UpgradeRefused extends Error {}

/**
 * Raises one gear slot by a level, paid with points earned on lessons.
 *
 * `fromLevel` is the level the student saw when pressing the button. The
 * conditional UPDATE both claims the upgrade and locks the hero row, so a
 * double click, a retried request or two tabs can raise a level — and charge
 * for it — only once, and two different upgrades cannot both spend the same
 * points. The balance is checked after the claim, inside the same transaction.
 */
export async function upgradeGear(userId: string, slot: string, fromLevel: number): Promise<UpgradeResult> {
  if (!isSlot(slot)) return { ok: false, error: "Такого предмета нет." };
  if (!Number.isInteger(fromLevel) || fromLevel < 1) return { ok: false, error: "Неверный уровень." };
  if (fromLevel >= MAX_GEAR_LEVEL) return { ok: false, error: "Это уже максимальный уровень." };
  await ensureHero(userId);

  const price = upgradeCost(fromLevel);
  const to = fromLevel + 1;
  try {
    return await transaction(async () => {
      const claimed = await one(
        `UPDATE arena_heroes SET ${slot} = ?, updated_at = ? WHERE user_id = ? AND ${slot} = ? RETURNING user_id`,
        [to, nowIso(), userId, fromLevel],
      );
      if (!claimed) throw new UpgradeRefused("Уровень уже изменился. Обнови страницу.");
      const points = await balance(userId);
      if (points < price) throw new UpgradeRefused(`Не хватает ${price - points} очков.`);
      const id = randomUUID();
      await run("INSERT INTO arena_upgrades (id, user_id, slot, to_level, price, created_at) VALUES (?, ?, ?, ?, ?, ?)", [
        id,
        userId,
        slot,
        to,
        price,
        nowIso(),
      ]);
      await addPoints(userId, -price, `Улучшение: ${itemName(slot as Slot, to)}, ур. ${to}`, id);
      return { ok: true as const, level: to, price, balance: points - price };
    });
  } catch (error) {
    if (error instanceof UpgradeRefused) return { ok: false, error: error.message };
    throw error;
  }
}

export async function getGear(userId: string): Promise<Gear> {
  return (await getFighter(userId)).gear;
}

// ----------------------------------------------------------------- fights --

export async function rewardedFightsToday(userId: string): Promise<number> {
  return scalar("SELECT COUNT(*) FROM duels WHERE attacker_id = ? AND day = ? AND attacker_points > 0", [userId, todayIso()]);
}

export type FightOutcome = { ok: true; duelId: string } | { ok: false; error: string };

async function createAcceptedDuel(userId: string, opponentId: string): Promise<FightOutcome> {
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

export interface FightRequest {
  id: string;
  attackerId: string;
  defenderId: string;
  attackerName: string;
  defenderName: string;
  createdAt: string;
  expiresAt: string;
}

export async function getFightRequests(userId: string): Promise<FightRequest[]> {
  const rows = await all(
    `SELECT r.*, a.name AS attacker_name, d.name AS defender_name
     FROM arena_requests r JOIN users a ON a.id = r.attacker_id JOIN users d ON d.id = r.defender_id
     WHERE (r.attacker_id = ? OR r.defender_id = ?) AND r.status = 'pending' AND r.expires_at > ?
     ORDER BY r.created_at DESC`, [userId, userId, nowIso()],
  );
  return rows.map((r) => ({
    id: str(r.id), attackerId: str(r.attacker_id), defenderId: str(r.defender_id),
    attackerName: str(r.attacker_name), defenderName: str(r.defender_name),
    createdAt: str(r.created_at), expiresAt: str(r.expires_at),
  }));
}

export async function requestFight(userId: string, opponentId: string): Promise<Result> {
  if (userId === opponentId) return { ok: false, error: "С собой сражаться нельзя." };
  if (!(await areFriends(userId, opponentId))) return { ok: false, error: "Вызывать на бой можно только друзей." };
  return transaction(async () => {
    const now = nowIso();
    const [a, b] = [userId, opponentId].sort();
    await run("UPDATE arena_requests SET status = 'expired' WHERE pair_a = ? AND pair_b = ? AND status = 'pending' AND expires_at <= ?", [a, b, now]);
    const count = await scalar("SELECT COUNT(*) FROM arena_requests WHERE attacker_id = ? AND created_at >= ?", [userId, `${todayIso()}T00:00:00.000Z`]);
    if (count >= 30) return { ok: false, error: "На сегодня достаточно вызовов. Попробуй завтра." };
    const inserted = await one(
      `INSERT INTO arena_requests (id, attacker_id, defender_id, pair_a, pair_b, status, created_at, expires_at)
       VALUES (?, ?, ?, ?, ?, 'pending', ?, ?) ON CONFLICT DO NOTHING RETURNING id`,
      [randomUUID(), userId, opponentId, a, b, now, new Date(Date.parse(now) + 72 * 3600000).toISOString()],
    );
    return inserted ? { ok: true } : { ok: false, error: "Между вами уже есть заявка. Ответь на входящую или дождись друга." };
  });
}

export type RequestResponse = { ok: true; duelId?: string } | { ok: false; error: string };

export async function respondToFightRequest(userId: string, requestId: string, response: "accept" | "decline" | "cancel"): Promise<RequestResponse> {
  if (!["accept", "decline", "cancel"].includes(response)) return { ok: false, error: "Неизвестное действие." };
  return transaction(async () => {
    const request = await one("SELECT * FROM arena_requests WHERE id = ? AND status = 'pending' AND expires_at > ?", [requestId, nowIso()]);
    if (!request) return { ok: false, error: "Заявка уже обработана или истекла." };
    const actor = response === "cancel" ? request.attacker_id : request.defender_id;
    if (actor !== userId) return { ok: false, error: "Это не твоя заявка." };
    if (response === "accept" && !(await areFriends(str(request.attacker_id), str(request.defender_id)))) {
      return { ok: false, error: "Для боя нужно оставаться друзьями." };
    }
    // The conditional UPDATE is the claim: concurrent accepts cannot simulate
    // a second duel or pay a second reward, including with PostgreSQL.
    const claimed = await one(
      "UPDATE arena_requests SET status = ?, answered_at = ? WHERE id = ? AND status = 'pending' AND expires_at > ? RETURNING id",
      [response === "accept" ? "accepted" : response === "decline" ? "declined" : "cancelled", nowIso(), requestId, nowIso()],
    );
    if (!claimed) return { ok: false, error: "Заявка уже обработана или истекла." };
    if (response !== "accept") return { ok: true };
    const duel = await createAcceptedDuel(str(request.attacker_id), str(request.defender_id));
    if (!duel.ok) throw new Error(duel.error); // Roll back the claim together with the duel.
    await run("UPDATE arena_requests SET duel_id = ? WHERE id = ?", [duel.duelId, requestId]);
    return { ok: true, duelId: duel.duelId };
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
    attacker: normalizeFighter(json<unknown>(row.attacker_fighter, null)),
    defender: normalizeFighter(json<unknown>(row.defender_fighter, null)),
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
