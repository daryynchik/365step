"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { BookOpenText, LogOut, Route, Swords, Users } from "lucide-react";
import { clsx } from "clsx";

import { signOutAction } from "@/actions/auth";
import { Avatar, Coin, Flame, Logo } from "./ui";

const NAV = [
  { href: "/path", label: "Путь", icon: Route },
  { href: "/seminar", label: "Проект", icon: BookOpenText },
  { href: "/friends", label: "Друзья", icon: Users },
  { href: "/arena", label: "Арена", icon: Swords },
] as const;

export interface ShellUser {
  name: string;
  email: string;
  level: number;
  balance: number;
  streak: number;
  activeToday: boolean;
  pendingRequests: number;
}

function UserMenu({ user }: { user: ShellUser }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Меню профиля"
        className="rounded-full"
      >
        <Avatar name={user.name} size={32} />
      </button>
      {open && (
        <div className="card absolute right-0 top-11 z-50 w-60 p-1.5 shadow-lift">
          <div className="px-3 py-2">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="truncate text-xs text-muted">{user.email}</p>
            <p className="mt-1 text-xs text-muted">Уровень {user.level}</p>
          </div>
          <div className="my-1 h-px bg-line" />
          <button
            type="button"
            disabled={pending}
            onClick={() => start(() => signOutAction())}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-muted hover:bg-sunken hover:text-ink"
          >
            <LogOut className="size-4" /> Выйти
          </button>
        </div>
      )}
    </div>
  );
}

function Stats({ user }: { user: ShellUser }) {
  return (
    <div className="flex items-center gap-1">
      <span
        className="tabular flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold"
        title={user.activeToday ? "Серия продолжается" : "Пройди урок сегодня, чтобы не потерять серию"}
      >
        <Flame className="size-5" active={user.activeToday} />
        <span className={user.activeToday ? "text-flame" : "text-subtle"}>{user.streak}</span>
      </span>
      <Link
        href="/arena"
        className="tabular flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold hover:bg-sunken"
        title="Очки — их можно потратить на арене"
      >
        <Coin className="size-5" />
        <span className="text-[#9a7414]">{user.balance.toLocaleString("ru-RU")}</span>
      </Link>
    </div>
  );
}

export function AppShell({ user, children }: { user: ShellUser; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = NAV.find((n) => pathname.startsWith(n.href))?.href ?? "/path";

  return (
    <div className="min-h-dvh pb-20 md:pb-0">
      <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
          <Link href="/path" aria-label="365step — на главную">
            <Logo className="text-[17px]" />
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Основная навигация">
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                aria-current={active === href ? "page" : undefined}
                className={clsx(
                  "relative flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  active === href ? "bg-surface text-ink shadow-card ring-1 ring-line" : "text-muted hover:text-ink",
                )}
              >
                <Icon className="size-4" />
                {label}
                {href === "/friends" && user.pendingRequests > 0 && (
                  <span className="grid size-4 place-items-center rounded-full bg-danger text-[10px] font-bold text-white">
                    {user.pendingRequests}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Stats user={user} />
            <UserMenu user={user} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 md:py-8">{children}</main>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
        aria-label="Навигация"
      >
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={active === href ? "page" : undefined}
            className={clsx(
              "relative flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium",
              active === href ? "text-accent" : "text-subtle",
            )}
          >
            <Icon className="size-[22px]" strokeWidth={active === href ? 2.4 : 2} />
            {label}
            {href === "/friends" && user.pendingRequests > 0 && (
              <span className="absolute right-[calc(50%-18px)] top-1.5 size-2 rounded-full bg-danger" />
            )}
          </Link>
        ))}
      </nav>
    </div>
  );
}
