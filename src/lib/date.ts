/**
 * Date helpers. Everything stored is an ISO 'YYYY-MM-DD' string compared as
 * text, and all of it is UTC so a lesson finished at 23:50 and a streak computed
 * a moment later agree about which day it is.
 */

export type IsoDate = string;

export function todayIso(now: Date = new Date()): IsoDate {
  return now.toISOString().slice(0, 10);
}

export function nowIso(now: Date = new Date()): string {
  return now.toISOString();
}

export function parseIso(date: IsoDate): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

export function addDays(date: IsoDate, days: number): IsoDate {
  const d = parseIso(date);
  d.setUTCDate(d.getUTCDate() + days);
  return todayIso(d);
}

export function daysBetween(from: IsoDate, to: IsoDate): number {
  return Math.round((parseIso(to).getTime() - parseIso(from).getTime()) / 86_400_000);
}

/** The Monday of the week containing `date`. */
export function weekStart(date: IsoDate = todayIso()): IsoDate {
  const weekday = parseIso(date).getUTCDay(); // 0 = Sunday
  return addDays(date, -((weekday + 6) % 7));
}

/** The last `count` days ending at `end`, oldest first. */
export function lastNDays(count: number, end: IsoDate = todayIso()): IsoDate[] {
  return Array.from({ length: count }, (_, i) => addDays(end, -(count - 1 - i)));
}

const WEEKDAYS = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

export function weekdayShort(date: IsoDate): string {
  return WEEKDAYS[parseIso(date).getUTCDay()];
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "long", timeZone: "UTC" });
}

/** "5 минут назад", "вчера", "3 дня назад" — for activity feeds. */
export function timeAgo(iso: string, now: Date = new Date()): string {
  const minutes = Math.round((now.getTime() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return "только что";
  if (minutes < 60) return `${minutes} ${plural(minutes, "минуту", "минуты", "минут")} назад`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} ${plural(hours, "час", "часа", "часов")} назад`;
  const days = Math.round(hours / 24);
  if (days === 1) return "вчера";
  if (days < 30) return `${days} ${plural(days, "день", "дня", "дней")} назад`;
  return formatDate(iso);
}

/** Russian plural forms: plural(5, "очко", "очка", "очков") -> "очков". */
export function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = Math.abs(n) % 10;
  const mod100 = Math.abs(n) % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}
