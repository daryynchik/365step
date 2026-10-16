"use client";

import { useActionState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

import { demoLoginAction, signInAction, signUpAction, type FormState } from "@/actions/auth";
import { Button, ErrorNote } from "./ui";

const EMPTY: FormState = {};

function Field({ label, hint, ...props }: React.ComponentProps<"input"> & { label: string; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      <input
        {...props}
        className="h-11 w-full rounded-[10px] border border-line-strong bg-surface px-3 text-[15px] outline-none focus:border-accent"
      />
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

function Submit({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending && <Loader2 className="size-4 animate-spin" />}
      {children}
    </Button>
  );
}

export function SignUpForm() {
  const [state, action] = useActionState(signUpAction, EMPTY);
  return (
    <form action={action} className="space-y-4">
      <Field label="Имя" name="name" autoComplete="given-name" required minLength={2} maxLength={40} placeholder="Алия" />
      <Field label="Email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
      <Field label="Пароль" name="password" type="password" autoComplete="new-password" required minLength={8} hint="Не короче 8 символов." />
      {state.error && <ErrorNote>{state.error}</ErrorNote>}
      <Submit>Создать аккаунт</Submit>
    </form>
  );
}

export function SignInForm() {
  const [state, action] = useActionState(signInAction, EMPTY);
  return (
    <form action={action} className="space-y-4">
      <Field label="Email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" />
      <Field label="Пароль" name="password" type="password" autoComplete="current-password" required />
      {state.error && <ErrorNote>{state.error}</ErrorNote>}
      <Submit>Войти</Submit>
    </form>
  );
}

export function DemoButton({ className, children = "Посмотреть демо" }: { className?: string; children?: React.ReactNode }) {
  const [pending, start] = useTransition();
  return (
    <Button variant="secondary" size="lg" className={className} disabled={pending} onClick={() => start(() => demoLoginAction())}>
      {pending && <Loader2 className="size-4 animate-spin" />}
      {children}
    </Button>
  );
}
