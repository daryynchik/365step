/**
 * The arena's student side: each student's hero, the accessories they own and
 * wear, and the one-time compensation for gear bought in the old fighting
 * arena. Races live in lib/race.ts.
 *
 * Coins are the points students earn on lessons and in races (the `points`
 * ledger). Accessories are decorative only.
 */

import { defaultLook, speciesById, validateLook, type Look, type Racer } from "./arena-rules";
import { all, json, num, one, run, scalar, str, transaction } from "./db";
import { nowIso } from "./date";
import { addPoints, balance } from "./game";
import { cleanOutfit, shopItem, SLOTS, type Outfit, type Slot } from "./shop-items";

export interface Result {
  ok: boolean;
  error?: string;
}

const LEGACY_COLOR_PALETTE: Record<string, number> = { blue: 0, green: 1, red: 2, amber: 3, violet: 4, slate: 1 };

/** What a student spent on fighting gear in the old arenas: weapons, shields and upgrades. */
export async function combatGearSpent(userId: string): Promise<number> {
  const [items, upgrades] = await Promise.all([
    scalar("SELECT COALESCE(SUM(price), 0) FROM arena_items WHERE user_id = ?", [userId]),
    scalar("SELECT COALESCE(SUM(price), 0) FROM arena_upgrades WHERE user_id = ?", [userId]),
  ]);
  return items + upgrades;
}

/**
 * Prepares a student for the arena the first time they open it:
 *   - creates their hero (a varied default until they choose one);
 *   - pays back, once, every coin spent on fighting gear. The claim row in
 *     arena_refunds makes a second payment impossible, even with two tabs.
 */
export async function ensureArena(userId: string): Promise<void> {
  const [hero, refunded] = await Promise.all([
    one("SELECT user_id FROM arena_heroes WHERE user_id = ?", [userId]),
    one("SELECT user_id FROM arena_refunds WHERE user_id = ?", [userId]),
  ]);
  if (hero && refunded) return;

  if (!hero) {
    const legacy = await one("SELECT color FROM arena_fighters WHERE user_id = ?", [userId]);
    const look = defaultLook(userId);
    const color = legacy ? LEGACY_COLOR_PALETTE[str(legacy.color)] : undefined;
    if (color !== undefined) look.palette = Math.min(color, speciesById(look.species)!.palettes.length - 1);
    await run("INSERT INTO arena_heroes (user_id, look, chosen, updated_at) VALUES (?, ?, 0, ?) ON CONFLICT DO NOTHING", [
      userId,
      JSON.stringify(look),
      nowIso(),
    ]);
  }

  if (!refunded) {
    await transaction(async () => {
      const amount = await combatGearSpent(userId);
      const claimed = await one("INSERT INTO arena_refunds (user_id, amount, created_at) VALUES (?, ?, ?) ON CONFLICT DO NOTHING RETURNING user_id", [
        userId,
        amount,
        nowIso(),
      ]);
      if (claimed && amount > 0) await addPoints(userId, amount, "Компенсация за снаряжение старой арены", "arena-refund");
    });
  }
}

export interface Hero {
  look: Look;
  /** False until the student picks a hero. */
  chosen: boolean;
}

export async function getHero(userId: string): Promise<Hero> {
  await ensureArena(userId);
  const row = await one("SELECT look, chosen FROM arena_heroes WHERE user_id = ?", [userId]);
  const checked = validateLook(json<unknown>(row?.look, null));
  return { look: checked.ok ? checked.look : defaultLook(userId), chosen: num(row?.chosen) === 1 };
}

export async function saveLook(userId: string, input: unknown): Promise<Result & { look?: Look }> {
  const checked = validateLook(input);
  if (!checked.ok) return { ok: false, error: checked.error };
  await ensureArena(userId);
  await run("UPDATE arena_heroes SET look = ?, chosen = 1, updated_at = ? WHERE user_id = ?", [JSON.stringify(checked.look), nowIso(), userId]);
  return { ok: true, look: checked.look };
}

// --------------------------------------------------------------- wardrobe --

export async function getOwned(userId: string): Promise<Set<string>> {
  const rows = await all("SELECT item_id FROM arena_wardrobe WHERE user_id = ?", [userId]);
  return new Set(rows.map((r) => str(r.item_id)));
}

export async function getOutfit(userId: string, owned?: Set<string>): Promise<Outfit> {
  const [row, have] = await Promise.all([one("SELECT items FROM arena_outfits WHERE user_id = ?", [userId]), owned ?? getOwned(userId)]);
  return cleanOutfit(json<unknown>(row?.items, {}), have);
}

async function saveOutfit(userId: string, outfit: Outfit): Promise<void> {
  await run(
    `INSERT INTO arena_outfits (user_id, items, updated_at) VALUES (?, ?, ?)
     ON CONFLICT (user_id) DO UPDATE SET items = excluded.items, updated_at = excluded.updated_at`,
    [userId, JSON.stringify(outfit), nowIso()],
  );
}

export interface Wardrobe {
  owned: string[];
  outfit: Outfit;
  balance: number;
}

export async function getWardrobe(userId: string): Promise<Wardrobe> {
  await ensureArena(userId);
  const owned = await getOwned(userId);
  const [outfit, points] = await Promise.all([getOutfit(userId, owned), balance(userId)]);
  return { owned: [...owned], outfit, balance: points };
}

export type PurchaseResult = { ok: true; balance: number } | { ok: false; error: string };

class Refused extends Error {}

/**
 * Buys an accessory. The hero row is locked first, so two purchases by the
 * same student run one after the other; the wardrobe row is the claim (an
 * item is paid for once), and the balance is checked after both, inside the
 * same transaction, so it can never go below zero.
 */
export async function buyItem(userId: string, itemId: string): Promise<PurchaseResult> {
  const it = shopItem(itemId);
  if (!it) return { ok: false, error: "Такого предмета нет." };
  await ensureArena(userId);
  try {
    return await transaction(async () => {
      await one("UPDATE arena_heroes SET updated_at = ? WHERE user_id = ? RETURNING user_id", [nowIso(), userId]);
      const claimed = await one(
        "INSERT INTO arena_wardrobe (user_id, item_id, price, bought_at) VALUES (?, ?, ?, ?) ON CONFLICT DO NOTHING RETURNING item_id",
        [userId, it.id, it.price, nowIso()],
      );
      if (!claimed) throw new Refused("Этот предмет уже куплен.");
      const points = await balance(userId);
      if (points < it.price) throw new Refused(`Недостаточно монет: нужно ещё ${it.price - points}.`);
      await addPoints(userId, -it.price, `Покупка: ${it.name}`, `shop:${it.id}`);
      return { ok: true as const, balance: points - it.price };
    });
  } catch (error) {
    if (error instanceof Refused) return { ok: false, error: error.message };
    throw error;
  }
}

export async function equipItem(userId: string, itemId: string): Promise<Result & { outfit?: Outfit }> {
  const it = shopItem(itemId);
  if (!it) return { ok: false, error: "Такого предмета нет." };
  const owned = await getOwned(userId);
  if (!owned.has(it.id)) return { ok: false, error: "Сначала купи этот предмет." };
  const outfit = { ...(await getOutfit(userId, owned)), [it.slot]: it.id };
  await saveOutfit(userId, outfit);
  return { ok: true, outfit };
}

export async function unequipSlot(userId: string, slot: string): Promise<Result & { outfit?: Outfit }> {
  if (!(SLOTS as string[]).includes(slot)) return { ok: false, error: "Такого места нет." };
  const outfit = { ...(await getOutfit(userId)) };
  delete outfit[slot as Slot];
  await saveOutfit(userId, outfit);
  return { ok: true, outfit };
}

/** A student as drawn on a race track or a results screen. */
export async function getRacer(userId: string): Promise<Racer> {
  const [hero, outfit, user] = await Promise.all([getHero(userId), getOutfit(userId), one("SELECT name FROM users WHERE id = ?", [userId])]);
  return { userId, name: str(user?.name, "Ученик"), look: hero.look, outfit: outfit as Record<string, string> };
}
