/**
 * The student's goal: where, what and until when. Kept free of course content
 * so the goal form in the browser can use it without loading every lesson.
 */

import type { FieldId } from "./fields/ids";

// ------------------------------------------------------------ profile --

export type CountryId = "usa" | "uk" | "canada" | "europe" | "asia" | "undecided";

export interface Country {
  id: CountryId;
  title: string;
  /** Typical main application deadline: month (1–12) and day, in the graduation year. */
  deadline: { month: number; day: number };
  deadlineNote: string;
}

export const COUNTRIES: Country[] = [
  { id: "usa", title: "США", deadline: { month: 1, day: 1 }, deadlineNote: "Regular Decision в большинстве вузов США — около 1 января; Early Decision и Early Action — в ноябре." },
  { id: "uk", title: "Великобритания", deadline: { month: 1, day: 14 }, deadlineNote: "Основной дедлайн UCAS — в январе; Оксфорд, Кембридж и медицина — в середине октября." },
  { id: "canada", title: "Канада", deadline: { month: 1, day: 15 }, deadlineNote: "Большинство канадских вузов принимают заявки до января–февраля; у программ свои сроки." },
  { id: "europe", title: "Европа", deadline: { month: 3, day: 1 }, deadlineNote: "В Европе сроки сильно различаются: от января до лета. Проверь каждую программу." },
  { id: "asia", title: "Азия", deadline: { month: 1, day: 15 }, deadlineNote: "Корея, Япония, Сингапур, Гонконг: обычно с декабря по март, у каждого вуза свои сроки." },
  { id: "undecided", title: "Пока не решил", deadline: { month: 1, day: 1 }, deadlineNote: "Пока страна не выбрана, план ориентируется на самые ранние типичные сроки — январь." },
];

export function isCountryId(value: string): value is CountryId {
  return COUNTRIES.some((c) => c.id === value);
}

export interface StudentProfile {
  country: CountryId;
  field: FieldId;
  /** School grade when the plan was created (8–12). */
  grade: number;
  /** ISO date, first day of the graduation month. */
  graduation: string;
  /** ISO date the plan started. Day 1 of the plan. */
  startDate: string;
}

// ----------------------------------------------------------- dates --

const DAY_MS = 86_400_000;

export function toDate(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}

export function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function addDays(isoDate: string, days: number): string {
  return iso(new Date(toDate(isoDate).getTime() + days * DAY_MS));
}

export function daysBetween(from: string, to: string): number {
  return Math.round((toDate(to).getTime() - toDate(from).getTime()) / DAY_MS);
}

export const MIN_PLAN_DAYS = 21;
export const MAX_PLAN_DAYS = 1000;

/** The application deadline the plan works towards. */
export function applicationDeadline(profile: Pick<StudentProfile, "country" | "graduation">): string {
  const country = COUNTRIES.find((c) => c.id === profile.country) ?? COUNTRIES[0];
  const year = Number(profile.graduation.slice(0, 4));
  const deadline = `${year}-${String(country.deadline.month).padStart(2, "0")}-${String(country.deadline.day).padStart(2, "0")}`;
  // Applications cannot be due after the student has finished school.
  return deadline < profile.graduation ? deadline : addDays(profile.graduation, -30);
}

