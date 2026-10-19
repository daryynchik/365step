import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { defaultLook, lookForSpecies, SPECIES, validateLook } from "./arena-rules";
import { CATEGORIES, cleanOutfit, PRICE_RANGES, SHOP_ITEMS, SLOTS } from "./shop-items";

describe("heroes", () => {
  it("keeps the fourteen heroes, each with palettes and features", () => {
    assert.deepEqual(
      SPECIES.map((s) => s.id),
      ["cat", "fox", "panda", "bear", "rabbit", "owl", "shark", "dragon", "slime", "monster", "alien", "robot", "cactus", "mushroom"],
    );
    for (const s of SPECIES) {
      assert.ok(s.palettes.length >= 5, s.id);
      assert.ok(s.features.length >= 2 && s.features.every((f) => f.options.length >= 2), s.id);
      assert.ok(validateLook(lookForSpecies(s.id)).ok, s.id);
    }
  });

  it("validates looks strictly", () => {
    const owl = { ...lookForSpecies("owl"), palette: 1, eyes: "sleepy", expression: "calm", features: { tufts: "none" } };
    const ok = validateLook(owl);
    assert.ok(ok.ok && ok.look.features.pattern === "scallop", "missing feature falls back to the default");
    assert.equal(validateLook({ ...owl, species: "human" }).ok, false);
    assert.equal(validateLook({ ...owl, palette: 1.5 }).ok, false);
    assert.equal(validateLook({ ...owl, eyes: "laser" }).ok, false);
    assert.equal(validateLook({ ...owl, expression: "angry" }).ok, false);
    assert.equal(validateLook({ ...owl, features: { tufts: "antlers" } }).ok, false);
    assert.equal(validateLook(null).ok, false);
    const extra = validateLook({ ...owl, features: { tufts: "horns", horns: "big" } });
    assert.ok(extra.ok && !("horns" in extra.look.features), "features of other species are dropped");
  });

  it("gives first-time heroes some variety", () => {
    const species = new Set(Array.from({ length: 60 }, (_, i) => defaultLook(`user-${i}`).species));
    assert.ok(species.size >= 8);
  });
});

describe("shop", () => {
  it("has at least 60 distinct items across every category and slot", () => {
    assert.ok(SHOP_ITEMS.length >= 60, `${SHOP_ITEMS.length} items`);
    assert.equal(new Set(SHOP_ITEMS.map((i) => i.id)).size, SHOP_ITEMS.length, "unique ids");
    assert.equal(new Set(SHOP_ITEMS.map((i) => i.name)).size, SHOP_ITEMS.length, "unique names");
    for (const c of CATEGORIES) assert.ok(SHOP_ITEMS.some((i) => i.category === c.id), c.id);
    for (const s of SLOTS) assert.ok(SHOP_ITEMS.some((i) => i.slot === s), s);
    for (const i of SHOP_ITEMS) {
      assert.ok(Number.isInteger(i.price) && i.price > 0, i.id);
      assert.ok(i.colors.length >= 1 && i.art, i.id);
    }
  });

  it("covers what was asked for", () => {
    const has = (art: string) => SHOP_ITEMS.some((i) => i.art.startsWith(art));
    for (const art of ["cap", "bucket", "beret", "crown", "party", "round", "sun", "star", "heart", "scarf", "bowtie", "headbow", "headphones", "backpack", "palette", "dots", "frame", "confetti"]) {
      assert.ok(has(art), art);
    }
    assert.ok(SHOP_ITEMS.filter((i) => i.slot === "background").length >= 5);
  });

  it("price filters cover every item exactly once", () => {
    const ranges = PRICE_RANGES.filter((r) => r.id !== "all");
    for (const i of SHOP_ITEMS) assert.equal(ranges.filter((r) => i.price >= r.min && i.price <= r.max).length, 1, i.id);
  });

  it("an outfit keeps only owned items in their own slot", () => {
    const owned = new Set(["cap-red", "sunglasses"]);
    assert.deepEqual(cleanOutfit({ head: "cap-red", face: "sunglasses", neck: "scarf-red", back: "cap-red", hand: "nonsense" }, owned), {
      head: "cap-red",
      face: "sunglasses",
    });
    assert.deepEqual(cleanOutfit("junk", owned), {});
  });
});
