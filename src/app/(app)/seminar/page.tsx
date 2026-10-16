import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, ChevronRight, FileText } from "lucide-react";

import { COURSES, flatten } from "@/content";
import { PathMap } from "@/components/path-map";
import { ButtonLink, ProgressBar } from "@/components/ui";
import { currentUser } from "@/lib/auth";
import { formatDate } from "@/lib/date";
import { getDoneKeys, getWritings, nextLesson } from "@/lib/game";

export const metadata: Metadata = { title: "Проект: семинар" };
export const dynamic = "force-dynamic";

const SKILLS = [
  ["Question & Explore", "задавать исследовательские вопросы"],
  ["Understand & Analyze", "разбирать аргумент и приёмы автора"],
  ["Evaluate Perspectives", "сравнивать позиции и линзы"],
  ["Synthesize Ideas", "строить свой тезис из источников"],
  ["Transmit", "писать и редактировать работу"],
];

export default async function SeminarPage() {
  const user = await currentUser();
  if (!user) redirect("/signin");

  const course = COURSES.seminar;
  const [done, writings] = await Promise.all([getDoneKeys(user.id), getWritings(user.id)]);

  const entries = flatten(course);
  const finished = entries.filter((e) => done.has(e.key)).length;
  const next = nextLesson("seminar", done);
  const monthsDone = course.units.filter((u) => u.lessons.every((l) => done.has(`seminar/${l.id}`))).length;

  const works = entries
    .filter((e) => e.lesson.writing)
    .map((e) => ({ entry: e, writing: writings.get(e.key) }))
    .filter((w) => w.writing?.submittedAt);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Проект: читаем и пишем</h1>
          <p className="max-w-xl text-sm text-muted">
            Годовой курс в духе AP Seminar. Одна книга, двенадцать месяцев: читаем, разбираем аргументы, оцениваем доказательства и
            пишем собственные работы.
          </p>
        </div>

        <section className="card mb-10 flex flex-col gap-5 p-5 sm:flex-row">
          <div
            className="flex h-36 w-24 flex-none flex-col justify-between rounded-md p-3 text-white shadow-[4px_4px_0_#5f3f8d]"
            style={{ background: "linear-gradient(160deg, #7a52b3, #4e3478)" }}
            aria-hidden
          >
            <span className="font-serif text-[13px] font-semibold leading-tight">Frankenstein</span>
            <span className="text-[10px] text-white/75">Mary Shelley · 1818</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-seminar">
              Месяц {Math.min(12, monthsDone + 1)} из 12
            </p>
            <h2 className="mt-0.5 text-lg font-semibold">{next ? next.lesson.title : "Курс пройден"}</h2>
            <p className="text-sm text-muted">{next ? next.unit.title : "Все двенадцать месяцев позади. Итоговая работа — в твоём портфолио."}</p>
            <div className="mt-3 flex items-center gap-3">
              <ProgressBar value={finished} max={entries.length} tone="var(--seminar)" className="flex-1" />
              <span className="tabular text-xs font-medium text-muted">
                {finished}/{entries.length}
              </span>
            </div>
            {next && (
              <ButtonLink href={`/lesson/seminar/${next.lesson.id}`} className="mt-4" style={{ background: "var(--seminar)", boxShadow: "0 3px 0 #5f3f8d" }}>
                {finished === 0 ? "Начать первый месяц" : "Продолжить"}
              </ButtonLink>
            )}
          </div>
        </section>

        <div className="mx-auto max-w-md">
          <PathMap course={course} done={done} />
        </div>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <section className="card p-5">
          <h2 className="text-[15px] font-semibold">Мои работы</h2>
          {works.length === 0 ? (
            <p className="mt-1 text-sm text-muted">Здесь соберётся портфолио: каждая сданная работа — от первых вопросов до итогового эссе.</p>
          ) : (
            <ul className="mt-3 space-y-1">
              {works.map(({ entry, writing }) => (
                <li key={entry.key}>
                  <Link href={`/lesson/seminar/${entry.lesson.id}`} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-sunken">
                    <FileText className="size-4 flex-none text-seminar" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{entry.unit.title.split(" · ")[1]}</span>
                      <span className="block text-xs text-muted">
                        {writing!.words} слов · {formatDate(writing!.submittedAt!)}
                      </span>
                    </span>
                    <ChevronRight className="size-4 text-subtle" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-5">
          <h2 className="text-[15px] font-semibold">Книга</h2>
          <p className="mt-1 text-sm text-muted">Полный текст романа — прямо здесь, глава за главой.</p>
          <ButtonLink href="/seminar/read/letter-1" variant="secondary" size="sm" className="mt-3">
            Открыть читалку
          </ButtonLink>
        </section>

        <section className="card p-5">
          <h2 className="text-[15px] font-semibold">Чему учит курс</h2>
          <ul className="mt-3 space-y-2.5">
            {SKILLS.map(([name, text]) => (
              <li key={name} className="text-sm">
                <span className="font-medium">{name}</span> <span className="text-muted">— {text}</span>
              </li>
            ))}
          </ul>
          <a
            href="https://apstudents.collegeboard.org/courses/ap-seminar"
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-muted hover:text-ink"
          >
            Об AP Seminar на сайте College Board <ArrowUpRight className="size-3.5" />
          </a>
        </section>
      </aside>
    </div>
  );
}
