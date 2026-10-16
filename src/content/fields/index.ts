import type { Course } from "../types";
import { BUSINESS, BUSINESS_TEXTS } from "./business";
import { CS, CS_TEXTS } from "./cs";
import { ENGINEERING, ENGINEERING_TEXTS } from "./engineering";
import type { FieldMeta } from "./make";
import { MEDICINE, MEDICINE_TEXTS } from "./medicine";
import { SCIENCE, SCIENCE_TEXTS } from "./science";
import { SOCIAL, SOCIAL_TEXTS } from "./social";

export type { FieldMeta } from "./make";
export { FIELD_OPTIONS, isFieldId, type FieldId } from "./ids";

export const FIELDS: FieldMeta[] = [MEDICINE, ENGINEERING, CS, BUSINESS, SOCIAL, SCIENCE];

/** Reading in the student's field: one unit per field, ten texts each. */
export const READING: Course = {
  id: "reading",
  title: "Чтение по специальности",
  short: "Чтение",
  description: "Короткие академические тексты по выбранному направлению, по пять вопросов к каждому.",
  units: [
    { id: MEDICINE.id, title: MEDICINE.title, subtitle: "Организм, лекарства, исследования", lessons: MEDICINE_TEXTS },
    { id: ENGINEERING.id, title: ENGINEERING.title, subtitle: "Конструкции, энергия, материалы", lessons: ENGINEERING_TEXTS },
    { id: CS.id, title: CS.title, subtitle: "Алгоритмы, сети, данные, безопасность", lessons: CS_TEXTS },
    { id: BUSINESS.id, title: BUSINESS.title, subtitle: "Рынки, деньги, решения", lessons: BUSINESS_TEXTS },
    { id: SOCIAL.id, title: SOCIAL.title, subtitle: "Психология, история, право", lessons: SOCIAL_TEXTS },
    { id: SCIENCE.id, title: SCIENCE.title, subtitle: "Физика, химия, экология", lessons: SCIENCE_TEXTS },
  ],
};
