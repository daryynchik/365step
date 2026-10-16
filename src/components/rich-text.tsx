import { Fragment } from "react";

/**
 * Renders the small markup used in course content (see content/types.ts):
 * paragraphs on blank lines, "• " bullets, **bold** and __underline__.
 */

function inline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|__[^_]+__)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
    if (part.startsWith("__") && part.endsWith("__")) {
      return (
        <u key={i} className="decoration-2 underline-offset-4">
          {part.slice(2, -2)}
        </u>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

export function RichText({ text, className }: { text: string; className?: string }) {
  const blocks = text.split(/\n\s*\n/);
  return (
    <div className={className}>
      {blocks.map((block, i) => {
        const lines = block.split("\n");
        const bullets = lines.filter((l) => l.startsWith("• "));
        if (bullets.length > 0 && bullets.length === lines.length) {
          return (
            <ul key={i} className="my-2 space-y-1.5">
              {lines.map((line, j) => (
                <li key={j} className="flex gap-2.5">
                  <span className="mt-[0.6em] size-1.5 flex-none rounded-full bg-subtle" aria-hidden />
                  <span>{inline(line.slice(2))}</span>
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} className="my-2 whitespace-pre-line first:mt-0 last:mb-0">
            {inline(block)}
          </p>
        );
      })}
    </div>
  );
}
