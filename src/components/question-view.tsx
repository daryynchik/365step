"use client";

import { clsx } from "clsx";

import type { DataTable, Question } from "@/content/types";
import { parseNumber, type Response } from "@/lib/answers";
import { RichText } from "./rich-text";

export function QuestionView({
  question,
  response,
  onRespond,
  checked,
  disabled,
}: {
  question: Question;
  response: Response | null;
  onRespond: (r: Response) => void;
  /** After checking: highlight the right option and the user's wrong one. */
  checked: boolean;
  disabled: boolean;
}) {
  const numeric = question.kind === "input" && question.answers.every((a) => parseNumber(a) !== null);
  return (
    <div className="space-y-5">
      {question.table && <DataTableView table={question.table} />}

      {question.passages?.map((p, i) => (
        <div key={i} className="rounded-xl border border-line bg-surface px-5 py-4">
          {p.label && <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-muted">{p.label}</p>}
          <RichText text={p.text} className="passage" />
        </div>
      ))}

      <p className="whitespace-pre-line text-[17px] font-semibold leading-snug">{question.prompt}</p>

      {question.kind === "choice" ? (
        <div className="space-y-2.5" role="radiogroup">
          {question.options.map((option, i) => {
            const selected = response === i;
            const result = checked ? (i === question.answer ? "right" : selected ? "wrong" : undefined) : undefined;
            return (
              <button
                key={i}
                type="button"
                className="option"
                role="radio"
                aria-checked={selected}
                aria-pressed={selected}
                data-result={result}
                disabled={disabled}
                onClick={() => onRespond(i)}
              >
                <span className="option-key">{String.fromCharCode(65 + i)}</span>
                <span className="pt-0.5 text-[15px] leading-snug">{option}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <div>
          <label htmlFor="answer" className="mb-1.5 block text-sm text-muted">
            {numeric ? "Введи ответ — число, десятичную дробь или дробь вида 3/4" : "Впиши ответ — слово или число, без лишних слов"}
          </label>
          <input
            id="answer"
            inputMode={numeric ? "decimal" : "text"}
            autoCapitalize="none"
            spellCheck={false}
            autoComplete="off"
            autoFocus
            disabled={disabled}
            value={typeof response === "string" ? response : ""}
            onChange={(e) => onRespond(e.target.value.slice(0, 40))}
            className={clsx(
              "tabular h-14 w-full max-w-sm rounded-xl border-[1.5px] border-b-[3px] bg-surface px-4 text-xl font-semibold outline-none",
              "border-line-strong focus:border-rw",
            )}
            placeholder="Ответ"
          />
        </div>
      )}
    </div>
  );
}

export function DataTableView({ table }: { table: DataTable }) {
  return (
    <figure className="overflow-x-auto">
      {table.caption && <figcaption className="mb-2 text-sm font-semibold">{table.caption}</figcaption>}
      <table className="tabular w-full min-w-max border-collapse overflow-hidden rounded-lg border border-line text-sm">
        <thead className="bg-sunken">
          <tr>
            {table.head.map((h, i) => (
              <th key={i} className="border border-line px-3 py-2 text-left font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j} className="border border-line bg-surface px-3 py-2">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
