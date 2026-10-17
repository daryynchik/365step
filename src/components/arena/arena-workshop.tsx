"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, Lock, Shield, Sword } from "lucide-react";
import { clsx } from "clsx";

import { buyItemAction, equipItemAction, setColorAction } from "@/actions/arena";
import { COLORS, ITEMS, powerRating, statsFor, type FighterColor, type ItemKind } from "@/lib/arena-rules";
import { Button, Coin, ErrorNote } from "../ui";
import { FighterViewer } from "./fighter-viewer";

interface Loadout {
  color: FighterColor;
  weapon: string;
  shield: string;
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-sunken px-3 py-2">
      <p className="text-[11px] text-muted">{label}</p>
      <p className="tabular text-sm font-semibold">{value}</p>
    </div>
  );
}

export function ArenaWorkshop({
  name,
  level,
  initial,
  owned: initialOwned,
  balance,
}: {
  name: string;
  level: number;
  initial: Loadout;
  owned: string[];
  balance: number;
}) {
  const [loadout, setLoadout] = useState(initial);
  const [owned, setOwned] = useState(() => new Set(initialOwned));
  const [points, setPoints] = useState(balance);
  const [tab, setTab] = useState<ItemKind>("weapon");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, start] = useTransition();

  const stats = statsFor({ level, ...loadout });

  const changeColor = (color: FighterColor) => {
    const previous = loadout.color;
    setLoadout((l) => ({ ...l, color }));
    start(async () => {
      const res = await setColorAction(color);
      if (!res.ok) {
        setLoadout((l) => ({ ...l, color: previous }));
        setError(res.error ?? "Не получилось.");
      }
    });
  };

  const equip = (id: string, kind: ItemKind) => {
    setError(null);
    setBusy(id);
    start(async () => {
      const res = await equipItemAction(id);
      setBusy(null);
      if (res.ok) setLoadout((l) => ({ ...l, [kind]: id }));
      else setError(res.error ?? "Не получилось.");
    });
  };

  const buy = (id: string, kind: ItemKind, price: number) => {
    setError(null);
    setBusy(id);
    start(async () => {
      const res = await buyItemAction(id);
      setBusy(null);
      if (res.ok) {
        setOwned((o) => new Set(o).add(id));
        setPoints((p) => p - price);
        setLoadout((l) => ({ ...l, [kind]: id }));
      } else {
        setError(res.error ?? "Не получилось.");
      }
    });
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
      <section className="card overflow-hidden">
        <div className="relative bg-gradient-to-b from-sunken to-surface">
          <FighterViewer {...loadout} className="block h-80 w-full" />
          <span className="absolute left-4 top-4 rounded-md bg-surface/90 px-2 py-1 text-xs font-semibold shadow-card">
            Сила {powerRating({ level, ...loadout })}
          </span>
        </div>
        <div className="p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-semibold">{name}</h2>
            <span className="text-sm text-muted">Уровень {level}</span>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <Stat label="Здоровье" value={stats.hp} />
            <Stat label="Атака" value={stats.attack} />
            <Stat label="Броня" value={stats.armor} />
            <Stat label="Крит" value={`${Math.round(stats.crit * 100)}%`} />
            <Stat label="Блок" value={`${Math.round(stats.block * 100)}%`} />
            <Stat label="Очки" value={points} />
          </div>
          <p className="mt-3 text-xs text-muted">Твой Страж пути. Здоровье растёт с уровнем — то есть с каждым пройденным уроком.</p>

          <p className="mt-5 text-sm font-medium">Цвет формы</p>
          <div className="mt-2 flex gap-2">
            {(Object.keys(COLORS) as FighterColor[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => changeColor(c)}
                aria-label={COLORS[c].name}
                aria-pressed={loadout.color === c}
                className={clsx(
                  "size-8 rounded-full ring-offset-2 ring-offset-surface transition",
                  loadout.color === c ? "ring-2 ring-ink" : "hover:scale-110",
                )}
                style={{ background: COLORS[c].hex }}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-semibold">Оружейная</h2>
            <p className="text-sm text-muted">Покупай снаряжение за очки, заработанные на уроках.</p>
          </div>
          <div className="flex rounded-lg border border-line bg-sunken p-0.5 text-sm" role="tablist">
            {(
              [
                ["weapon", "Оружие", Sword],
                ["shield", "Щиты", Shield],
              ] as const
            ).map(([kind, label, Icon]) => (
              <button
                key={kind}
                type="button"
                role="tab"
                aria-selected={tab === kind}
                onClick={() => setTab(kind)}
                className={clsx("flex items-center gap-1.5 rounded-md px-3 py-1 font-medium", tab === kind ? "bg-surface shadow-card" : "text-muted hover:text-ink")}
              >
                <Icon className="size-3.5" /> {label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mt-4">
            <ErrorNote>{error}</ErrorNote>
          </div>
        )}

        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {ITEMS.filter((i) => i.kind === tab).map((it) => {
            const isOwned = owned.has(it.id);
            const equipped = loadout[it.kind] === it.id;
            const affordable = points >= it.price;
            return (
              <li
                key={it.id}
                className={clsx("flex flex-col rounded-xl border p-4", equipped ? "border-accent-line bg-accent-soft/50" : "border-line")}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{it.name}</p>
                    <p className="text-xs text-muted">{it.description}</p>
                  </div>
                  {!isOwned && (
                    <span className="tabular flex flex-none items-center gap-1 text-sm font-semibold text-[#9a7414]">
                      <Coin className="size-4" />
                      {it.price}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-xs text-muted">
                  {it.kind === "weapon"
                    ? `+${it.power} к атаке · крит ${Math.round(it.chance * 100)}%`
                    : `−${it.power} урона · блок ${Math.round(it.chance * 100)}%`}
                </p>
                <div className="mt-3">
                  {equipped ? (
                    <span className="inline-flex h-8 items-center gap-1.5 text-[13px] font-semibold text-accent">
                      <Check className="size-4" /> Надето
                    </span>
                  ) : isOwned ? (
                    <Button size="sm" variant="secondary" onClick={() => equip(it.id, it.kind)} disabled={busy !== null}>
                      {busy === it.id && <Loader2 className="size-3.5 animate-spin" />}
                      Надеть
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => buy(it.id, it.kind, it.price)} disabled={!affordable || busy !== null}>
                      {busy === it.id ? <Loader2 className="size-3.5 animate-spin" /> : !affordable && <Lock className="size-3.5" />}
                      {affordable ? "Купить" : `Нужно ещё ${it.price - points}`}
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
