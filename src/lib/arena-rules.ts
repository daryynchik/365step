/**
 * Arena rules: the shop, fighter stats and the fight simulation.
 *
 * Pure and deterministic — a fight is fully described by the two fighters and
 * a seed — so the server simulates it once, stores the log, and the client can
 * replay exactly what happened.
 */

export type ItemKind = "weapon" | "shield";

export interface ArenaItem {
  id: string;
  kind: ItemKind;
  name: string;
  price: number;
  /** Weapons: added to attack. Shields: damage absorbed per hit. */
  power: number;
  /** Weapons: chance of a critical hit. Shields: chance of blocking most of a hit. */
  chance: number;
  /** Which 3D model to draw. */
  model: string;
  description: string;
}

export const ITEMS: ArenaItem[] = [
  { id: "wooden-sword", kind: "weapon", name: "Деревянный меч", price: 0, power: 2, chance: 0.05, model: "sword-wood", description: "С него начинают все." },
  { id: "bronze-dagger", kind: "weapon", name: "Бронзовый кинжал", price: 80, power: 3, chance: 0.15, model: "dagger", description: "Лёгкий, чаще бьёт в уязвимое место." },
  { id: "iron-sword", kind: "weapon", name: "Железный меч", price: 180, power: 5, chance: 0.08, model: "sword-iron", description: "Надёжная классика." },
  { id: "battle-axe", kind: "weapon", name: "Боевой топор", price: 320, power: 7, chance: 0.1, model: "axe", description: "Тяжёлый удар, который трудно удержать." },
  { id: "war-hammer", kind: "weapon", name: "Боевой молот", price: 520, power: 9, chance: 0.12, model: "hammer", description: "Пробивает почти любую защиту." },
  { id: "dawn-blade", kind: "weapon", name: "Клинок рассвета", price: 800, power: 11, chance: 0.18, model: "sword-dawn", description: "Для тех, кто прошёл весь путь." },

  { id: "plank-shield", kind: "shield", name: "Щит из досок", price: 0, power: 1, chance: 0.05, model: "shield-plank", description: "Лучше, чем ничего." },
  { id: "leather-buckler", kind: "shield", name: "Кожаный баклер", price: 70, power: 2, chance: 0.14, model: "buckler", description: "Маленький, но ловкий." },
  { id: "iron-shield", kind: "shield", name: "Железный щит", price: 160, power: 3, chance: 0.1, model: "shield-round", description: "Держит удар." },
  { id: "kite-shield", kind: "shield", name: "Каплевидный щит", price: 300, power: 4, chance: 0.13, model: "shield-kite", description: "Закрывает от плеча до колена." },
  { id: "tower-shield", kind: "shield", name: "Башенный щит", price: 480, power: 5, chance: 0.16, model: "shield-tower", description: "Стена, которую носят с собой." },
  { id: "aegis", kind: "shield", name: "Эгида", price: 750, power: 6, chance: 0.2, model: "shield-aegis", description: "Щит, о котором пишут легенды." },
];

export const DEFAULT_WEAPON = "wooden-sword";
export const DEFAULT_SHIELD = "plank-shield";

export function item(id: string): ArenaItem {
  return ITEMS.find((i) => i.id === id) ?? ITEMS[0];
}

export const COLORS = {
  blue: { name: "Синий", hex: "#3b6fd8" },
  green: { name: "Зелёный", hex: "#2f9e62" },
  red: { name: "Красный", hex: "#d1493f" },
  amber: { name: "Янтарный", hex: "#d8932b" },
  violet: { name: "Фиолетовый", hex: "#7b5cd6" },
  slate: { name: "Графит", hex: "#4b5563" },
} as const;

export type FighterColor = keyof typeof COLORS;

export function isColor(value: string): value is FighterColor {
  return value in COLORS;
}

/** Everything the simulation and the 3D scene need to know about one side. */
export interface Fighter {
  userId: string;
  name: string;
  level: number;
  color: FighterColor;
  weapon: string;
  shield: string;
}

export interface FighterStats {
  hp: number;
  attack: number;
  armor: number;
  crit: number;
  block: number;
}

export function statsFor(f: Pick<Fighter, "level" | "weapon" | "shield">): FighterStats {
  const weapon = item(f.weapon);
  const shield = item(f.shield);
  return {
    hp: 120 + 8 * (f.level - 1),
    attack: 18 + weapon.power + Math.floor(f.level / 2),
    armor: shield.power,
    crit: weapon.chance,
    block: shield.chance,
  };
}

/** One number to compare fighters by, shown next to friends in the arena. */
export function powerRating(f: Pick<Fighter, "level" | "weapon" | "shield">): number {
  const s = statsFor(f);
  return Math.round(s.hp / 4 + s.attack * 3 * (1 + s.crit) + s.armor * 4 * (1 + s.block));
}

// ------------------------------------------------------------ simulation --

export interface Hit {
  /** 0 = attacker (the one who started the fight), 1 = defender. */
  by: 0 | 1;
  damage: number;
  crit: boolean;
  blocked: boolean;
  miss: boolean;
  /** Both sides' HP after this hit. */
  hp: [number, number];
}

export interface FightResult {
  hits: Hit[];
  /** 0, 1, or null for a draw (both standing after the round limit, equal HP share). */
  winner: 0 | 1 | null;
  maxHp: [number, number];
}

const MAX_HITS = 40;
const MISS_CHANCE = 0.12;

/** mulberry32 — tiny, fast, good enough for game rolls, identical everywhere. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function simulate(a: Fighter, b: Fighter, seed: number): FightResult {
  const roll = rng(seed);
  const stats = [statsFor(a), statsFor(b)] as const;
  const hp: [number, number] = [stats[0].hp, stats[1].hp];
  const maxHp: [number, number] = [stats[0].hp, stats[1].hp];
  const hits: Hit[] = [];

  // A coin toss decides who swings first; after that, sides alternate.
  let turn: 0 | 1 = roll() < 0.5 ? 0 : 1;
  while (hits.length < MAX_HITS && hp[0] > 0 && hp[1] > 0) {
    const me = stats[turn];
    const them = stats[turn === 0 ? 1 : 0];
    const target: 0 | 1 = turn === 0 ? 1 : 0;

    if (roll() < MISS_CHANCE) {
      hits.push({ by: turn, damage: 0, crit: false, blocked: false, miss: true, hp: [hp[0], hp[1]] });
      turn = target;
      continue;
    }

    const variance = 0.7 + roll() * 0.6;
    const crit = roll() < me.crit;
    const blocked = roll() < them.block;

    let damage = me.attack * variance * (crit ? 1.6 : 1) - them.armor * 0.6;
    if (blocked) damage *= 0.35;
    damage = Math.max(1, Math.round(damage));

    hp[target] = Math.max(0, hp[target] - damage);
    hits.push({ by: turn, damage, crit, blocked, miss: false, hp: [hp[0], hp[1]] });
    turn = target;
  }

  let winner: 0 | 1 | null;
  if (hp[1] === 0) winner = 0;
  else if (hp[0] === 0) winner = 1;
  else {
    const share = [hp[0] / maxHp[0], hp[1] / maxHp[1]];
    winner = share[0] === share[1] ? null : share[0] > share[1] ? 0 : 1;
  }
  return { hits, winner, maxHp };
}

/** Points for a fight. Only the first few fights a day pay out, to stop farming. */
export const FIGHT_REWARD = { win: 15, draw: 8, loss: 4 } as const;
export const REWARDED_FIGHTS_PER_DAY = 5;
