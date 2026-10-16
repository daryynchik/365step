import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpenText, Check, Flag, Lock, Route, Star, Swords } from "lucide-react";

import { TRACK } from "@/content/track";
import { DemoButton } from "@/components/auth-forms";
import { ButtonLink, Logo } from "@/components/ui";
import { currentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

function PathPreview() {
  const nodes = [
    { x: 0, state: "done" },
    { x: 46, state: "done" },
    { x: 70, state: "current" },
    { x: 46, state: "locked" },
    { x: 0, state: "locked" },
  ] as const;
  return (
    <div className="card relative mx-auto w-full max-w-sm overflow-hidden p-6">
      <div className="rounded-xl bg-accent px-4 py-3 text-white shadow-[0_4px_0_var(--accent-hover)]">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-white/70">Дни 1–5</p>
        <p className="font-bold">Неделя 1</p>
      </div>
      <ol className="mt-8 flex flex-col items-center gap-6 pb-2">
        {nodes.map((n, i) => (
          <li key={i} className={`path-node relative ${n.state === "current" ? "mt-8" : ""}`} style={{ "--x": `${n.x}px` } as React.CSSProperties}>
            {n.state === "current" && (
              <span className="start-bubble absolute -top-10 left-1/2 rounded-lg border border-line bg-surface px-3 py-1 text-xs font-bold uppercase text-rw shadow-card">
                Дальше
              </span>
            )}
            <span
              className={`node-button ${n.state === "current" ? "node-current" : ""}`}
              data-state={n.state === "current" ? "open" : n.state}
              style={n.state === "current" ? ({ "--node": "#3563c9", "--node-shadow": "#274c9e" } as React.CSSProperties) : undefined}
            >
              {n.state === "done" ? <Check className="size-7" strokeWidth={2.6} /> : n.state === "locked" ? <Lock className="size-6" /> : <Star className="size-7" fill="currentColor" />}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default async function Home() {
  if (await currentUser()) redirect("/path");

  const steps = TRACK.flatMap((d) => d.steps);
  const questions = steps.reduce((n, s) => n + s.lesson.questions.length, 0);

  const features = [
    {
      icon: Route,
      title: "Одна программа",
      text: `${TRACK.length} дней, ${steps.length} уроков, ${questions} заданий. IELTS и SAT English через день, SAT Math каждый день. Listening и Speaking можно проходить и без звука.`,
    },
    {
      icon: Flag,
      title: "Поступление",
      text: "Выбор вузов, дедлайны, активности, Personal Statement, UCAS и стипендии — шаги поступления прямо в программе, с планировщиком дедлайнов.",
    },
    {
      icon: BookOpenText,
      title: "Проект: семинар",
      text: "Год с «Франкенштейном» Мэри Шелли: 12 месяцев чтения, анализа аргументов и письменных работ, как в AP Seminar.",
    },
    {
      icon: Swords,
      title: "Друзья и арена",
      text: "Рейтинг среди друзей, а очки за уроки — это оружие и щиты для твоего 3D-бойца. Вызывай друзей на бой.",
    },
  ];

  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
        <Logo className="text-lg" />
        <div className="flex items-center gap-2">
          <ButtonLink href="/signin" variant="ghost" size="sm">
            Войти
          </ButtonLink>
          <ButtonLink href="/signup" size="sm">
            Регистрация
          </ButtonLink>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4">
        <section className="grid items-center gap-12 py-12 md:grid-cols-2 md:py-20">
          <div>
            <h1 className="text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl">
              Каждый день —<br />
              шаг к поступлению.
            </h1>
            <p className="mt-5 max-w-md text-lg text-muted">
              IELTS, SAT и поступление за рубеж — в одной программе из коротких уроков. И друзья, с которыми не хочется пропускать.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/signup" size="lg">
                Начать бесплатно
              </ButtonLink>
              <DemoButton />
            </div>
            <p className="mt-4 text-sm text-subtle">Демо открывает аккаунт с прогрессом, друзьями и боями на арене.</p>
          </div>
          <PathPreview />
        </section>

        <section className="grid gap-4 pb-20 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, text }) => (
            <div key={title} className="card p-6">
              <Icon className="size-6 text-accent" />
              <h2 className="mt-4 font-semibold">{title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{text}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-xs text-subtle sm:flex-row sm:justify-between">
          <span>365step</span>
          <span>
            SAT и AP — товарные знаки College Board, IELTS — British Council, IDP и Cambridge. Они не связаны с этим сайтом.{" "}
            <Link href="https://satsuite.collegeboard.org/practice" className="underline-offset-2 hover:underline">
              Официальная практика
            </Link>
          </span>
        </div>
      </footer>
    </div>
  );
}
