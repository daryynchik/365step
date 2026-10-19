import Link from "next/link";
import { X } from "lucide-react";

/** Shown the moment a lesson is tapped, while the server builds it. */
export default function Loading() {
  return (
    <div className="flex min-h-dvh flex-col" aria-busy="true" aria-label="Загрузка урока">
      <header className="sticky top-0 z-30 border-b border-line bg-bg/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-2 px-4 sm:gap-4">
          <Link href="/path" aria-label="Выйти из урока" className="rounded-lg p-1.5 text-subtle hover:bg-sunken hover:text-ink">
            <X className="size-5" />
          </Link>
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-sunken">
            <div className="h-full w-[4%] rounded-full bg-line" />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 animate-pulse px-4 pb-40 pt-8">
        <div className="h-3 w-32 rounded bg-sunken" />
        <div className="mt-3 h-8 w-3/4 rounded-lg bg-sunken" />
        <div className="mt-3 h-4 w-1/2 rounded bg-sunken" />
        <div className="mt-8 space-y-3">
          <div className="h-4 rounded bg-sunken" />
          <div className="h-4 rounded bg-sunken" />
          <div className="h-4 w-5/6 rounded bg-sunken" />
        </div>
        <div className="mt-8 h-40 rounded-xl bg-sunken" />
      </main>
    </div>
  );
}
