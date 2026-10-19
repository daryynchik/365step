"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, Check, Loader2, Lock, Sparkles } from "lucide-react";
import { clsx } from "clsx";

import { saveLookAction, upgradeGearAction } from "@/actions/arena";
import {
  EXPRESSIONS,
  EYES,
  itemName,
  lookForSpecies,
  MAX_GEAR_LEVEL,
  nextTierLevel,
  powerRating,
  SLOT_INFO,
  slotBonus,
  SLOTS,
  SPECIES,
  SPECIES_GROUPS,
  speciesById,
  statsFor,
  TIERS,
  tierIndex,
  upgradeCost,
  type Gear,
  type Look,
  type Slot,
} from "@/lib/arena-rules";
import { Button, Coin, ErrorNote } from "../ui";
import { GearThumb, Hero, type Mood } from "./hero";

type Tab = "hero" | "looks" | "gear";

const sameLook = (a: Look, b: Look) => JSON.stringify(a) === JSON.stringify(b);

function Stat({ label, value, delta }: { label: string; value: string | number; delta?: string }) {
  return (
    <div className="rounded-lg bg-sunken px-3 py-2">
      <p className="text-[11px] text-muted">{label}</p>
      <p className="tabular text-sm font-semibold">
        {value}
        {delta && <span className="ml-1 text-xs font-medium text-accent">{delta}</span>}
      </p>
    </div>
  );
}

function OptionTile({ selected, onClick, children, label }: { selected: boolean; onClick: () => void; children: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={clsx(
        "relative flex flex-col items-center rounded-xl border bg-surface p-1.5 pb-2 text-center transition",
        selected ? "border-accent ring-2 ring-accent/30" : "border-line hover:border-line-strong hover:bg-sunken",
      )}
    >
      {children}
      <span className="mt-1 text-xs font-medium leading-tight">{label}</span>
      {selected && (
        <span className="absolute right-1.5 top-1.5 grid size-5 place-items-center rounded-full bg-accent text-white">
          <Check className="size-3" strokeWidth={3} />
        </span>
      )}
    </button>
  );
}

/** What one item gives, in words. */
function bonusText(slot: Slot, level: number): string[] {
  const b = slotBonus(slot, level);
  const out: string[] = [];
  if (b.attack) out.push(`+${b.attack} к атаке`);
  if (b.defense) out.push(`+${b.defense} к защите`);
  if (b.hp) out.push(`+${b.hp} к здоровью`);
  if (b.crit) out.push(`+${Math.round(b.crit * 100)}% крит`);
  if (b.block) out.push(`+${Math.round(b.block * 100)}% блок`);
  return out;
}

function diffText(slot: Slot, level: number): string {
  const now = slotBonus(slot, level);
  const next = slotBonus(slot, level + 1);
  const parts: string[] = [];
  if (next.attack > now.attack) parts.push(`+${next.attack - now.attack} атака`);
  if (next.defense > now.defense) parts.push(`+${next.defense - now.defense} защита`);
  if (next.hp > now.hp) parts.push(`+${next.hp - now.hp} здоровье`);
  if (next.crit > now.crit) parts.push(`+${Math.round((next.crit - now.crit) * 100)}% крит`);
  if (next.block > now.block) parts.push(`+${Math.round((next.block - now.block) * 100)}% блок`);
  return parts.join(", ");
}

function GearCard({
  slot,
  level,
  look,
  points,
  busy,
  onUpgrade,
}: {
  slot: Slot;
  level: number;
  look: Look;
  points: number;
  busy: boolean;
  onUpgrade: () => void;
}) {
  const max = level >= MAX_GEAR_LEVEL;
  const cost = max ? 0 : upgradeCost(level);
  const affordable = points >= cost;
  const nextTier = nextTierLevel(level);
  const changesLook = !max && nextTier === level + 1;
  return (
    <li className="flex flex-col rounded-xl border border-line p-4">
      <div className="flex items-start gap-3">
        <div className="grid size-16 flex-none place-items-center rounded-lg bg-sunken">
          <GearThumb slot={slot} level={level} look={look} className="size-14" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{itemName(slot, level)}</p>
          <p className="text-xs text-muted">{SLOT_INFO[slot].effect}</p>
          <p className="tabular mt-1 text-xs font-semibold">
            Ур. {level} <span className="font-normal text-muted">из {MAX_GEAR_LEVEL}</span>
          </p>
        </div>
      </div>

      <div className="mt-3 flex gap-1" aria-label="Виды предмета">
        {TIERS.map((t, i) => (
          <span
            key={t.id}
            title={`${SLOT_INFO[slot].feminine ? t.feminine : t.masculine} — с ур. ${t.from}`}
            className={clsx("h-1.5 flex-1 rounded-full", i <= tierIndex(level) ? "bg-accent" : "bg-sunken")}
          />
        ))}
      </div>

      <dl className="mt-3 space-y-1 text-xs">
        <div className="flex gap-2">
          <dt className="w-16 flex-none text-muted">Сейчас</dt>
          <dd className="font-medium">{bonusText(slot, level).join(", ")}</dd>
        </div>
        {!max && (
          <div className="flex gap-2">
            <dt className="w-16 flex-none text-muted">Ур. {level + 1}</dt>
            <dd className="font-medium text-accent">{diffText(slot, level)}</dd>
          </div>
        )}
      </dl>
      {changesLook ? (
        <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-seminar">
          <Sparkles className="size-3.5" /> Новый вид: {itemName(slot, level + 1)}
        </p>
      ) : (
        nextTier && <p className="mt-2 text-xs text-muted">Новый вид на ур. {nextTier}: {itemName(slot, nextTier)}</p>
      )}

      <div className="mt-auto pt-3">
        {max ? (
          <span className="inline-flex h-8 items-center gap-1.5 text-[13px] font-semibold text-accent">
            <Check className="size-4" /> Максимальный уровень
          </span>
        ) : (
          <Button size="sm" className="w-full" onClick={onUpgrade} disabled={busy || !affordable}>
            {busy ? <Loader2 className="size-3.5 animate-spin" /> : affordable ? <ArrowUp className="size-3.5" /> : <Lock className="size-3.5" />}
            {affordable ? "Улучшить за" : `Нужно ещё ${cost - points}`}
            {affordable && (
              <span className="tabular inline-flex items-center gap-1">
                <Coin className="size-3.5" />
                {cost}
              </span>
            )}
          </Button>
        )}
      </div>
    </li>
  );
}

export function HeroEditor({
  name,
  studyLevel,
  initialLook,
  chosen: initiallyChosen,
  gear: initialGear,
  balance,
}: {
  name: string;
  studyLevel: number;
  initialLook: Look;
  chosen: boolean;
  gear: Gear;
  balance: number;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialLook);
  const [look, setLook] = useState(initialLook);
  const [chosen, setChosen] = useState(initiallyChosen);
  const [gear, setGear] = useState(initialGear);
  const [points, setPoints] = useState(balance);
  const [tab, setTab] = useState<Tab>(initiallyChosen ? "gear" : "hero");
  const [mood, setMood] = useState<Mood>("idle");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [, start] = useTransition();

  const species = speciesById(look.species)!;
  const dirty = !sameLook(look, saved);
  const stats = statsFor(gear);

  const change = (next: Look) => {
    setNotice(null);
    setLook(next);
  };

  const save = () => {
    setError(null);
    setBusy("save");
    start(async () => {
      const res = await saveLookAction(look);
      setBusy(null);
      if (res.ok) {
        setSaved(look);
        setChosen(true);
        setNotice("Герой сохранён.");
      } else setError(res.error ?? "Не получилось сохранить.");
    });
  };

  const upgrade = (slot: Slot) => {
    setError(null);
    setNotice(null);
    setBusy(slot);
    start(async () => {
      const res = await upgradeGearAction(slot, gear[slot]);
      setBusy(null);
      if (res.ok) {
        setGear((g) => ({ ...g, [slot]: res.level }));
        setPoints(res.balance);
        setNotice(`${itemName(slot, res.level)} — уровень ${res.level}.`);
        setMood("win");
        window.setTimeout(() => setMood("idle"), 1800);
      } else {
        setError(res.error);
        router.refresh();
      }
    });
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
      <section className="card self-start overflow-hidden lg:sticky lg:top-20">
        <div className="relative bg-gradient-to-b from-sunken to-surface px-4 pt-4">
          <Hero look={look} gear={gear} mood={mood} className="mx-auto block h-72 w-full max-w-72" label={`Твой герой: ${species.name}`} />
          <span className="absolute left-4 top-4 rounded-md bg-surface/90 px-2 py-1 text-xs font-semibold shadow-card">Сила {powerRating(gear)}</span>
          <div className="absolute right-3 top-3 flex flex-col gap-1" role="group" aria-label="Реакции героя">
            {(
              [
                ["idle", "Ожидание"],
                ["win", "Победа"],
                ["lose", "Поражение"],
              ] as const
            ).map(([m, label]) => (
              <button
                key={m}
                type="button"
                onClick={() => setMood(m)}
                aria-pressed={mood === m}
                className={clsx(
                  "rounded-md px-2 py-0.5 text-[11px] font-semibold",
                  mood === m ? "bg-ink text-white" : "bg-surface/90 text-muted shadow-card hover:text-ink",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="p-5">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="truncate text-lg font-semibold">{name}</h2>
            <span className="flex-none text-sm text-muted">{species.name}</span>
          </div>
          <p className="text-xs text-muted">Уровень ученика {studyLevel}</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <Stat label="Здоровье" value={stats.hp} />
            <Stat label="Атака" value={stats.attack} />
            <Stat label="Защита" value={stats.defense} />
            <Stat label="Крит" value={`${Math.round(stats.crit * 100)}%`} />
            <Stat label="Блок" value={`${Math.round(stats.block * 100)}%`} />
            <Stat label="Очки" value={points} />
          </div>
          <p className="mt-3 text-xs text-muted">Вид героя не влияет на бой: силу дают только меч, шлем и броня.</p>

          {(dirty || !chosen) && (
            <div className="mt-4 rounded-lg border border-accent-line bg-accent-soft/60 p-3">
              <p className="text-sm font-medium">{dirty ? "Есть несохранённые изменения" : "Выбери героя и сохрани его"}</p>
              <div className="mt-2 flex gap-2">
                <Button size="sm" onClick={save} disabled={busy !== null}>
                  {busy === "save" ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                  Сохранить героя
                </Button>
                {dirty && (
                  <Button size="sm" variant="ghost" onClick={() => change(saved)} disabled={busy !== null}>
                    Отменить
                  </Button>
                )}
              </div>
            </div>
          )}
          {notice && !dirty && (
            <p role="status" className="mt-3 flex items-center gap-1.5 text-sm font-medium text-accent">
              <Check className="size-4" /> {notice}
            </p>
          )}
        </div>
      </section>

      <section className="card min-w-0 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-semibold">Мастерская героя</h2>
            <p className="text-sm text-muted">Выбери героя, настрой внешность и улучшай снаряжение за очки с уроков.</p>
          </div>
          <div className="flex rounded-lg border border-line bg-sunken p-0.5 text-sm" role="tablist">
            {(
              [
                ["hero", "Герой"],
                ["looks", "Внешность"],
                ["gear", "Снаряжение"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                onClick={() => setTab(id)}
                className={clsx("rounded-md px-3 py-1 font-medium", tab === id ? "bg-surface shadow-card" : "text-muted hover:text-ink")}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mt-4">
            <ErrorNote>{error}</ErrorNote>
          </div>
        )}

        {tab === "hero" && (
          <div className="mt-4 space-y-5">
            {SPECIES_GROUPS.map((group) => (
              <div key={group.id}>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{group.name}</h3>
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                  {SPECIES.filter((s) => s.group === group.id).map((s) => {
                    const preview = s.id === look.species ? look : lookForSpecies(s.id, { eyes: look.eyes, expression: look.expression });
                    const selected = s.id === look.species;
                    return (
                      <li key={s.id}>
                        <button
                          type="button"
                          onClick={() => !selected && change(lookForSpecies(s.id, { palette: look.palette, eyes: look.eyes, expression: look.expression }))}
                          aria-pressed={selected}
                          className={clsx(
                            "relative flex w-full flex-col items-center rounded-xl border p-2 text-center transition",
                            selected ? "border-accent bg-accent-soft/50 ring-2 ring-accent/30" : "border-line hover:border-line-strong hover:bg-sunken",
                          )}
                        >
                          <Hero look={preview} gear={gear} className="h-32 w-full" label={s.name} />
                          <span className="mt-1 text-sm font-semibold">{s.name}</span>
                          <span className="text-[11px] leading-tight text-muted">{s.tagline}</span>
                          {selected && (
                            <span className="absolute right-2 top-2 grid size-5 place-items-center rounded-full bg-accent text-white">
                              <Check className="size-3" strokeWidth={3} />
                            </span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}

        {tab === "looks" && (
          <div className="mt-4 space-y-6">
            <div>
              <h3 className="text-sm font-semibold">Расцветка</h3>
              <div className="mt-2 flex flex-wrap gap-3">
                {species.palettes.map((pal, i) => (
                  <button
                    key={pal.name}
                    type="button"
                    onClick={() => change({ ...look, palette: i })}
                    aria-pressed={look.palette === i}
                    className="flex flex-col items-center gap-1"
                  >
                    <span
                      className={clsx(
                        "size-10 rounded-full ring-offset-2 ring-offset-surface transition",
                        look.palette === i ? "ring-2 ring-ink" : "hover:scale-110",
                      )}
                      style={{ background: `linear-gradient(135deg, ${pal.main} 0 55%, ${pal.light} 55% 78%, ${pal.accent} 78%)`, boxShadow: `inset 0 0 0 2px ${pal.shade}` }}
                    />
                    <span className={clsx("text-[11px]", look.palette === i ? "font-semibold" : "text-muted")}>{pal.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold">Глаза</h3>
              <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5">
                {EYES.map((e) => (
                  <OptionTile key={e.id} selected={look.eyes === e.id} onClick={() => change({ ...look, eyes: e.id })} label={e.name}>
                    <Hero look={{ ...look, eyes: e.id }} gear={gear} crop="face" className="h-20 w-full" />
                  </OptionTile>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold">Выражение</h3>
              <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
                {EXPRESSIONS.map((e) => (
                  <OptionTile key={e.id} selected={look.expression === e.id} onClick={() => change({ ...look, expression: e.id })} label={e.name}>
                    <Hero look={{ ...look, expression: e.id }} gear={gear} crop="face" className="h-20 w-full" />
                  </OptionTile>
                ))}
              </div>
            </div>

            {species.features.map((ft) => (
              <div key={ft.id}>
                <h3 className="text-sm font-semibold">{ft.name}</h3>
                <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {ft.options.map((o) => {
                    const next = { ...look, features: { ...look.features, [ft.id]: o.id } };
                    return (
                      <OptionTile key={o.id} selected={look.features[ft.id] === o.id} onClick={() => change(next)} label={o.name}>
                        <Hero look={next} gear={gear} className="h-24 w-full" />
                      </OptionTile>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "gear" && (
          <div className="mt-4">
            <p className="flex items-center gap-1.5 text-sm text-muted">
              Очки на счету: <Coin className="size-4" /> <span className="tabular font-semibold text-ink">{points}</span>
            </p>
            <ul className="mt-3 grid gap-3 md:grid-cols-3">
              {SLOTS.map((slot) => (
                <GearCard
                  key={slot}
                  slot={slot}
                  level={gear[slot]}
                  look={look}
                  points={points}
                  busy={busy === slot}
                  onUpgrade={() => upgrade(slot)}
                />
              ))}
            </ul>
            <p className="mt-4 text-xs text-muted">
              Улучшения навсегда. Каждые четыре уровня предмет меняет вид: простой, железный, стальной, магический, легендарный.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
