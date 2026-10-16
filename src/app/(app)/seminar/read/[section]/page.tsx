import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { sectionLabel } from "@/content";
import { BOOK, bookSection, bookSections } from "@/content/book";

type Params = Promise<{ section: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { section } = await params;
  return { title: `${sectionLabel(section)} · Frankenstein` };
}

export default async function ReaderPage({ params }: { params: Params }) {
  const { section: id } = await params;
  const found = bookSection(id);
  if (!found) notFound();
  const { section, prev, next } = found;

  return (
    <div className="grid gap-8 lg:grid-cols-[200px_minmax(0,1fr)]">
      <nav className="hidden lg:block" aria-label="Оглавление">
        <div className="sticky top-20 max-h-[calc(100dvh-6rem)] overflow-y-auto pr-2">
          <Link href="/seminar" className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
            <ChevronLeft className="size-4" /> К семинару
          </Link>
          <ol className="space-y-0.5 text-sm">
            {bookSections().map((s) => (
              <li key={s.id}>
                <Link
                  href={`/seminar/read/${s.id}`}
                  aria-current={s.id === id ? "page" : undefined}
                  className={`block rounded-md px-2 py-1 ${s.id === id ? "bg-seminar-soft font-semibold text-seminar" : "text-muted hover:text-ink"}`}
                >
                  {sectionLabel(s.id)}
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </nav>

      <article className="mx-auto w-full max-w-[680px]">
        <Link href="/seminar" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-ink lg:hidden">
          <ChevronLeft className="size-4" /> К семинару
        </Link>
        <p className="text-sm text-muted">
          {BOOK.author} · {BOOK.title}
        </p>
        <h1 className="mb-8 mt-1 font-serif text-4xl font-semibold">{section.title}</h1>

        <div className="reader">
          {section.paragraphs.map((p, i) => (
            <p key={i} id={`p-${i}`}>
              {p}
            </p>
          ))}
        </div>

        <div className="mt-12 flex items-center justify-between border-t border-line pt-6">
          {prev ? (
            <Link href={`/seminar/read/${prev.id}`} className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink">
              <ChevronLeft className="size-4" /> {sectionLabel(prev.id)}
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link href={`/seminar/read/${next.id}`} className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink">
              {sectionLabel(next.id)} <ChevronRight className="size-4" />
            </Link>
          ) : (
            <Link href="/seminar" className="text-sm font-medium text-seminar">
              Конец романа — к семинару
            </Link>
          )}
        </div>
        <p className="mt-8 text-xs text-subtle">
          Текст: Project Gutenberg, eBook #84. Произведение находится в общественном достоянии.
        </p>
      </article>
    </div>
  );
}
