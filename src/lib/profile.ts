/**
 * The student's goal — country, field, grade, graduation — and the personal
 * plan built from it.
 */

import { isFieldId } from "@/content/fields";
import { isCountryId, MIN_PLAN_DAYS, planFor, type Plan, type StudentProfile } from "@/content/plan";
import { one, run, str, num } from "./db";
import { addDays, nowIso, todayIso } from "./date";

export async function getProfile(userId: string): Promise<StudentProfile | null> {
  const row = await one("SELECT country, field, grade, graduation, start_date FROM student_profiles WHERE user_id = ?", [userId]);
  if (!row) return null;
  const country = str(row.country);
  const field = str(row.field);
  return {
    country: isCountryId(country) ? country : "undecided",
    field: isFieldId(field) ? field : "undecided",
    grade: num(row.grade, 11),
    graduation: str(row.graduation),
    startDate: str(row.start_date),
  };
}

export async function getPlan(userId: string): Promise<Plan | null> {
  const profile = await getProfile(userId);
  return profile ? planFor(profile) : null;
}

export interface ProfileInput {
  country: string;
  field: string;
  grade: number;
  /** "YYYY-MM" */
  graduationMonth: string;
}

export type SaveResult = { ok: true } | { ok: false; error: string };

export function validateProfile(input: ProfileInput, today = todayIso()): { ok: true; graduation: string } | { ok: false; error: string } {
  if (!isCountryId(input.country)) return { ok: false, error: "Выбери, куда хочешь поступать." };
  if (!isFieldId(input.field)) return { ok: false, error: "Выбери направление." };
  if (!Number.isInteger(input.grade) || input.grade < 7 || input.grade > 12) return { ok: false, error: "Укажи класс от 7 до 12." };
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(input.graduationMonth)) return { ok: false, error: "Укажи месяц и год окончания школы." };
  const graduation = `${input.graduationMonth}-01`;
  if (graduation < addDays(today, MIN_PLAN_DAYS)) return { ok: false, error: "До окончания школы должно оставаться хотя бы три недели." };
  if (graduation > addDays(today, 365 * 6)) return { ok: false, error: "Дата окончания слишком далеко — проверь год." };
  return { ok: true, graduation };
}

/**
 * Creates or updates the goal. The start date is kept when the goal changes,
 * so days already lived through stay in the plan and finished lessons stay
 * finished.
 */
export async function saveProfile(userId: string, input: ProfileInput): Promise<SaveResult> {
  const valid = validateProfile(input);
  if (!valid.ok) return valid;

  const existing = await one("SELECT start_date FROM student_profiles WHERE user_id = ?", [userId]);
  if (existing) {
    await run(
      "UPDATE student_profiles SET country = ?, field = ?, grade = ?, graduation = ?, updated_at = ? WHERE user_id = ?",
      [input.country, input.field, input.grade, valid.graduation, nowIso(), userId],
    );
  } else {
    await run(
      "INSERT INTO student_profiles (user_id, country, field, grade, graduation, start_date, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [userId, input.country, input.field, input.grade, valid.graduation, todayIso(), nowIso()],
    );
  }
  return { ok: true };
}
