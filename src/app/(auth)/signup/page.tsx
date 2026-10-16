import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { SignUpForm } from "@/components/auth-forms";
import { currentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Регистрация" };
export const dynamic = "force-dynamic";

export default async function SignUpPage() {
  if (await currentUser()) redirect("/path");

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">Создать аккаунт</h1>
      <p className="mb-6 mt-1 text-sm text-muted">Минута — и можно начинать первый урок.</p>
      <SignUpForm />
      <p className="mt-6 text-center text-sm text-muted">
        Уже есть аккаунт?{" "}
        <Link href="/signin" className="font-medium text-ink underline-offset-4 hover:underline">
          Войти
        </Link>
      </p>
    </>
  );
}
