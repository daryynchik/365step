"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { Check, Loader2, Lock, ShoppingBag, Shirt } from "lucide-react";
import { clsx } from "clsx";

import { buyItemAction, equipItemAction, unequipAction } from "@/actions/arena";
import type { Look } from "@/lib/arena-rules";
import { CATEGORIES, PRICE_RANGES, SHOP_ITEMS, SLOT_NAMES, SLOTS, type Category, type Outfit, type ShopItem } from "@/lib/shop-items";
import { Button, buttonClass, Coin, ErrorNote } from "../ui";
import { Hero } from "./hero";

type State = "buy" | "poor" | "owned" | "worn";

function stateOf(it: ShopItem, owned: Set<string>, outfit: Outfit, balance: number): State {
  if (outfit[it.slot] === it.id) return "worn";
  if (owned.has(it.id)) return "owned";
  return balance >= it.price ? "buy" : "poor";
}

/** How a preview of the item is framed: close-up for the head, the whole hero for the rest. */
function previewProps(it: ShopItem): { crop: "bust" | "full"; scene: boolean; mood: "idle" | "win" } {
  if (it.slot === "head" || it.slot === "face" || it.slot === "neck") return { crop: "bust", scene: false, mood: "idle" };
  if (it.slot === "background" || it.slot === "frame") return { crop: "full", scene: true, mood: "idle" };
  return { crop: "full", scene: false, mood: it.slot === "effect" ? "win" : "idle" };
}

function useWardrobe(initialOwned: string[], initialOutfit: Outfit, initialBalance: number) {
  const [owned, setOwned] = useState(() => new Set(initialOwned));
  const [outfit, setOutfit] = useState(initialOutfit);
  const [balance, setBalance] = useState(initialBalance);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [, start] = useTransition();

  const run = (key: string, fn: () => Promise<void>) => {
    setError(null);
    setNotice(null);
    setBusy(key);
    start(async () => {
      try {
        await fn();
      } finally {
        setBusy(null);
      }
    });
  };

  return {
    owned,
    outfit,
    balance,
    busy,
    error,
    notice,
    buy: (it: ShopItem) =>
      run(it.id, async () => {
        const res = await buyItemAction(it.id);
        if (!res.ok) return setError(res.error);
        setOwned((o) => new Set(o).add(it.id));
        setBalance(res.balance);
        setNotice(`Куплено: ${it.name}. Теперь его можно надеть.`);
      }),
    wear: (it: ShopItem) =>
      run(it.id, async () => {
        const res = await equipItemAction(it.id);
        if (!res.ok) return setError(res.error ?? "Не получилось.");
        if (res.outfit) setOutfit(res.outfit);
      }),
    takeOff: (it: ShopItem) =>
      run(it.id, async () => {
        const res = await unequipAction(it.slot);
        if (!res.ok) return setError(res.error ?? "Не получилось.");
        if (res.outfit) setOutfit(res.outfit);
      }),
  };
}

function Actions({ it, state, balance, busy, onBuy, onWear, onTakeOff }: { it: ShopItem; state: State; balance: number; busy: boolean; onBuy: () => void; onWear: () => void; onTakeOff: () => void }) {
  if (state === "worn")
    return (
      <Button size="sm" variant="secondary" onClick={onTakeOff} disabled={busy}>
        {busy && <Loader2 className="size-3.5 animate-spin" />}
        Снять
      </Button>
    );
  if (state === "owned")
    return (
      <Button size="sm" onClick={onWear} disabled={busy}>
        {busy && <Loader2 className="size-3.5 animate-spin" />}
        <Shirt className="size-3.5" /> Надеть
      </Button>
    );
  if (state === "poor")
    return (
      <span className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-warn-soft px-3 text-[13px] font-semibold text-warn" role="status">
        <Lock className="size-3.5" /> Недостаточно монет · нужно ещё {it.price - balance}
      </span>
    );
  return (
    <Button size="sm" onClick={onBuy} disabled={busy}>
      {busy ? <Loader2 className="size-3.5 animate-spin" /> : <ShoppingBag className="size-3.5" />}
      Купить за <Coin className="size-3.5" /> {it.price}
    </Button>
  );
}

function StateBadge({ state }: { state: State }) {
  if (state === "worn")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-white">
        <Check className="size-3" /> Надето
      </span>
    );
  if (state === "owned") return <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-accent">Куплено</span>;
  return null;
}

function ItemCard({ it, look, outfit, state, selected, onSelect }: { it: ShopItem; look: Look; outfit: Outfit; state: State; selected: boolean; onSelect: () => void }) {
  const p = previewProps(it);
  return (
    <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        className={clsx(
          "relative flex w-full flex-col rounded-xl border p-2 text-left transition",
          selected ? "border-accent ring-2 ring-accent/30" : "border-line hover:border-line-strong hover:bg-sunken",
        )}
      >
        <span className="block overflow-hidden rounded-lg bg-sunken">
          <Hero look={look} outfit={{ ...outfit, [it.slot]: it.id }} crop={p.crop} scene={p.scene} mood={p.mood} still className="h-28 w-full" label={it.name} />
        </span>
        <span className="mt-1.5 line-clamp-1 text-sm font-medium">{it.name}</span>
        <span className="mt-0.5 flex items-center justify-between gap-1">
          <span className={clsx("tabular flex items-center gap-1 text-sm font-semibold", state === "poor" ? "text-muted" : "text-[#9a7414]")}>
            <Coin className="size-3.5" />
            {it.price}
          </span>
          <StateBadge state={state} />
        </span>
      </button>
  );
}

function Preview({ look, outfit, selected, children }: { look: Look; outfit: Outfit; selected: ShopItem | null; children?: React.ReactNode }) {
  const tryOn = selected ? { ...outfit, [selected.slot]: selected.id } : outfit;
  return (
    <section className="card self-start overflow-hidden lg:sticky lg:top-20">
      <div className="bg-gradient-to-b from-sunken to-surface px-4 pt-4">
        <Hero look={look} outfit={tryOn} scene mood={selected?.slot === "effect" ? "win" : "idle"} className="mx-auto block h-72 w-full max-w-72" label="Предпросмотр" />
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function Shop({ look, owned: initialOwned, outfit: initialOutfit, balance: initialBalance }: { look: Look; owned: string[]; outfit: Outfit; balance: number }) {
  const w = useWardrobe(initialOwned, initialOutfit, initialBalance);
  const [category, setCategory] = useState<Category | "all">("all");
  const [range, setRange] = useState<(typeof PRICE_RANGES)[number]["id"]>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = SHOP_ITEMS.find((i) => i.id === selectedId) ?? null;
  const bounds = PRICE_RANGES.find((r) => r.id === range)!;
  const items = useMemo(
    () => SHOP_ITEMS.filter((i) => (category === "all" || i.category === category) && i.price >= bounds.min && i.price <= bounds.max),
    [category, bounds],
  );

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      <Preview look={look} outfit={w.outfit} selected={selected}>
        <p className="flex items-center gap-1.5 text-sm text-muted">
          На счету: <Coin className="size-4" /> <span className="tabular font-semibold text-ink">{w.balance}</span>
        </p>
        {selected ? (
          <div className="mt-3">
            <p className="font-semibold">{selected.name}</p>
            <p className="text-xs text-muted">
              {CATEGORIES.find((c) => c.id === selected.category)?.name} · место: {SLOT_NAMES[selected.slot].toLowerCase()}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Actions
                it={selected}
                state={stateOf(selected, w.owned, w.outfit, w.balance)}
                balance={w.balance}
                busy={w.busy === selected.id}
                onBuy={() => w.buy(selected)}
                onWear={() => w.wear(selected)}
                onTakeOff={() => w.takeOff(selected)}
              />
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted">Выбери предмет — он сразу появится на герое. Купить можно после примерки.</p>
        )}
        {w.notice && <p className="mt-3 text-sm font-medium text-accent">{w.notice}</p>}
        {w.error && (
          <div className="mt-3">
            <ErrorNote>{w.error}</ErrorNote>
          </div>
        )}
        <p className="mt-4 text-xs text-muted">Все предметы только украшают героя и не влияют на соревнования.</p>
      </Preview>

      <section className="card min-w-0 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-semibold">Магазин аксессуаров</h2>
            <p className="text-sm text-muted">
              {SHOP_ITEMS.length} предметов за монеты с уроков и соревнований. Купленное хранится в{" "}
              <Link href="/arena/wardrobe" className="font-medium text-accent hover:underline">
                гардеробе
              </Link>
              .
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-muted">Цена</span>
            <select value={range} onChange={(e) => setRange(e.target.value as typeof range)} className="h-9 rounded-lg border border-line bg-surface px-2 text-sm">
              {PRICE_RANGES.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5" role="tablist" aria-label="Категории">
          {[{ id: "all" as const, name: "Все" }, ...CATEGORIES].map((c) => (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={category === c.id}
              onClick={() => setCategory(c.id)}
              className={clsx("rounded-full border px-3 py-1 text-sm font-medium", category === c.id ? "border-ink bg-ink text-white" : "border-line text-muted hover:text-ink")}
            >
              {c.name}
            </button>
          ))}
        </div>
        {items.length === 0 ? (
          <p className="mt-6 text-sm text-muted">В этой категории нет предметов в выбранном диапазоне цен.</p>
        ) : (
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {items.map((it) => (
              <li key={it.id}>
                <ItemCard it={it} look={look} outfit={w.outfit} state={stateOf(it, w.owned, w.outfit, w.balance)} selected={selectedId === it.id} onSelect={() => setSelectedId(it.id)} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export function WardrobeItems({ look, owned: initialOwned, outfit: initialOutfit, balance }: { look: Look; owned: string[]; outfit: Outfit; balance: number }) {
  const w = useWardrobe(initialOwned, initialOutfit, balance);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const mine = SHOP_ITEMS.filter((i) => w.owned.has(i.id));
  const selected = mine.find((i) => i.id === selectedId) ?? null;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      <Preview look={look} outfit={w.outfit} selected={selected}>
        <p className="text-sm font-semibold">Сейчас надето</p>
        <ul className="mt-2 space-y-1 text-sm">
          {SLOTS.filter((s) => w.outfit[s]).map((s) => (
            <li key={s} className="flex justify-between gap-2">
              <span className="text-muted">{SLOT_NAMES[s]}</span>
              <span className="truncate font-medium">{SHOP_ITEMS.find((i) => i.id === w.outfit[s])?.name}</span>
            </li>
          ))}
          {!SLOTS.some((s) => w.outfit[s]) && <li className="text-muted">Ничего — только сам герой.</li>}
        </ul>
        {selected && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">{selected.name}</span>
            <Actions
              it={selected}
              state={stateOf(selected, w.owned, w.outfit, w.balance)}
              balance={w.balance}
              busy={w.busy === selected.id}
              onBuy={() => w.buy(selected)}
              onWear={() => w.wear(selected)}
              onTakeOff={() => w.takeOff(selected)}
            />
          </div>
        )}
        {w.error && (
          <div className="mt-3">
            <ErrorNote>{w.error}</ErrorNote>
          </div>
        )}
      </Preview>

      <section className="card min-w-0 p-5">
        <h2 className="text-[15px] font-semibold">Гардероб</h2>
        <p className="text-sm text-muted">Купленные аксессуары. На каждое место можно надеть один предмет.</p>
        {mine.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-line-strong p-6 text-center">
            <p className="text-sm text-muted">Пока пусто.</p>
            <Link href="/arena/shop" className={clsx(buttonClass("primary", "sm"), "mt-3")}>
              <ShoppingBag className="size-4" /> В магазин
            </Link>
          </div>
        ) : (
          <div className="mt-4 space-y-5">
            {SLOTS.filter((s) => mine.some((i) => i.slot === s)).map((slot) => (
              <div key={slot}>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{SLOT_NAMES[slot]}</h3>
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                  {mine
                    .filter((i) => i.slot === slot)
                    .map((it) => (
                      <li key={it.id} className="flex flex-col">
                        <ItemCard it={it} look={look} outfit={w.outfit} state={stateOf(it, w.owned, w.outfit, w.balance)} selected={selectedId === it.id} onSelect={() => setSelectedId(it.id)} />
                        <div className="mt-1.5">
                          <Actions
                            it={it}
                            state={stateOf(it, w.owned, w.outfit, w.balance)}
                            balance={w.balance}
                            busy={w.busy === it.id}
                            onBuy={() => w.buy(it)}
                            onWear={() => w.wear(it)}
                            onTakeOff={() => w.takeOff(it)}
                          />
                        </div>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
