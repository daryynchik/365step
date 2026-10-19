/**
 * Arena rules: heroes, gear, upgrades and the fight simulation.
 *
 * Pure and deterministic — a fight is fully described by the two fighters and
 * a seed — so the server simulates it once, stores the log, and the client can
 * replay exactly what happened.
 *
 * A hero's species and looks are cosmetic. Fight stats come only from the three
 * gear slots and their levels, so every species fights the same.
 */

// ---------------------------------------------------------------- heroes --

export type SpeciesId =
  | "cat"
  | "fox"
  | "panda"
  | "bear"
  | "rabbit"
  | "owl"
  | "shark"
  | "dragon"
  | "slime"
  | "monster"
  | "alien"
  | "robot"
  | "cactus"
  | "mushroom";

export interface Palette {
  name: string;
  /** Main fill. */
  main: string;
  /** Outline and shadows. */
  shade: string;
  /** Belly, muzzle, inner ears. */
  light: string;
  /** Species detail: nose, patches, horns, flower, screen glow… */
  accent: string;
}

export interface FeatureOption {
  id: string;
  name: string;
}

export interface Feature {
  id: string;
  name: string;
  options: FeatureOption[];
}

export interface Species {
  id: SpeciesId;
  name: string;
  group: "animals" | "fantasy" | "others";
  tagline: string;
  palettes: Palette[];
  features: Feature[];
}

const p = (name: string, main: string, shade: string, light: string, accent: string): Palette => ({ name, main, shade, light, accent });
const f = (id: string, name: string, options: [string, string][]): Feature => ({ id, name, options: options.map(([oid, oname]) => ({ id: oid, name: oname })) });

export const SPECIES: Species[] = [
  {
    id: "cat",
    name: "Кот",
    group: "animals",
    tagline: "Ловкий и любопытный",
    palettes: [
      p("Рыжий", "#f0a04b", "#b86a24", "#fff1dc", "#f28da0"),
      p("Серый", "#9aa3b0", "#5f6877", "#eef1f5", "#f2a1b2"),
      p("Чёрный", "#45414f", "#1f1d26", "#d9d4e3", "#f08aa0"),
      p("Сливочный", "#f3dfbf", "#c29d68", "#fffaf0", "#f3a0a8"),
      p("Сиреневый", "#b9a3e3", "#7b62b8", "#f4efff", "#ff9fc0"),
    ],
    features: [
      f("ears", "Уши", [["pointy", "Острые"], ["folded", "Вислые"], ["lynx", "С кисточками"]]),
      f("pattern", "Узор", [["stripes", "Полоски"], ["mask", "Белая мордочка"], ["plain", "Без узора"]]),
    ],
  },
  {
    id: "fox",
    name: "Лиса",
    group: "animals",
    tagline: "Хитрая и быстрая",
    palettes: [
      p("Огненная", "#ee7a2f", "#a9480f", "#fff3e6", "#3a2a24"),
      p("Арктическая", "#e9eef5", "#8e9bb0", "#ffffff", "#4a5568"),
      p("Чернобурая", "#4f4a57", "#24212a", "#e8e4ee", "#1d1b21"),
      p("Песочная", "#e9c58f", "#a97c42", "#fff6e6", "#7a5a3a"),
      p("Космическая", "#7c6cf0", "#4434b8", "#efeaff", "#2a2350"),
    ],
    features: [
      f("ears", "Уши", [["classic", "Классические"], ["fennec", "Огромные"]]),
      f("tail", "Хвост", [["bushy", "Пушистый"], ["twin", "Два хвоста"]]),
    ],
  },
  {
    id: "panda",
    name: "Панда",
    group: "animals",
    tagline: "Спокойная сила",
    palettes: [
      p("Классика", "#ffffff", "#9aa1ab", "#ffffff", "#2b2b30"),
      p("Шоколадная", "#fff6ea", "#b49d80", "#ffffff", "#5b3a29"),
      p("Ночная", "#eef1ff", "#97a1c9", "#ffffff", "#22305c"),
      p("Малиновая", "#fff0f3", "#d29aab", "#ffffff", "#b0335b"),
      p("Мятная", "#effaf5", "#8fc4ad", "#ffffff", "#1f6b57"),
    ],
    features: [
      f("ears", "Уши", [["round", "Круглые"], ["small", "Маленькие"]]),
      f("patches", "Пятна у глаз", [["classic", "Классика"], ["round", "Круглые"], ["heart", "Сердечки"]]),
    ],
  },
  {
    id: "bear",
    name: "Медведь",
    group: "animals",
    tagline: "Надёжный и добрый",
    palettes: [
      p("Бурый", "#a8693a", "#6a3e1d", "#e8c9a0", "#4a2c1a"),
      p("Белый", "#f1f1ee", "#a3a7ae", "#ffffff", "#3a3a40"),
      p("Медовый", "#e0a43a", "#9c6a14", "#fbe7b5", "#5a3a12"),
      p("Чёрный", "#47454c", "#1f1e23", "#c9b49a", "#111111"),
      p("Мармеладный", "#f5a3b8", "#c46682", "#ffe3ea", "#7a2d45"),
    ],
    features: [
      f("ears", "Уши", [["round", "Круглые"], ["small", "Маленькие"]]),
      f("pattern", "Узор", [["belly", "Светлое пузико"], ["moon", "Месяц на груди"], ["plain", "Без узора"]]),
    ],
  },
  {
    id: "rabbit",
    name: "Кролик",
    group: "animals",
    tagline: "Прыгучий и смелый",
    palettes: [
      p("Снежный", "#fbfaf7", "#b9b3a8", "#ffffff", "#f5a3b8"),
      p("Серый", "#b8b4ad", "#7a766f", "#efede8", "#f0a0b4"),
      p("Шоколадный", "#8b5e45", "#56362a", "#e9d3c3", "#f3a3b5"),
      p("Персиковый", "#f6c3a0", "#cf8a5e", "#fff1e6", "#f08aa0"),
      p("Лавандовый", "#c9b8f0", "#8a72c8", "#f6f1ff", "#ff9cc4"),
    ],
    features: [
      f("ears", "Уши", [["up", "Торчком"], ["lop", "Висячие"], ["mixed", "Одно вниз"]]),
      f("pattern", "Узор", [["blush", "Румянец"], ["spots", "Пятнышки"], ["plain", "Без узора"]]),
    ],
  },
  {
    id: "owl",
    name: "Сова",
    group: "animals",
    tagline: "Мудрая и зоркая",
    palettes: [
      p("Лесная", "#9c6b45", "#5e3c22", "#f2dfc4", "#f2a33a"),
      p("Снежная", "#f4f4f2", "#a9b0ba", "#ffffff", "#f2b33a"),
      p("Ночная", "#4b5a8a", "#28325a", "#d9e0f5", "#f5c542"),
      p("Рыжая", "#d9813f", "#94501c", "#fbe3c8", "#f5c542"),
      p("Мятная", "#6fbfa6", "#3a8670", "#e2f6ef", "#f5b53f"),
    ],
    features: [
      f("tufts", "Пёрышки", [["horns", "Пучки-ушки"], ["none", "Гладкая макушка"]]),
      f("pattern", "Узор", [["scallop", "Чешуйки"], ["dots", "Точки"], ["plain", "Без узора"]]),
    ],
  },
  {
    id: "shark",
    name: "Акула",
    group: "animals",
    tagline: "Напористая и бесстрашная",
    palettes: [
      p("Морская", "#6e8fab", "#3f5d78", "#f3f6f9", "#e9505a"),
      p("Тигровая", "#8a9a6a", "#56653b", "#f4f2e6", "#e9505a"),
      p("Неоновая", "#3fb6d6", "#16799a", "#e8fbff", "#ff5f8a"),
      p("Тёмная", "#465063", "#222834", "#dfe3ea", "#e94f5a"),
      p("Розовая", "#f08cb0", "#b85479", "#fff0f5", "#7a2d45"),
    ],
    features: [
      f("fin", "Плавник", [["classic", "Классический"], ["tall", "Высокий"], ["jagged", "Зубчатый"]]),
      f("pattern", "Узор", [["plain", "Без узора"], ["stripes", "Тигровые полосы"], ["spots", "Пятнышки"]]),
    ],
  },
  {
    id: "dragon",
    name: "Дракон",
    group: "fantasy",
    tagline: "Огонь в маленьком сердце",
    palettes: [
      p("Изумрудный", "#3fae6a", "#226b42", "#f5e6a8", "#f2c94c"),
      p("Огненный", "#e2553f", "#982f20", "#ffd9a0", "#f2c94c"),
      p("Лазурный", "#4a86e8", "#2551a3", "#cfe7ff", "#ffd166"),
      p("Аметистовый", "#8f5fd6", "#57319a", "#f0e1ff", "#ffd166"),
      p("Золотой", "#e5b33b", "#9c7012", "#fff1c4", "#c0442f"),
    ],
    features: [
      f("horns", "Рога", [["curved", "Изогнутые"], ["straight", "Прямые"], ["triple", "Три рожка"]]),
      f("wings", "Крылья", [["small", "Маленькие"], ["big", "Большие"], ["none", "Без крыльев"]]),
    ],
  },
  {
    id: "slime",
    name: "Слизень",
    group: "fantasy",
    tagline: "Мягкий, но упрямый",
    palettes: [
      p("Лаймовый", "#7ed957", "#3f9a22", "#d7f7c6", "#2f7a1a"),
      p("Ягодный", "#ff6f91", "#c93a5f", "#ffd1dc", "#a3214a"),
      p("Голубой", "#5ec8f2", "#2389b8", "#d6f3ff", "#1f6f99"),
      p("Медовый", "#ffc24a", "#c88710", "#ffeec2", "#a3660a"),
      p("Фиолетовый", "#a97ff0", "#6c43c4", "#ece2ff", "#4b2a8f"),
    ],
    features: [
      f("top", "Макушка", [["drip", "Капля"], ["bubbles", "Пузыри"], ["leaf", "Листик"]]),
      f("pattern", "Узор", [["bubbles", "Пузырьки внутри"], ["sparkle", "Блёстки"], ["plain", "Без узора"]]),
    ],
  },
  {
    id: "monster",
    name: "Монстрик",
    group: "fantasy",
    tagline: "Пушистый и громкий",
    palettes: [
      p("Фиолетовый", "#8b6fe0", "#5233b0", "#d9cffa", "#ffd166"),
      p("Бирюзовый", "#38c2b0", "#167a6c", "#c8f3ec", "#ffd166"),
      p("Оранжевый", "#f39a3c", "#b0600f", "#ffe3c2", "#5a3dd6"),
      p("Розовый", "#ff7fb0", "#c84a7e", "#ffd9e8", "#6bd6ff"),
      p("Травяной", "#7cc046", "#4a8420", "#e1f5cf", "#ff8a3d"),
    ],
    features: [
      f("horns", "Рога", [["small", "Рожки"], ["big", "Большие рога"], ["none", "Без рогов"]]),
      f("pattern", "Узор", [["spots", "Пятна"], ["belly", "Светлое пузо"], ["plain", "Без узора"]]),
    ],
  },
  {
    id: "alien",
    name: "Инопланетянин",
    group: "fantasy",
    tagline: "Прилетел учиться",
    palettes: [
      p("Зелёный", "#7ed36f", "#3f8a32", "#e1f7d9", "#2f2a4a"),
      p("Голубой", "#7fc8ff", "#3a7fc2", "#e3f3ff", "#22305c"),
      p("Розовый", "#ff9ad5", "#c75497", "#ffe6f4", "#3a2348"),
      p("Сиреневый", "#b59cff", "#7656d6", "#efe9ff", "#2a2350"),
      p("Лунный", "#b9c2cc", "#6f7a87", "#eef1f4", "#1d1b21"),
    ],
    features: [
      f("antenna", "Антенны", [["two", "Две"], ["one", "Одна"], ["none", "Без антенн"]]),
      f("pattern", "Узор", [["spots", "Пятнышки"], ["stripes", "Полоски"], ["plain", "Без узора"]]),
    ],
  },
  {
    id: "robot",
    name: "Робот",
    group: "others",
    tagline: "Точен до последнего болта",
    palettes: [
      p("Сталь", "#b9c3cf", "#5f6b7a", "#e8edf2", "#4fd1ff"),
      p("Медь", "#d08a52", "#8a4f26", "#f3d6bd", "#ffd166"),
      p("Мятный", "#7fd6c2", "#3e9884", "#dff6f0", "#ff6b8a"),
      p("Красный", "#e2554a", "#9c2c24", "#ffd6d0", "#7cf0ff"),
      p("Графит", "#4b5563", "#1f252e", "#c9d1db", "#7cff9a"),
    ],
    features: [
      f("antenna", "Антенна", [["bolt", "Молния"], ["dish", "Тарелка"], ["bulb", "Лампочка"]]),
      f("panel", "Корпус", [["screen", "Экран-сердце"], ["gears", "Шестерёнки"], ["vents", "Решётка"]]),
    ],
  },
  {
    id: "cactus",
    name: "Кактус",
    group: "others",
    tagline: "Колючий снаружи, добрый внутри",
    palettes: [
      p("Зелёный", "#5fae5a", "#2f7a2e", "#d8f0c8", "#ff8fb1"),
      p("Голубой", "#5fa8a0", "#2f6f68", "#d4efe9", "#ffd166"),
      p("Лесной", "#3f7f4f", "#1f4f2b", "#cbe6c4", "#ff7a5c"),
      p("Лаймовый", "#9fd45a", "#5f9420", "#ecf8d4", "#d87bff"),
      p("Опунция", "#8a7fd0", "#5246a0", "#e6e1fa", "#ffd166"),
    ],
    features: [
      f("flower", "Цветок", [["one", "Один цветок"], ["three", "Три цветка"], ["none", "Без цветка"]]),
      f("spines", "Колючки", [["few", "Редкие"], ["many", "Густые"], ["fluff", "Пушинки"]]),
    ],
  },
  {
    id: "mushroom",
    name: "Гриб",
    group: "others",
    tagline: "Тихий, но с характером",
    palettes: [
      p("Мухомор", "#e2453c", "#9e2620", "#fbf1df", "#ffffff"),
      p("Боровик", "#a86a3c", "#6a3e1d", "#f6e7cf", "#f3d9b0"),
      p("Лисичка", "#f2b33a", "#b07a10", "#fff1d0", "#fff6dd"),
      p("Волшебный", "#5e7ff0", "#3048b0", "#efeaff", "#d6f7ff"),
      p("Мятный", "#5fc7a6", "#2f8f72", "#f4fbf6", "#ffffff"),
    ],
    features: [
      f("cap", "Шляпка", [["round", "Круглая"], ["pointy", "Острая"], ["flat", "Плоская"]]),
      f("pattern", "Узор", [["spots", "Пятна"], ["rings", "Кольца"], ["plain", "Однотонная"]]),
    ],
  },
];

export const SPECIES_GROUPS = [
  { id: "animals", name: "Животные" },
  { id: "fantasy", name: "Фантастические существа" },
  { id: "others", name: "Другие герои" },
] as const;

export const EYES = [
  { id: "round", name: "Круглые" },
  { id: "sparkle", name: "Сияющие" },
  { id: "sleepy", name: "Сонные" },
  { id: "sharp", name: "Хитрые" },
  { id: "button", name: "Бусинки" },
] as const;

export const EXPRESSIONS = [
  { id: "smile", name: "Улыбка" },
  { id: "grin", name: "Радость" },
  { id: "smirk", name: "Ухмылка" },
  { id: "fierce", name: "Боевой настрой" },
  { id: "calm", name: "Спокойствие" },
  { id: "surprised", name: "Удивление" },
] as const;

export type EyeStyle = (typeof EYES)[number]["id"];
export type Expression = (typeof EXPRESSIONS)[number]["id"];

export interface Look {
  species: SpeciesId;
  /** Index into the species' palettes. */
  palette: number;
  eyes: EyeStyle;
  expression: Expression;
  /** Feature id → option id, for the features of this species. */
  features: Record<string, string>;
}

export function speciesById(id: string): Species | undefined {
  return SPECIES.find((s) => s.id === id);
}

export function defaultFeatures(species: Species): Record<string, string> {
  return Object.fromEntries(species.features.map((ft) => [ft.id, ft.options[0].id]));
}

/** A look for this species that keeps whatever of `from` still applies. */
export function lookForSpecies(id: SpeciesId, from?: Partial<Look>): Look {
  const species = speciesById(id)!;
  return {
    species: id,
    palette: from?.palette !== undefined && from.palette < species.palettes.length ? from.palette : 0,
    eyes: from?.eyes ?? "round",
    expression: from?.expression ?? "smile",
    features: defaultFeatures(species),
  };
}

function hash(text: string): number {
  return [...text].reduce((h, ch) => (Math.imul(h, 31) + ch.charCodeAt(0)) >>> 0, 7);
}

/** The hero someone has before choosing one: varied, so friends do not all look alike. */
export function defaultLook(seed: string): Look {
  const h = hash(seed);
  const species = SPECIES[h % SPECIES.length];
  return { ...lookForSpecies(species.id), palette: (h >>> 8) % species.palettes.length };
}

export type LookCheck = { ok: true; look: Look } | { ok: false; error: string };

/** Strict check of a look sent by a client. Missing features fall back to defaults. */
export function validateLook(input: unknown): LookCheck {
  if (!input || typeof input !== "object") return { ok: false, error: "Не удалось прочитать внешность." };
  const raw = input as Record<string, unknown>;
  const species = speciesById(String(raw.species));
  if (!species) return { ok: false, error: "Такого героя нет." };
  const palette = raw.palette;
  if (typeof palette !== "number" || !Number.isInteger(palette) || palette < 0 || palette >= species.palettes.length) {
    return { ok: false, error: "Такой расцветки нет." };
  }
  if (!EYES.some((e) => e.id === raw.eyes)) return { ok: false, error: "Таких глаз нет." };
  if (!EXPRESSIONS.some((e) => e.id === raw.expression)) return { ok: false, error: "Такого выражения нет." };
  const given = raw.features && typeof raw.features === "object" ? (raw.features as Record<string, unknown>) : {};
  const features: Record<string, string> = {};
  for (const ft of species.features) {
    const value = given[ft.id];
    if (value === undefined) features[ft.id] = ft.options[0].id;
    else if (typeof value === "string" && ft.options.some((o) => o.id === value)) features[ft.id] = value;
    else return { ok: false, error: `Такой детали «${ft.name}» нет у этого героя.` };
  }
  return {
    ok: true,
    look: { species: species.id, palette, eyes: raw.eyes as EyeStyle, expression: raw.expression as Expression, features },
  };
}

// ------------------------------------------------------------------- gear --

export type Slot = "sword" | "helmet" | "armor";
export const SLOTS: Slot[] = ["sword", "helmet", "armor"];
export type Gear = Record<Slot, number>;

export const MAX_GEAR_LEVEL = 20;
export const STARTER_GEAR: Gear = { sword: 1, helmet: 1, armor: 1 };

export type TierId = "simple" | "iron" | "steel" | "magic" | "legendary";

/** Every few levels the item gets a new look. */
export const TIERS: { id: TierId; from: number; masculine: string; feminine: string }[] = [
  { id: "simple", from: 1, masculine: "Простой", feminine: "Простая" },
  { id: "iron", from: 5, masculine: "Железный", feminine: "Железная" },
  { id: "steel", from: 9, masculine: "Стальной", feminine: "Стальная" },
  { id: "magic", from: 13, masculine: "Магический", feminine: "Магическая" },
  { id: "legendary", from: 17, masculine: "Легендарный", feminine: "Легендарная" },
];

export const SLOT_INFO: Record<Slot, { noun: string; feminine: boolean; effect: string }> = {
  sword: { noun: "меч", feminine: false, effect: "Повышает атаку" },
  helmet: { noun: "шлем", feminine: false, effect: "Повышает защиту" },
  armor: { noun: "броня", feminine: true, effect: "Повышает защиту и здоровье" },
};

export function tierIndex(level: number): number {
  let index = 0;
  TIERS.forEach((t, i) => {
    if (level >= t.from) index = i;
  });
  return index;
}

export function tierOf(level: number): TierId {
  return TIERS[tierIndex(level)].id;
}

export function itemName(slot: Slot, level: number): string {
  const tier = TIERS[tierIndex(level)];
  const info = SLOT_INFO[slot];
  return `${info.feminine ? tier.feminine : tier.masculine} ${info.noun}`;
}

/** The level at which the item next changes its look, if any. */
export function nextTierLevel(level: number): number | null {
  return TIERS.find((t) => t.from > level)?.from ?? null;
}

/** Points to raise an item from `level` to `level + 1`. */
export function upgradeCost(level: number): number {
  return Math.round((30 * Math.pow(1.2, level - 1)) / 5) * 5;
}

export interface SlotBonus {
  attack: number;
  defense: number;
  hp: number;
  crit: number;
  block: number;
}

/** What one item adds at a given level. */
export function slotBonus(slot: Slot, level: number): SlotBonus {
  const tier = tierIndex(level);
  const none = { attack: 0, defense: 0, hp: 0, crit: 0, block: 0 };
  switch (slot) {
    // A new look (every few levels) adds a small extra on top of the level.
    case "sword":
      return { ...none, attack: 2 * level + tier, crit: 0.01 * tier };
    case "helmet":
      return { ...none, defense: level + Math.floor(tier / 2), block: 0.01 * tier };
    case "armor":
      return { ...none, defense: Math.ceil(level / 2) + Math.floor(tier / 2), hp: 8 * level + 4 * tier };
  }
}

export interface FighterStats {
  hp: number;
  attack: number;
  defense: number;
  crit: number;
  block: number;
}

export const BASE_STATS: FighterStats = { hp: 120, attack: 16, defense: 0, crit: 0.08, block: 0.06 };

/** Fight stats. Only the gear counts: species, looks and study level do not. */
export function statsFor(gear: Gear): FighterStats {
  const s = { ...BASE_STATS };
  for (const slot of SLOTS) {
    const b = slotBonus(slot, gear[slot]);
    s.hp += b.hp;
    s.attack += b.attack;
    s.defense += b.defense;
    s.crit += b.crit;
    s.block += b.block;
  }
  s.crit = Math.round(s.crit * 100) / 100;
  s.block = Math.round(s.block * 100) / 100;
  return s;
}

/** One number to compare fighters by, shown next to friends in the arena. */
export function powerRating(gear: Gear): number {
  const s = statsFor(gear);
  return Math.round(s.hp / 4 + s.attack * 3 * (1 + s.crit) + s.defense * 4 * (1 + s.block));
}

export function isSlot(value: string): value is Slot {
  return (SLOTS as string[]).includes(value);
}

export function isGearLevel(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= MAX_GEAR_LEVEL;
}

// ------------------------------------------------- the old arena, migrated --

/**
 * The first arena sold weapons and shields. Points spent there are turned into
 * levels of the new gear, so nobody loses what they bought: weapons become
 * sword levels, shields become helmet and armor levels.
 */
export const LEGACY_PRICES: Record<string, { kind: "weapon" | "shield"; price: number }> = {
  "bronze-dagger": { kind: "weapon", price: 80 },
  "iron-sword": { kind: "weapon", price: 180 },
  "battle-axe": { kind: "weapon", price: 320 },
  "war-hammer": { kind: "weapon", price: 520 },
  "dawn-blade": { kind: "weapon", price: 800 },
  "leather-buckler": { kind: "shield", price: 70 },
  "iron-shield": { kind: "shield", price: 160 },
  "kite-shield": { kind: "shield", price: 300 },
  "tower-shield": { kind: "shield", price: 480 },
  "aegis": { kind: "shield", price: 750 },
};

/** Levels bought with `budget` points across `slots`, cheapest next level first. */
function levelsFor(budget: number, slots: Slot[], gear: Gear): void {
  let left = budget;
  for (;;) {
    const slot = [...slots].sort((a, b) => upgradeCost(gear[a]) - upgradeCost(gear[b]))[0];
    if (gear[slot] >= MAX_GEAR_LEVEL) return;
    const cost = upgradeCost(gear[slot]);
    // Round to the nearest level: a remainder of half a level or more still counts.
    if (left < cost / 2) return;
    left -= cost;
    gear[slot]++;
  }
}

export function gearFromLegacy(itemIds: string[]): Gear {
  const gear = { ...STARTER_GEAR };
  let weapons = 0;
  let shields = 0;
  for (const id of itemIds) {
    const legacy = LEGACY_PRICES[id];
    if (!legacy) continue;
    if (legacy.kind === "weapon") weapons += legacy.price;
    else shields += legacy.price;
  }
  levelsFor(weapons, ["sword"], gear);
  levelsFor(shields, ["helmet", "armor"], gear);
  return gear;
}

const LEGACY_COLORS: Record<string, number> = { blue: 0, green: 1, red: 2, amber: 3, violet: 4, slate: 1 };

// --------------------------------------------------------------- fighters --

/** Everything the simulation and the drawing need to know about one side. */
export interface Fighter {
  userId: string;
  name: string;
  /** Study level, shown next to the name. It does not change fight stats. */
  level: number;
  look: Look;
  gear: Gear;
}

/**
 * A fighter as stored in a duel. Duels from the first arena saved a colour, a
 * weapon and a shield; they are shown with a default hero and the gear those
 * items convert to.
 */
export function normalizeFighter(raw: unknown): Fighter {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const userId = typeof r.userId === "string" ? r.userId : "unknown";
  const checked = validateLook(r.look);
  let look: Look;
  if (checked.ok) look = checked.look;
  else {
    look = defaultLook(userId);
    const color = typeof r.color === "string" ? LEGACY_COLORS[r.color] : undefined;
    if (color !== undefined) look.palette = Math.min(color, speciesById(look.species)!.palettes.length - 1);
  }
  const g = (r.gear && typeof r.gear === "object" ? r.gear : null) as Record<string, unknown> | null;
  const gear: Gear =
    g && SLOTS.every((s) => isGearLevel(g[s]))
      ? { sword: g.sword as number, helmet: g.helmet as number, armor: g.armor as number }
      : gearFromLegacy([r.weapon, r.shield].filter((x): x is string => typeof x === "string"));
  return {
    userId,
    name: typeof r.name === "string" ? r.name : "Игрок",
    level: typeof r.level === "number" ? r.level : 1,
    look,
    gear,
  };
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

export function simulate(a: Pick<Fighter, "gear">, b: Pick<Fighter, "gear">, seed: number): FightResult {
  const roll = rng(seed);
  const stats = [statsFor(a.gear), statsFor(b.gear)] as const;
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

    let damage = me.attack * variance * (crit ? 1.6 : 1) - them.defense * 0.5;
    if (blocked) damage *= 0.4;
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
