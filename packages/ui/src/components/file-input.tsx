"use client";

import { useRef } from "react";
import { Paperclip, X } from "lucide-react";
import Field from "./field";
import { describedBy, errorId } from "./control-classes";

export interface FileInputProps {
  id: string;
  /** User-facing label, in Spanish. */
  label?: string;
  /** Comma-separated `accept` list, e.g. "image/*,application/pdf". */
  accept?: string;
  error?: string;
  hint?: string;
  file: File | null;
  onChange: (file: File | null) => void;
}

/**
 * A file picker that shows what was chosen and lets it be removed.
 *
 * The native control is kept in the DOM but visually hidden rather than
 * replaced: it is what actually opens the picker, carries the accept filter,
 * and keeps the field reachable by keyboard and by a screen reader. A
 * `<div onClick>` would have looked the same and dropped all three.
 */
export default function FileInput({
  id,
  label,
  accept,
  error,
  hint,
  file,
  onChange,
}: FileInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const messageId = errorId(id, error);
  const hintId = hint ? `${id}-hint` : undefined;

  return (
    <Field label={label} error={error} htmlFor={id} errorId={messageId}>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        className="sr-only"
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={describedBy(messageId, hintId)}
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
      />

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={`flex flex-1 items-center gap-3 rounded-xl border px-4 py-3 text-left transition hover:bg-panel ${
            error ? "border-danger-line" : "border-line"
          } bg-surface`}
        >
          <Paperclip size={18} className="shrink-0 text-body-faint" />
          <span
            className={`truncate ${file ? "text-body" : "text-body-faint"}`}
          >
            {file ? file.name : "Seleccionar archivo..."}
          </span>
        </button>

        {file && (
          <button
            type="button"
            onClick={() => {
              onChange(null);
              // The native input keeps its value after a removal, so picking
              // the same file again would fire no change event.
              if (inputRef.current) inputRef.current.value = "";
            }}
            aria-label="Quitar archivo"
            className="rounded-lg p-2 text-body-faint transition hover:bg-surface hover:text-body"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {hint && (
        <p id={hintId} className="mt-2 text-sm text-body-soft">
          {hint}
        </p>
      )}
    </Field>
  );
}
