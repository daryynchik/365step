"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Sparkles } from "lucide-react";

import { generatePracticeAction } from "@/actions/lessons";
import { buttonClass } from "./ui";

/**
 * "More questions on this skill": opens a set nobody has shown this student
 * yet, generating a new one if needed (that can take up to a minute).
 */
export function MorePractice({ lessonKey, className, variant = "secondary" }: { lessonKey: string; className?: string; variant?: "primary" | "secondary" }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className={className}>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            setError(null);
            const res = await generatePracticeAction(lessonKey);
            if (res.ok) router.push(`/practice/${res.id}`);
            else setError(res.error);
          })
        }
        className={buttonClass(variant, "lg", "w-full")}
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
        {pending ? "Готовлю новые задания…" : "Ещё задания по навыку"}
      </button>
      {pending && <p className="mt-1.5 text-center text-xs text-muted">Подбираю материал и проверяю ответы — это может занять до минуты.</p>}
      {error && <p className="mt-1.5 text-center text-xs text-danger">{error}</p>}
    </div>
  );
}
