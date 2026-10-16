import { BookOpen, Flag, Headphones, Mic, PenLine, Sigma, Star, type LucideIcon } from "lucide-react";

import type { CourseId, Lesson } from "@/content/types";

/** One muted colour per course, so the path tells you what kind of lesson is next. */
export const COURSE_TONE: Record<CourseId, { main: string; dark: string; soft: string }> = {
  ielts: { main: "#b8483f", dark: "#8f3029", soft: "var(--ielts-soft)" },
  "sat-rw": { main: "#3563c9", dark: "#274c9e", soft: "var(--rw-soft)" },
  "sat-math": { main: "#c0711b", dark: "#975712", soft: "var(--math-soft)" },
  admissions: { main: "#2f7f86", dark: "#225f64", soft: "var(--admissions-soft)" },
  reading: { main: "#5a7d2a", dark: "#435e1f", soft: "#eef3e6" },
  vocab: { main: "#a14a6a", dark: "#7c3851", soft: "#f6eaef" },
  seminar: { main: "#7a52b3", dark: "#5f3f8d", soft: "var(--seminar-soft)" },
};

/** Neutral tone for review and mock sections. */
export const REVIEW_TONE = { main: "#56606e", dark: "#3f4752", soft: "#eceef1" };

export function lessonIcon(courseId: CourseId, lesson: Lesson): { icon: LucideIcon; filled: boolean } {
  if (lesson.listening) return { icon: Headphones, filled: false };
  if (lesson.speaking) return { icon: Mic, filled: false };
  if (lesson.writing) return { icon: PenLine, filled: false };
  if (lesson.reading) return { icon: BookOpen, filled: false };
  if (courseId === "admissions") return { icon: Flag, filled: true };
  if (courseId === "sat-math") return { icon: Sigma, filled: false };
  return { icon: Star, filled: true };
}
