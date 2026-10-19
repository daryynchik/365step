/**
 * The accessory shop. Every item is purely decorative: it changes how a hero
 * looks and nothing else — not race speed, question difficulty, rating or the
 * chance of winning. Items are bought with coins (the points earned on lessons
 * and in races) and drawn by components/arena/hero-accessories.tsx.
 */

export type Slot = "head" | "face" | "neck" | "chest" | "back" | "hand" | "color" | "pattern" | "background" | "frame" | "effect";

export const SLOTS: Slot[] = ["head", "face", "neck", "chest", "back", "hand", "color", "pattern", "background", "frame", "effect"];

export const SLOT_NAMES: Record<Slot, string> = {
  head: "Голова",
  face: "Очки",
  neck: "Шея",
  chest: "Значок",
  back: "Спина",
  hand: "В лапе",
  color: "Расцветка",
  pattern: "Узор",
  background: "Фон",
  frame: "Рамка",
  effect: "Празднование победы",
};

export type Category = "hats" | "glasses" | "neck" | "extras" | "colors" | "scenes" | "effects";

export const CATEGORIES: { id: Category; name: string }[] = [
  { id: "hats", name: "Головные уборы" },
  { id: "glasses", name: "Очки" },
  { id: "neck", name: "Шарфы, бантики, наушники" },
  { id: "extras", name: "Рюкзаки и дополнения" },
  { id: "colors", name: "Расцветки и узоры" },
  { id: "scenes", name: "Фоны и рамки" },
  { id: "effects", name: "Эффекты победы" },
];

export interface ShopItem {
  id: string;
  name: string;
  category: Category;
  slot: Slot;
  price: number;
  /** How to draw it: the renderer's shape, and its colours. */
  art: string;
  colors: string[];
}

const item = (id: string, name: string, category: Category, slot: Slot, price: number, art: string, ...colors: string[]): ShopItem => ({
  id,
  name,
  category,
  slot,
  price,
  art,
  colors,
});

export const SHOP_ITEMS: ShopItem[] = [
  // Hats
  item("cap-red", "Красная кепка", "hats", "head", 40, "cap", "#e2453c", "#a82b24"),
  item("cap-blue", "Синяя кепка", "hats", "head", 40, "cap", "#3a6fd8", "#24479a"),
  item("cap-365", "Кепка 365step", "hats", "head", 60, "cap-logo", "#2e7d4f", "#1f5a38", "#ffffff"),
  item("panama-sand", "Песочная панама", "hats", "head", 50, "bucket", "#e8d3a8", "#b89a63"),
  item("panama-flowers", "Панама с цветами", "hats", "head", 80, "bucket-flowers", "#f7c9da", "#cf8aa6", "#ffd84d"),
  item("beret-red", "Красный берет", "hats", "head", 60, "beret", "#c0392b", "#8a2318"),
  item("beret-navy", "Тёмно-синий берет", "hats", "head", 60, "beret", "#2c3e66", "#18243f"),
  item("crown-gold", "Золотая корона", "hats", "head", 300, "crown", "#f2c14e", "#a7771a", "#e0475b"),
  item("tiara-silver", "Серебряная тиара", "hats", "head", 220, "tiara", "#dfe5ec", "#7d8b9c", "#7ec8ff"),
  item("party-stripes", "Праздничный колпак", "hats", "head", 70, "party", "#ff6f91", "#ffd166", "#ffffff"),
  item("party-dots", "Колпак в горошек", "hats", "head", 70, "party-dots", "#5ec8f2", "#ffffff", "#ff9ad5"),
  item("top-hat", "Цилиндр", "hats", "head", 150, "tophat", "#2a2a33", "#c0392b"),
  item("wizard-hat", "Шляпа волшебника", "hats", "head", 180, "wizard", "#5a49c6", "#2b2180", "#ffd84d"),
  item("flower-crown", "Венок из цветов", "hats", "head", 120, "wreath", "#ff8fb1", "#ffd84d", "#6cc04a"),
  item("cowboy-hat", "Ковбойская шляпа", "hats", "head", 140, "cowboy", "#b07a45", "#6e4826"),
  item("grad-cap", "Шапочка выпускника", "hats", "head", 200, "mortarboard", "#24262d", "#f2c14e"),
  item("beanie", "Шапка с помпоном", "hats", "head", 70, "beanie", "#e2553f", "#ffffff"),

  // Glasses
  item("glasses-round", "Круглые очки", "glasses", "face", 40, "round", "#2a2230"),
  item("sunglasses", "Солнечные очки", "glasses", "face", 60, "sun", "#1d1c22", "#5b6b8a"),
  item("glasses-star", "Очки-звёздочки", "glasses", "face", 90, "star", "#f5c542", "#ffe9a6"),
  item("glasses-heart", "Очки-сердечки", "glasses", "face", 90, "heart", "#ff5f8a", "#ffc2d4"),
  item("glasses-square", "Квадратные очки", "glasses", "face", 50, "square", "#3a3a40"),
  item("glasses-3d", "3D-очки", "glasses", "face", 70, "3d", "#ffffff", "#e2453c", "#3a8fd8"),
  item("monocle", "Монокль", "glasses", "face", 110, "monocle", "#d4a72c"),

  // Scarves, bows, headphones
  item("scarf-red", "Красный шарф", "neck", "neck", 50, "scarf", "#e2453c", "#a82b24"),
  item("scarf-striped", "Полосатый шарф", "neck", "neck", 70, "scarf-stripes", "#3a6fd8", "#ffffff"),
  item("scarf-mint", "Мятный шарф", "neck", "neck", 50, "scarf", "#5fc7a6", "#2f8f72"),
  item("bowtie-red", "Красная бабочка", "neck", "neck", 40, "bowtie", "#c0392b", "#8a2318"),
  item("bowtie-black", "Чёрная бабочка", "neck", "neck", 40, "bowtie", "#24262d", "#000000"),
  item("bowtie-dots", "Бабочка в горошек", "neck", "neck", 60, "bowtie-dots", "#5e7ff0", "#ffffff"),
  item("bow-pink", "Розовый бантик", "neck", "head", 40, "headbow", "#ff7fb0", "#d24f86"),
  item("bow-blue", "Бантик в горошек", "neck", "head", 50, "headbow-dots", "#3a6fd8", "#ffffff"),
  item("headphones-white", "Белые наушники", "neck", "head", 120, "headphones", "#f4f4f2", "#4fd1ff", "#9aa3b0"),
  item("headphones-pink", "Розовые наушники", "neck", "head", 120, "headphones", "#ff9ad5", "#ffffff", "#c75497"),

  // Backpacks and other extras
  item("backpack-red", "Красный рюкзак", "extras", "back", 90, "backpack", "#e2453c", "#a82b24"),
  item("backpack-blue", "Синий рюкзак", "extras", "back", 90, "backpack", "#3a6fd8", "#24479a"),
  item("cape-red", "Красный плащ", "extras", "back", 160, "cape", "#c0392b", "#8a2318"),
  item("cape-stars", "Звёздный плащ", "extras", "back", 220, "cape-stars", "#2b2180", "#1a1450", "#ffd84d"),
  item("wings-angel", "Крылья ангела", "extras", "back", 250, "wings-angel", "#ffffff", "#c9d4e2"),
  item("wings-butterfly", "Крылья бабочки", "extras", "back", 200, "wings-butterfly", "#ff9ad5", "#7c6cf0", "#ffd84d"),
  item("medal", "Золотая медаль", "extras", "chest", 150, "medal", "#f2c14e", "#3a6fd8"),
  item("pin-star", "Значок-звезда", "extras", "chest", 40, "pin-star", "#f5c542"),
  item("pin-heart", "Значок-сердце", "extras", "chest", 40, "pin-heart", "#ff5f8a"),
  item("wand", "Волшебная палочка", "extras", "hand", 120, "wand", "#2a2230", "#ffd84d"),
  item("flag", "Флажок", "extras", "hand", 50, "flag", "#2e7d4f", "#ffffff"),
  item("ice-cream", "Мороженое", "extras", "hand", 40, "icecream", "#ffb3c7", "#d9a066"),
  item("book", "Книга", "extras", "hand", 50, "book", "#3a6fd8", "#ffffff"),
  item("balloon", "Воздушный шарик", "extras", "hand", 60, "balloon", "#ff5f8a"),
  item("pencil", "Большой карандаш", "extras", "hand", 40, "pencil", "#f5c542", "#ffb3c7"),
  item("lollipop", "Леденец", "extras", "hand", 40, "lollipop", "#ff6f91", "#7cc8ff"),

  // Colours and patterns
  item("color-gold", "Золотой", "colors", "color", 250, "palette", "#f2c14e", "#a7771a", "#fff3bf"),
  item("color-silver", "Серебряный", "colors", "color", 200, "palette", "#cfd6de", "#6f7e90", "#f7f9fc"),
  item("color-rainbow", "Радужный", "colors", "color", 300, "rainbow", "#ff6f91", "#ffd166", "#7ed957", "#5ec8f2", "#a97ff0"),
  item("color-galaxy", "Галактика", "colors", "color", 300, "galaxy", "#2b2180", "#140f3d", "#b8a8ff", "#ff9ad5"),
  item("color-neon", "Неоновый", "colors", "color", 180, "palette", "#39e98a", "#0a8f4a", "#d6ffe8"),
  item("color-mint-ice", "Мятное мороженое", "colors", "color", 150, "palette", "#a8e6cf", "#4fa98a", "#fff4f8"),
  item("color-caramel", "Карамель", "colors", "color", 150, "palette", "#d9a066", "#8a5a2b", "#fbe8d0"),
  item("pattern-dots", "Узор «Горошек»", "colors", "pattern", 80, "dots", "#ffffff"),
  item("pattern-stripes", "Узор «Полоски»", "colors", "pattern", 80, "stripes", "#ffffff"),
  item("pattern-stars", "Узор «Звёздочки»", "colors", "pattern", 100, "stars", "#fff6c2"),
  item("pattern-hearts", "Узор «Сердечки»", "colors", "pattern", 100, "hearts", "#ffd1dc"),
  item("pattern-zigzag", "Узор «Зигзаг»", "colors", "pattern", 80, "zigzag", "#ffffff"),

  // Backgrounds and frames
  item("bg-space", "Фон «Космос»", "scenes", "background", 150, "space", "#1b1d4a", "#3b2f7a"),
  item("bg-forest", "Фон «Лес»", "scenes", "background", 100, "forest", "#d8f0d0", "#5fae5a"),
  item("bg-beach", "Фон «Пляж»", "scenes", "background", 100, "beach", "#bfe8ff", "#f6dfa8"),
  item("bg-city", "Фон «Город»", "scenes", "background", 120, "city", "#ffd9b8", "#7d6fa8"),
  item("bg-library", "Фон «Библиотека»", "scenes", "background", 120, "library", "#f3e3c8", "#8a5a33"),
  item("bg-mountains", "Фон «Горы»", "scenes", "background", 100, "mountains", "#dcecff", "#7a8fb0"),
  item("bg-sunset", "Фон «Закат»", "scenes", "background", 90, "sunset", "#ffb36b", "#ff6f91"),
  item("bg-underwater", "Фон «Под водой»", "scenes", "background", 130, "underwater", "#7fd3f0", "#2a7fb8"),
  item("frame-gold", "Золотая рамка", "scenes", "frame", 120, "frame", "#f2c14e", "#a7771a"),
  item("frame-wood", "Деревянная рамка", "scenes", "frame", 60, "frame", "#b07a45", "#6e4826"),
  item("frame-neon", "Неоновая рамка", "scenes", "frame", 100, "frame-neon", "#ff5fd2", "#5ef2ff"),
  item("frame-flowers", "Цветочная рамка", "scenes", "frame", 110, "frame-flowers", "#7cc046", "#ff8fb1", "#ffd84d"),
  item("frame-stars", "Звёздная рамка", "scenes", "frame", 110, "frame-stars", "#5a49c6", "#ffd84d"),

  // Victory celebrations
  item("fx-confetti", "Конфетти", "effects", "effect", 120, "confetti", "#ff6f91", "#ffd166", "#5ec8f2", "#7ed957"),
  item("fx-fireworks", "Фейерверк", "effects", "effect", 180, "fireworks", "#ffd166", "#ff6f91", "#7cc8ff"),
  item("fx-hearts", "Сердечки", "effects", "effect", 100, "hearts", "#ff5f8a", "#ffb3c7"),
  item("fx-rainbow", "Радуга", "effects", "effect", 150, "rainbow", "#ff6f91", "#ffd166", "#7ed957", "#5ec8f2", "#a97ff0"),
  item("fx-bubbles", "Пузыри", "effects", "effect", 90, "bubbles", "#bfe8ff", "#ffffff"),
];

const BY_ID = new Map(SHOP_ITEMS.map((i) => [i.id, i]));

export function shopItem(id: string): ShopItem | undefined {
  return BY_ID.get(id);
}

export type Outfit = Partial<Record<Slot, string>>;

/** Keeps only items that exist, sit in the right slot and are owned. */
export function cleanOutfit(raw: unknown, owned: Set<string>): Outfit {
  const out: Outfit = {};
  if (!raw || typeof raw !== "object") return out;
  for (const [slot, id] of Object.entries(raw as Record<string, unknown>)) {
    const it = typeof id === "string" ? BY_ID.get(id) : undefined;
    if (it && it.slot === slot && owned.has(it.id)) out[it.slot] = it.id;
  }
  return out;
}

export const PRICE_RANGES = [
  { id: "all", name: "Любая цена", min: 0, max: Infinity },
  { id: "low", name: "До 50", min: 0, max: 50 },
  { id: "mid", name: "60–150", min: 51, max: 150 },
  { id: "high", name: "160–250", min: 151, max: 250 },
  { id: "top", name: "От 300", min: 251, max: Infinity },
] as const;
