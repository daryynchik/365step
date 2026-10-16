import Link from "next/link";

import { Logo } from "@/components/ui";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto w-full max-w-6xl px-4 py-5">
        <Link href="/">
          <Logo className="text-lg" />
        </Link>
      </header>
      <main className="flex flex-1 items-start justify-center px-4 pb-16 pt-8 sm:items-center sm:pt-0">
        <div className="rise w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
