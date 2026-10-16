import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { GoalForm } from "@/components/goal-form";
import { Logo } from "@/components/ui";
import { currentUser } from "@/lib/auth";
import { getProfile } from "@/lib/profile";

export const metadata: Metadata = { title: "Твоя цель" };
export const dynamic = "force-dynamic";

export default async function StartPage() {
  const user = await currentUser();
  if (!user) redirect("/signin");
  const profile = await getProfile(user.id);

  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-4 py-5">
        <Logo className="text-lg" />
        {profile && (
          <Link href="/path" className="text-sm font-medium text-muted hover:text-ink">
            Отмена
          </Link>
        )}
      </header>
      <main className="mx-auto max-w-3xl px-4 pb-20 pt-4">
        <h1 className="text-3xl font-bold tracking-tight">{profile ? "Изменить цель" : `${user.name.split(" ")[0]}, давай построим твой путь`}</h1>
        <p className="mb-10 mt-2 max-w-xl text-muted">
          Четыре вопроса — и у тебя будет свой план до выпуска: IELTS и SAT, тексты по специальности и все шаги поступления, распределённые по
          дням.
        </p>
        <GoalForm
          editing={Boolean(profile)}
          defaults={
            profile
              ? { country: profile.country, field: profile.field, grade: profile.grade, graduationMonth: profile.graduation.slice(0, 7) }
              : null
          }
        />
      </main>
    </div>
  );
}
