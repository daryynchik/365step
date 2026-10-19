"use client";

import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { clsx } from "clsx";

import { saveLookAction } from "@/actions/arena";
import { EXPRESSIONS, EYES, lookForSpecies, SPECIES, SPECIES_GROUPS, speciesById, type Look } from "@/lib/arena-rules";
import type { Outfit } from "@/lib/shop-items";
import { Button, ErrorNote } from "../ui";
import { Hero, type Mood } from "./hero";

const sameLook = (a: Look, b: Look) => JSON.stringify(a) === JSON.stringify(b);

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

/** Choose a hero and its looks. Saved per student; cosmetic only. */
export function LooksEditor({ initialLook, chosen: initiallyChosen, outfit }: { initialLook: Look; chosen: boolean; outfit: Outfit }) {
  const [saved, setSaved] = useState(initialLook);
  const [look, setLook] = useState(initialLook);
  const [chosen, setChosen] = useState(initiallyChosen);
  const [tab, setTab] = useState<"hero" | "looks">("hero");
  const [mood, setMood] = useState<Mood>("idle");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [, start] = useTransition();

  const species = speciesById(look.species)!;
  const dirty = !sameLook(look, saved);
  const change = (next: Look) => {
    setNotice(null);
    setLook(next);
  };

  const save = () => {
    setError(null);
    setBusy(true);
    start(async () => {
      const res = await saveLookAction(look);
      setBusy(false);
      if (res.ok) {
        setSaved(look);
        setChosen(true);
        setNotice("Герой сохранён.");
      } else setError(res.error ?? "Не получилось сохранить.");
    });
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
      <section className="card self-start overflow-hidden lg:sticky lg:top-20">
        <div className="relative bg-gradient-to-b from-sunken to-surface px-4 pt-4">
          <Hero look={look} outfit={outfit} mood={mood} scene className="mx-auto block h-72 w-full max-w-72" label={`Твой герой: ${species.name}`} />
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
                className={clsx("rounded-md px-2 py-0.5 text-[11px] font-semibold", mood === m ? "bg-ink text-white" : "bg-surface/90 text-muted shadow-card hover:text-ink")}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="p-5">
          <p className="text-lg font-semibold">{species.name}</p>
          <p className="text-sm text-muted">{species.tagline}</p>
          {(dirty || !chosen) && (
            <div className="mt-4 rounded-lg border border-accent-line bg-accent-soft/60 p-3">
              <p className="text-sm font-medium">{dirty ? "Есть несохранённые изменения" : "Выбери героя и сохрани его"}</p>
              <div className="mt-2 flex gap-2">
                <Button size="sm" onClick={save} disabled={busy}>
                  {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                  Сохранить героя
                </Button>
                {dirty && (
                  <Button size="sm" variant="ghost" onClick={() => change(saved)} disabled={busy}>
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
          {error && (
            <div className="mt-3">
              <ErrorNote>{error}</ErrorNote>
            </div>
          )}
        </div>
      </section>

      <section className="card min-w-0 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-semibold">Мой герой</h2>
            <p className="text-sm text-muted">Выбери персонажа и настрой его внешность.</p>
          </div>
          <div className="flex rounded-lg border border-line bg-sunken p-0.5 text-sm" role="tablist">
            {(
              [
                ["hero", "Герой"],
                ["looks", "Внешность"],
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

        {tab === "hero" && (
          <div className="mt-4 space-y-5">
            {SPECIES_GROUPS.map((group) => (
              <div key={group.id}>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{group.name}</h3>
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                  {SPECIES.filter((s) => s.group === group.id).map((s) => {
                    const selected = s.id === look.species;
                    const preview = selected ? look : lookForSpecies(s.id, { eyes: look.eyes, expression: look.expression });
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
                          <Hero look={preview} outfit={outfit} still className="h-32 w-full" label={s.name} />
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
                  <button key={pal.name} type="button" onClick={() => change({ ...look, palette: i })} aria-pressed={look.palette === i} className="flex flex-col items-center gap-1">
                    <span
                      className={clsx("size-10 rounded-full ring-offset-2 ring-offset-surface transition", look.palette === i ? "ring-2 ring-ink" : "hover:scale-110")}
                      style={{ background: `linear-gradient(135deg, ${pal.main} 0 55%, ${pal.light} 55% 78%, ${pal.accent} 78%)`, boxShadow: `inset 0 0 0 2px ${pal.shade}` }}
                    />
                    <span className={clsx("text-[11px]", look.palette === i ? "font-semibold" : "text-muted")}>{pal.name}</span>
                  </button>
                ))}
              </div>
              {outfit.color && <p className="mt-2 text-xs text-muted">Сейчас надета расцветка из магазина — сними её в гардеробе, чтобы увидеть родную.</p>}
            </div>

            <div>
              <h3 className="text-sm font-semibold">Глаза</h3>
              <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5">
                {EYES.map((e) => (
                  <OptionTile key={e.id} selected={look.eyes === e.id} onClick={() => change({ ...look, eyes: e.id })} label={e.name}>
                    <Hero look={{ ...look, eyes: e.id }} crop="face" still className="h-20 w-full" />
                  </OptionTile>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold">Выражение</h3>
              <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
                {EXPRESSIONS.map((e) => (
                  <OptionTile key={e.id} selected={look.expression === e.id} onClick={() => change({ ...look, expression: e.id })} label={e.name}>
                    <Hero look={{ ...look, expression: e.id }} crop="face" still className="h-20 w-full" />
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
                        <Hero look={next} still className="h-24 w-full" />
                      </OptionTile>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
