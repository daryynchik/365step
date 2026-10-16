import { STUDIO_COURSES } from "./studio";
import { CAREER_COURSES } from "./career";
import { IELTS_COURSES } from "./ielts";
import { PROJECT_COURSES } from "./projects";
import { RESEARCH_COURSES } from "./research";
import { SAT_COURSES } from "./sat";
import type { SeedCourse } from "./types";

export { ACHIEVEMENTS } from "./achievements";
export { OPPORTUNITIES } from "./opportunities";
export type * from "./types";

export const COURSES: SeedCourse[] = [
  ...SAT_COURSES,
  ...IELTS_COURSES,
  ...RESEARCH_COURSES,
  ...PROJECT_COURSES,
  ...CAREER_COURSES,
  ...STUDIO_COURSES,
];

/** Track display order on the Learn page. */
export const TRACKS = ["SAT", "IELTS", "Research", "Projects", "Career"] as const;
