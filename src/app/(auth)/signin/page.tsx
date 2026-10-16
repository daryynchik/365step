import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { DemoButton, SignInForm } from "@/components/auth-forms";
import { currentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Вход" };
export const dynamic = "force-dynamic";

export default async function SignInPage() {
  if (await currentUser()) redirect("/path");

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">С возвращением</h1>
      <p className="mb-6 mt-1 text-sm text-muted">Продолжим с того места, где ты остановился.</p>
      <SignInForm />
      <div className="my-6 flex items-center gap-3 text-xs text-subtle">
        <span className="h-px flex-1 bg-line" /> или <span className="h-px flex-1 bg-line" />
      </div>
      <DemoButton className="w-full">Войти в демо-аккаунт</DemoButton>
      <p className="mt-6 text-center text-sm text-muted">
        Ещё нет аккаунта?{" "}
        <Link href="/signup" className="font-medium text-ink underline-offset-4 hover:underline">
          Зарегистрироваться
        </Link>
      </p>
    </>
  );
}
