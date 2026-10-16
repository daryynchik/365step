"use client";

import { useCallback, useEffect, useState } from "react";
import { clsx } from "clsx";

/**
 * A two-way switch between the "full" mode of a task (listen / speak) and its
 * text alternative. The choice is remembered per browser, so a student who
 * cannot use audio sets it once.
 */

export function usePersistentMode<T extends string>(storageKey: string, initial: T, allowed: readonly T[]): [T, (mode: T) => void] {
  const [mode, setMode] = useState<T>(initial);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey) as T | null;
      if (saved && allowed.includes(saved)) setMode(saved);
    } catch {
      // Storage can be unavailable (private mode); the default still works.
    }
    // `allowed` is a constant list; read once per key.
  }, [storageKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const update = useCallback(
    (next: T) => {
      setMode(next);
      try {
        window.localStorage.setItem(storageKey, next);
      } catch {
        // Not remembered, but the switch still works for this session.
      }
    },
    [storageKey],
  );

  return [mode, update];
}

export interface ModeOption<T extends string> {
  value: T;
  icon: string;
  label: string;
}

export function ModeSwitch<T extends string>({
  value,
  options,
  onChange,
  label,
  className,
}: {
  value: T;
  options: [ModeOption<T>, ModeOption<T>];
  onChange: (value: T) => void;
  label: string;
  className?: string;
}) {
  return (
    <div className={clsx("flex w-full rounded-xl border border-line bg-sunken p-1", className)} role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={clsx(
            "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
            value === o.value ? "bg-surface text-ink shadow-card" : "text-muted hover:text-ink",
          )}
        >
          <span aria-hidden>{o.icon}</span>
          {o.label}
        </button>
      ))}
    </div>
  );
}
