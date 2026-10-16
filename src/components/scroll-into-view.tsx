"use client";

import { useEffect } from "react";

/** Scrolls the current lesson into view once, so a long path opens where you are. */
export function ScrollIntoView({ targetId }: { targetId: string }) {
  useEffect(() => {
    const el = document.getElementById(targetId);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    // Only when it is below the fold; near the top the page already shows it.
    if (rect.top > window.innerHeight * 0.8) {
      el.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [targetId]);
  return null;
}
