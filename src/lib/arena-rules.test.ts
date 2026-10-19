import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  defaultLook,
  gearFromLegacy,
  itemName,
  lookForSpecies,
  MAX_GEAR_LEVEL,
  nextTierLevel,
  normalizeFighter,
  powerRating,
  simulate,
  SLOTS,
  SPECIES,
  STARTER_GEAR,
  statsFor,
  tierOf,
  upgradeCost,
  validateLook,
  type Fighter,
} from "./arena-rules";

const fighter = (species: (typeof SPECIES)[number]["id"], gear = STARTER_GEAR, level = 1): Fighter => ({
  userId: species,
  name: species,
  level,
  look: lookForSpecies(species),
  gear,
});

describe("heroes", () => {
  it("has the fourteen heroes asked for, each with palettes and features", () => {
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

  it("species, looks and study level never change fight stats or the fight itself", () => {
    const gear = { sword: 7, helmet: 4, armor: 9 };
    const reference = simulate(fighter("cat", gear, 1), fighter("robot", gear, 1), 42);
    for (const a of SPECIES) {
      for (const b of SPECIES) {
        assert.deepEqual(simulate(fighter(a.id, gear, 3), fighter(b.id, gear, 17), 42), reference);
      }
    }
  });

  it("validates looks strictly", () => {
    const owl = { ...lookForSpecies("owl"), palette: 1, eyes: "sleepy", expression: "calm", features: { tufts: "none" } };
    const ok = validateLook(owl);
    assert.ok(ok.ok && ok.look.features.pattern === "scallop", "missing feature falls back to the default");
    assert.equal(validateLook({ ...owl, species: "human" }).ok, false);
    assert.equal(validateLook({ ...owl, palette: 1.5 }).ok, false);
    assert.equal(validateLook({ ...owl, palette: -1 }).ok, false);
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
    for (let i = 0; i < 60; i++) assert.ok(validateLook(defaultLook(`user-${i}`)).ok);
  });
});

describe("gear", () => {
  it("changes its look at levels 5, 9, 13 and 17", () => {
    assert.deepEqual([1, 4, 5, 8, 9, 12, 13, 16, 17, 20].map(tierOf), ["simple", "simple", "iron", "iron", "steel", "steel", "magic", "magic", "legendary", "legendary"]);
    assert.equal(itemName("sword", 1), "Простой меч");
    assert.equal(itemName("armor", 9), "Стальная броня");
    assert.equal(itemName("helmet", 20), "Легендарный шлем");
    assert.equal(nextTierLevel(6), 9);
    assert.equal(nextTierLevel(18), null);
  });

  it("costs more at every level and stays a long goal", () => {
    for (let l = 1; l < MAX_GEAR_LEVEL - 1; l++) assert.ok(upgradeCost(l + 1) > upgradeCost(l), `level ${l}`);
    assert.equal(upgradeCost(1), 30);
    const total = SLOTS.length * Array.from({ length: MAX_GEAR_LEVEL - 1 }, (_, i) => upgradeCost(i + 1)).reduce((a, b) => a + b, 0);
    assert.ok(total > 10000 && total < 20000, `all gear to the top: ${total} points`);
  });

  it("sword raises attack, helmet defence, armour defence and health", () => {
    const base = statsFor(STARTER_GEAR);
    const sword = statsFor({ ...STARTER_GEAR, sword: 10 });
    const helmet = statsFor({ ...STARTER_GEAR, helmet: 10 });
    const armor = statsFor({ ...STARTER_GEAR, armor: 10 });
    assert.ok(sword.attack > base.attack && sword.defense === base.defense && sword.hp === base.hp);
    assert.ok(helmet.defense > base.defense && helmet.attack === base.attack && helmet.hp === base.hp);
    assert.ok(armor.defense > base.defense && armor.hp > base.hp && armor.attack === base.attack);
    for (const slot of SLOTS) {
      for (let l = 1; l < MAX_GEAR_LEVEL; l++) {
        assert.ok(powerRating({ ...STARTER_GEAR, [slot]: l + 1 }) > powerRating({ ...STARTER_GEAR, [slot]: l }), `${slot} ${l}`);
      }
    }
  });

  it("better gear wins more often", () => {
    let wins = 0;
    for (let seed = 1; seed <= 200; seed++) {
      if (simulate(fighter("cat", { sword: 8, helmet: 8, armor: 8 }), fighter("cat"), seed).winner === 0) wins++;
    }
    assert.ok(wins > 170, `${wins} of 200`);
  });

  it("turns the first arena's purchases into levels without losing their value", () => {
    assert.deepEqual(gearFromLegacy([]), STARTER_GEAR);
    const g = gearFromLegacy(["iron-sword", "kite-shield", "leather-buckler"]);
    assert.equal(g.sword, 5, "180 points of weapons ≈ four sword levels");
    assert.ok(g.helmet > 1 && g.armor > 1);
    const spent = (slot: "sword" | "helmet" | "armor", level: number) => Array.from({ length: level - 1 }, (_, i) => upgradeCost(i + 1)).reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(spent("helmet", g.helmet) + spent("armor", g.armor) - 370) <= upgradeCost(Math.max(g.helmet, g.armor)) / 2);
  });

  it("replays duels saved by the first arena", () => {
    const old = normalizeFighter({ userId: "u1", name: "Алия", level: 3, color: "violet", weapon: "iron-sword", shield: "plank-shield" });
    assert.equal(old.name, "Алия");
    assert.ok(validateLook(old.look).ok);
    assert.deepEqual(old.gear, gearFromLegacy(["iron-sword"]));
    const fresh = fighter("dragon", { sword: 3, helmet: 2, armor: 4 });
    assert.deepEqual(normalizeFighter(JSON.parse(JSON.stringify(fresh))), fresh);
  });
});

describe("fight", () => {
  it("is deterministic and always ends", () => {
    const a = fighter("fox", { sword: 12, helmet: 3, armor: 6 });
    const b = fighter("shark", { sword: 4, helmet: 14, armor: 14 });
    for (let seed = 0; seed < 50; seed++) {
      const r = simulate(a, b, seed);
      assert.deepEqual(simulate(a, b, seed), r);
      assert.ok(r.hits.length > 0 && r.hits.length <= 40);
      assert.deepEqual(r.maxHp, [statsFor(a.gear).hp, statsFor(b.gear).hp]);
    }
  });
});
