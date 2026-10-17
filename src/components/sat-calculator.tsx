"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Calculator, Loader2, X } from "lucide-react";

import { Button } from "./ui";

const DESMOS_URL = "https://www.desmos.com/testing/collegeboard/graphing";

/** Keep the iframe mounted between questions and while the panel is closed. */
export function SatCalculator({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [activated, setActivated] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) setActivated(true);
    if (open && !dialog.open) dialog.show();
    else if (!open && dialog.open) dialog.close();
    return () => { if (dialog.open) dialog.close(); };
  }, [open]);

  const close = () => {
    dialogRef.current?.close();
    onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      id="sat-calculator"
      data-sat-calculator
      aria-labelledby="sat-calculator-title"
      onCancel={(event) => { event.preventDefault(); close(); }}
      onKeyDown={(event) => {
        if (event.key === "Escape") { event.preventDefault(); close(); }
      }}
      className="fixed inset-y-0 right-0 left-auto z-40 m-0 h-dvh max-h-none w-[min(52vw,520px)] max-w-none flex-col border-0 border-l border-line bg-surface p-0 text-ink shadow-lift open:flex"
    >
      <div className="flex h-14 flex-none items-center gap-2 border-b border-line px-4">
        <Calculator className="size-4 text-accent" aria-hidden />
        <h2 id="sat-calculator-title" className="min-w-0 flex-1 truncate text-sm font-semibold">Desmos · SAT Math</h2>
        <Button size="sm" variant="ghost" onClick={close} aria-label="Закрыть калькулятор">
          <X className="size-4" />
        </Button>
      </div>
      <div className="flex flex-none flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-line bg-sunken px-4 py-2 text-xs text-muted">
        <span>Графический калькулятор</span>
        <a href={DESMOS_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium hover:text-ink">
          Отдельная вкладка <ArrowUpRight className="size-3.5" aria-hidden />
        </a>
      </div>
      <div className="relative min-h-0 flex-1">
        {(activated || open) && (
          <iframe
            src={DESMOS_URL}
            title="Desmos — калькулятор SAT Math"
            className="absolute inset-0 h-full w-full border-0 bg-surface"
            referrerPolicy="no-referrer"
            onLoad={() => setLoaded(true)}
          />
        )}
        {!loaded && open && (
          <div role="status" className="pointer-events-none absolute inset-x-0 top-4 flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-xs text-muted shadow-card">
              <Loader2 className="size-3.5 animate-spin" />Загрузка Desmos…
            </span>
          </div>
        )}
      </div>
    </dialog>
  );
}
