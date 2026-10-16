import "server-only";

import data from "./frankenstein.json";

/**
 * Mary Shelley, Frankenstein; or, The Modern Prometheus (1818).
 * Public domain. Text from Project Gutenberg eBook #84, split into sections.
 */

export interface BookSection {
  id: string;
  title: string;
  paragraphs: string[];
}

export const BOOK = {
  title: "Frankenstein; or, The Modern Prometheus",
  author: "Mary Shelley",
  year: 1818,
  source: "https://www.gutenberg.org/ebooks/84",
};

const SECTIONS = data as BookSection[];

export function bookSections(): BookSection[] {
  return SECTIONS;
}

export function bookSection(id: string): { section: BookSection; prev: BookSection | null; next: BookSection | null } | null {
  const index = SECTIONS.findIndex((s) => s.id === id);
  if (index < 0) return null;
  return { section: SECTIONS[index], prev: SECTIONS[index - 1] ?? null, next: SECTIONS[index + 1] ?? null };
}
