"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { ArrowUpRight, Bookmark, CalendarDays, Check, GraduationCap, Loader2, Search, SlidersHorizontal, Trophy } from "lucide-react";
import { clsx } from "clsx";

import { addDeadlineAction } from "@/actions/deadlines";
import type { Opportunity } from "@/content/opportunities";
import { daysBetween } from "@/lib/date";
import { Button, buttonClass } from "./ui";

const FIELDS = { stem: "Наука и STEM", it: "IT и технологии", humanities: "Гуманитарные", business: "Бизнес", arts: "Творчество", general: "Разные направления" };
const REGIONS = { international: "Международные", kazakhstan: "Казахстан", usa: "США", europe: "Европа", asia: "Азия" };
const COSTS = { free: "Бесплатно", paid: "Платно", mixed: "Есть стипендии / разные условия" };
const dateLabel = (date: string) => new Date(`${date}T12:00:00Z`).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export function OpportunityCatalog({ opportunities, userId, tracked, today }: { opportunities: Opportunity[]; userId: string; tracked: string[]; today: string }) {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("all");
  const [field, setField] = useState("all");
  const [region, setRegion] = useState("all");
  const [status, setStatus] = useState("all");
  const [free, setFree] = useState(false);
  const [savedOnly, setSavedOnly] = useState(false);
  const [saved, setSaved] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [limit, setLimit] = useState(12);
  const [planner, setPlanner] = useState(() => new Set(tracked));
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  const [pending, start] = useTransition();
  const storageKey = `365step:opportunities:${userId}`;
  useEffect(() => {
    try { const data = JSON.parse(localStorage.getItem(storageKey) ?? "[]"); if (Array.isArray(data)) setSaved(data.filter((id): id is string => typeof id === "string")); } catch { /* Storage may be unavailable in private mode. */ }
    setLoaded(true);
  }, [storageKey]);
  useEffect(() => {
    if (loaded) { try { localStorage.setItem(storageKey, JSON.stringify(saved)); } catch { /* Bookmarks still work for this visit. */ } }
  }, [saved, loaded, storageKey]);
  useEffect(() => { setLimit(12); }, [query, kind, field, region, status, free, savedOnly]);

  const results = useMemo(() => opportunities.filter((o) => {
    const future = !!o.deadline && o.deadline >= today;
    const past = !!o.deadline && o.deadline < today;
    const search = `${o.title} ${o.organizer} ${o.description} ${o.eligibility} ${o.tags.join(" ")}`.toLocaleLowerCase("ru");
    return (!query.trim() || search.includes(query.trim().toLocaleLowerCase("ru"))) &&
      (kind === "all" || o.kind === kind) && (field === "all" || o.field === field) &&
      (region === "all" || o.region === region) && (!free || o.cost === "free") && (!savedOnly || saved.includes(o.id)) &&
      (status === "all" || (status === "upcoming" && (future || o.rolling)) || (status === "month" && future && daysBetween(today, o.deadline!) <= 30) || (status === "unannounced" && !o.deadline && !o.rolling) || (status === "past" && past));
  }).sort((a, b) => {
    const rank = (o: Opportunity) => o.deadline && o.deadline >= today ? 0 : o.rolling ? 1 : !o.deadline ? 2 : 3;
    return rank(a) - rank(b) || (rank(a) === 3 ? (b.deadline ?? "").localeCompare(a.deadline ?? "") : (a.deadline ?? "9999").localeCompare(b.deadline ?? "9999")) || a.title.localeCompare(b.title);
  }), [opportunities, query, kind, field, region, status, free, savedOnly, saved, today]);

  const addToPlanner = (o: Opportunity) => {
    if (!o.deadline || o.deadline < today) return;
    start(async () => {
      setBusy(o.id);
      try {
        const result = await addDeadlineAction(o.title, o.deadline!);
        if (result.ok) { setPlanner((p) => new Set(p).add(`${o.title}|${o.deadline}`)); setMessage({ text: "Дедлайн добавлен в «Мой путь».", error: false }); }
        else setMessage({ text: result.error ?? "Не получилось добавить дедлайн.", error: true });
      } catch { setMessage({ text: "Не удалось сохранить. Попробуй ещё раз.", error: true }); }
      finally { setBusy(null); }
    });
  };
  const reset = () => { setMessage(null); setQuery(""); setKind("all"); setField("all"); setRegion("all"); setStatus("all"); setFree(false); setSavedOnly(false); };
  const selectClass = "h-10 w-full rounded-lg border border-line-strong bg-surface px-3 text-sm text-ink focus:outline-2 focus:outline-accent";
  const available = opportunities.filter((o) => o.rolling || (o.deadline && o.deadline >= today)).length;

  return <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Конкурсы и программы</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">Найди проект, олимпиаду или летнюю школу для своего следующего шага. Условия, сроки и прямые ссылки на организаторов — в одном месте.</p>
    </div>
    <div className="grid gap-3 sm:grid-cols-3">
      {[[Trophy, "Возможностей в каталоге", opportunities.length], [CalendarDays, "Срок впереди / набор без даты", available], [GraduationCap, "Бесплатных вариантов", opportunities.filter((o) => o.cost === "free").length]].map(([Icon, label, count]) => {
        const StatIcon = Icon as typeof Trophy;
        return <div key={String(label)} className="card flex items-center gap-3 p-4"><StatIcon className="size-5 text-accent" /><div><p className="tabular text-xl font-bold">{String(count)}</p><p className="text-xs text-muted">{String(label)}</p></div></div>;
      })}
    </div>
    <section className="card space-y-4 p-5" aria-label="Фильтры каталога">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-48 flex-1"><Search aria-hidden className="absolute left-3 top-3 size-4 text-subtle" /><input aria-label="Поиск конкурсов и программ" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Название, направление, возраст…" className={selectClass + " pl-9"} /></div>
        <div className="flex rounded-lg border border-line bg-sunken p-0.5 text-sm" aria-label="Тип возможности">
          {[["all", "Все"], ["competition", "Конкурсы"], ["program", "Программы"]].map(([value, label]) => <button key={value} type="button" aria-pressed={kind === value} onClick={() => setKind(value)} className={clsx("rounded-md px-3 py-2 font-medium", kind === value ? "bg-surface shadow-card" : "text-muted hover:text-ink")}>{label}</button>)}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="space-y-1 text-xs text-muted"><span>Направление</span><select aria-label="Направление" value={field} onChange={(e) => setField(e.target.value)} className={selectClass}><option value="all">Все направления</option>{Object.entries(FIELDS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
        <label className="space-y-1 text-xs text-muted"><span>География программы</span><select aria-label="География программы" value={region} onChange={(e) => setRegion(e.target.value)} className={selectClass}><option value="all">Все страны</option>{Object.entries(REGIONS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
        <label className="space-y-1 text-xs text-muted"><span>Дедлайн</span><select aria-label="Дедлайн" value={status} onChange={(e) => setStatus(e.target.value)} className={selectClass}><option value="all">Все сроки</option><option value="upcoming">Срок впереди / постоянный набор</option><option value="month">В ближайшие 30 дней</option><option value="unannounced">Ждём даты нового набора</option><option value="past">Прошедшие сроки</option></select></label>
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" checked={free} onChange={(e) => setFree(e.target.checked)} className="accent-accent" />Только бесплатные</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={savedOnly} onChange={(e) => setSavedOnly(e.target.checked)} className="accent-accent" />Избранное ({saved.length})</label>
        <button type="button" onClick={reset} className="ml-auto flex items-center gap-1 text-xs font-medium text-muted hover:text-ink"><SlidersHorizontal className="size-3.5" />Сбросить</button>
      </div>
    </section>
    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted"><p role="status">Найдено: <span className="font-semibold text-ink">{results.length}</span> · сначала ближайшие дедлайны</p><p>Данные проверены 17 октября 2026</p></div>
    <p className="text-xs leading-relaxed text-muted">Даты указаны вместе с годом. Если новый набор ещё не объявлен, мы пишем об этом прямо. Страна программы не означает гражданство участника: проверь требования и часовой пояс дедлайна на официальном сайте.</p>
    {message && <p role={message.error ? "alert" : "status"} className={clsx("rounded-lg border px-4 py-3 text-sm", message.error ? "border-danger/25 bg-danger-soft text-danger" : "border-accent-line bg-accent-soft text-accent")}>{message.text}</p>}
    {results.length === 0 ? <div className="card py-12 text-center"><Search className="mx-auto size-7 text-subtle" /><h2 className="mt-3 font-semibold">Пока ничего не найдено</h2><p className="mt-1 text-sm text-muted">Попробуй другое слово или убери часть фильтров.</p><Button variant="secondary" className="mt-4" onClick={reset}>Сбросить фильтры</Button></div> : <div className="grid gap-4 md:grid-cols-2">
      {results.slice(0, limit).map((o) => {
        const past = !!o.deadline && o.deadline < today;
        const days = o.deadline ? daysBetween(today, o.deadline) : null;
        const inPlanner = planner.has(`${o.title}|${o.deadline}`);
        return <article key={o.id} className="card flex flex-col p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-wrap gap-1.5 text-[11px] font-medium"><span className="rounded-md bg-sunken px-2 py-1 text-muted">{o.kind === "competition" ? "Конкурс" : "Программа"}</span><span className="rounded-md bg-accent-soft px-2 py-1 text-accent">{FIELDS[o.field]}</span></div>
            <button type="button" onClick={() => setSaved((s) => s.includes(o.id) ? s.filter((id) => id !== o.id) : [...s, o.id])} aria-label={`${saved.includes(o.id) ? "Убрать из избранного" : "В избранное"}: ${o.title}`} aria-pressed={saved.includes(o.id)} className="rounded-md p-1 text-muted hover:bg-sunken hover:text-accent"><Bookmark className="size-4" fill={saved.includes(o.id) ? "currentColor" : "none"} /></button>
          </div>
          <h2 className="mt-3 text-base font-semibold leading-snug">{o.title}</h2><p className="mt-1 text-xs text-subtle">{o.organizer} · {REGIONS[o.region]}</p>
          <p className="mt-3 text-sm leading-relaxed text-muted">{o.description}</p>
          <dl className="mt-4 space-y-2 text-xs leading-relaxed"><div><dt className="font-medium text-ink">Кому подойдёт</dt><dd className="text-muted">{o.eligibility}</dd></div><div><dt className="font-medium text-ink">{COSTS[o.cost]}</dt><dd className="text-muted">{o.costNote}</dd></div></dl>
          <div className={clsx("mt-4 rounded-lg px-3 py-2.5 text-xs", past ? "bg-sunken text-muted" : days !== null && days <= 30 ? "bg-warn-soft text-warn" : "bg-sunken text-muted")}>
            <p className="flex items-center gap-1.5 font-semibold"><CalendarDays className="size-3.5" />{o.deadline ? `${past ? "Прошлый срок" : "Дедлайн"}: ${dateLabel(o.deadline)}` : o.rolling ? "Без фиксированного дедлайна" : "Новый дедлайн не объявлен"}{days !== null && days >= 0 && <span className="ml-auto whitespace-nowrap">{days === 0 ? "Сегодня" : `${days} дн.`}</span>}</p>
            <p className="mt-1 leading-relaxed">{o.deadlineNote}</p>
          </div>
          <div className="mt-auto flex flex-wrap items-center gap-2 pt-4"><a href={o.url} target="_blank" rel="noopener noreferrer" className={buttonClass("secondary", "sm")}>Официальный сайт<ArrowUpRight className="size-3.5" /></a>{o.deadline && !past && <Button size="sm" variant="ghost" disabled={pending || inPlanner} onClick={() => addToPlanner(o)}>{busy === o.id ? <Loader2 className="size-3.5 animate-spin" /> : inPlanner ? <Check className="size-3.5" /> : <CalendarDays className="size-3.5" />}{inPlanner ? "В моём плане" : "В мой план"}</Button>}</div>
        </article>;
      })}
    </div>}
    {results.length > limit && <div className="text-center"><Button variant="secondary" onClick={() => setLimit((n) => n + 12)}>Показать ещё · осталось {results.length - limit}</Button></div>}
    <p className="text-xs text-subtle">Избранное сохраняется в этом браузере. Добавленные дедлайны доступны в разделе «Путь».</p>
  </div>;
}
