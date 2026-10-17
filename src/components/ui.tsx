import Link from "next/link";
import { clsx } from "clsx";
import type { ComponentProps } from "react";

// ---------------------------------------------------------------- buttons --

type Variant = "primary" | "secondary" | "ghost" | "danger" | "danger-solid";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-accent text-white shadow-[0_3px_0_var(--accent-hover)] hover:bg-accent-hover active:translate-y-[2px] active:shadow-[0_1px_0_var(--accent-hover)]",
  secondary:
    "bg-surface text-ink border border-line-strong shadow-[0_2px_0_var(--line-strong)] hover:bg-sunken active:translate-y-[1px] active:shadow-none",
  ghost: "text-muted hover:text-ink hover:bg-sunken",
  danger: "bg-surface text-danger border border-line-strong hover:bg-danger-soft",
  "danger-solid":
    "bg-danger text-white shadow-[0_3px_0_#9b3524] hover:bg-[#a83a28] active:translate-y-[2px] active:shadow-[0_1px_0_#9b3524]",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5 rounded-lg",
  md: "h-10 px-4 text-sm gap-2 rounded-[10px]",
  lg: "h-12 px-6 text-[15px] gap-2 rounded-xl",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string): string {
  return clsx(
    "inline-flex select-none items-center justify-center font-semibold whitespace-nowrap transition-[background,transform,box-shadow] duration-100",
    "disabled:pointer-events-none disabled:opacity-50",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button className={buttonClass(variant, size, className)} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}

// ------------------------------------------------------------------ misc --

export function Logo({ className }: { className?: string }) {
  return (
    <span className={clsx("inline-flex items-center gap-2 font-bold tracking-tight text-ink", className)}>
      <img src="/brand/step-mark.png" alt="" className="size-[1.5em] object-contain" width={32} height={32} />
      365step
    </span>
  );
}

const AVATAR_TONES = ["#3563c9", "#2e7d4f", "#c0711b", "#7a52b3", "#c0442f", "#3a7f8c"];

export function Avatar({ name, size = 32, className }: { name: string; size?: number; className?: string }) {
  const hash = [...name].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);
  const tone = AVATAR_TONES[hash % AVATAR_TONES.length];
  return (
    <span
      className={clsx("inline-grid flex-none place-items-center rounded-full font-semibold text-white", className)}
      style={{ width: size, height: size, background: tone, fontSize: size * 0.42 }}
      aria-hidden
    >
      {name.trim().charAt(0).toUpperCase()}
    </span>
  );
}

export function ProgressBar({ value, max, tone = "var(--accent)", className }: { value: number; max: number; tone?: string; className?: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div
      className={clsx("h-2.5 overflow-hidden rounded-full bg-sunken", className)}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${pct}%`, background: tone }} />
    </div>
  );
}

export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <h2 className="text-[15px] font-semibold">{children}</h2>
      {action}
    </div>
  );
}

export function ErrorNote({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="rounded-lg border border-danger/25 bg-danger-soft px-3 py-2 text-sm text-danger">
      {children}
    </p>
  );
}

export function Flame({ className, active = true }: { className?: string; active?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        d="M12 2.5c.6 3.1-1.2 4.9-2.7 6.6C7.8 10.8 6.5 12.4 6.5 15a5.5 5.5 0 0 0 11 0c0-2.3-1-4-2.2-5.4-.2 1.5-.9 2.5-2 3 .5-3.6-.2-7.4-1.3-10.1Z"
        fill={active ? "var(--flame)" : "var(--line-strong)"}
      />
    </svg>
  );
}

export function Coin({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <circle cx="12" cy="12" r="9" fill="var(--coin)" />
      <circle cx="12" cy="12" r="6" fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth="1.5" />
      <path d="M12 8.5v7M9.5 12h5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
