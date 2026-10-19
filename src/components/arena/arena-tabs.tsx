"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flag, Shirt, ShoppingBag } from "lucide-react";
import { clsx } from "clsx";

const TABS = [
  { href: "/arena", label: "Соревнование", icon: Flag },
  { href: "/arena/shop", label: "Магазин", icon: ShoppingBag },
  { href: "/arena/wardrobe", label: "Гардероб", icon: Shirt },
];

export function ArenaTabs() {
  const path = usePathname();
  return (
    <nav className="flex w-full gap-1 rounded-xl border border-line bg-sunken p-1 text-[13px] sm:w-auto sm:text-sm" aria-label="Разделы соревнований">
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = href === "/arena" ? path === "/arena" || path.startsWith("/arena/race") || path.startsWith("/arena/calibrate") : path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={clsx(
              "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 font-medium sm:flex-none sm:px-3",
              active ? "bg-surface shadow-card" : "text-muted hover:text-ink",
            )}
          >
            <Icon className="size-4" /> {label}
          </Link>
        );
      })}
    </nav>
  );
}
