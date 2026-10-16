"use client";

import { useEffect } from "react";

import { Button, Logo } from "@/components/ui";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 text-center">
      <Logo className="text-lg" />
      <div className="max-w-md">
        <h1 className="text-2xl font-bold">Что-то пошло не так</h1>
        <p className="mt-1 text-muted">Попробуй ещё раз. Если ошибка повторяется — обнови страницу через минуту.</p>
        {error.digest && <p className="mt-3 font-mono text-xs text-subtle">Код: {error.digest}</p>}
      </div>
      <Button onClick={reset}>Попробовать снова</Button>
    </div>
  );
}
