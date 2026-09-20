"use client";

import { useEffect, useRef, useState } from "react";
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
 * Whether a file matches an `accept` list.
 *
 * The browser applies `accept` to the picker only — a dropped or pasted file
 * never passes through it, so without this a `.exe` would be accepted here and
 * rejected by the server after the upload.
 */
function matchesAccept(file: File, accept?: string): boolean {
  if (!accept) return true;
  return accept.split(",").some((entry) => {
    const pattern = entry.trim();
    if (pattern.endsWith("/*")) {
      return file.type.startsWith(pattern.slice(0, -1));
    }
    return file.type === pattern;
  });
}

/**
 * The image on the clipboard, renamed.
 *
 * A screenshot pasted from WhatsApp or the system snipping tool arrives called
 * "image.png" for every payment ever recorded. The timestamp is what makes the
 * stored receipts tellable apart when someone opens the folder.
 */
function pastedImage(items: DataTransferItemList): File | null {
  for (const item of items) {
    if (item.kind !== "file") continue;
    const file = item.getAsFile();
    if (!file?.type.startsWith("image/")) continue;

    const extension = file.type.split("/")[1] ?? "png";
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    return new File([file], `comprobante-${stamp}.${extension}`, {
      type: file.type,
    });
  }
  return null;
}

/** The clickable, droppable target. Split out to keep `FileInput` readable. */
function DropZone({
  file,
  invalid,
  onOpen,
  onDropped,
}: {
  file: File | null;
  invalid: boolean;
  onOpen: () => void;
  onDropped: (file: File | undefined) => void;
}) {
  const [dragging, setDragging] = useState(false);

  const tone = dragging
    ? "border-brand bg-brand-soft"
    : invalid
      ? "border-danger-line bg-surface"
      : "border-line bg-surface hover:bg-panel";

  return (
    <button
      type="button"
      onClick={onOpen}
      onDragOver={(event) => {
        // Without preventDefault the browser navigates to the dropped file
        // instead of handing it over.
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        onDropped(event.dataTransfer.files[0]);
      }}
      className={`flex flex-1 items-center gap-3 rounded-xl border border-dashed px-4 py-3 text-left transition ${tone}`}
    >
      <Paperclip size={18} className="shrink-0 text-body-faint" />
      <span className={`truncate ${file ? "text-body" : "text-body-faint"}`}>
        {file ? file.name : "Seleccionar, arrastrar o pegar (Ctrl+V)"}
      </span>
    </button>
  );
}

/**
 * A file picker that also takes a paste or a drop.
 *
 * Pasting is the fast path for the real case: the client sends the transfer
 * screenshot over WhatsApp, and Ctrl+V beats saving it and hunting for it in
 * Downloads. The listener sits on the document rather than on this field, so
 * it works without having to click the field first — but only while the field
 * is empty, so a paste can never silently replace a receipt already chosen.
 *
 * The native control stays in the DOM, visually hidden rather than replaced:
 * it is what opens the picker, carries the accept filter, and keeps the field
 * reachable by keyboard and screen reader. A `<div onClick>` would have looked
 * the same and dropped all three.
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

  useEffect(() => {
    if (file) return;

    const onPaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      const image = items && pastedImage(items);
      if (image && matchesAccept(image, accept)) {
        event.preventDefault();
        onChange(image);
      }
    };

    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [file, accept, onChange]);

  const take = (candidate: File | undefined) => {
    if (candidate && matchesAccept(candidate, accept)) onChange(candidate);
  };

  const clear = () => {
    onChange(null);
    // The native input keeps its value after a removal, so picking the SAME
    // file again would fire no change event.
    if (inputRef.current) inputRef.current.value = "";
  };

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
        onChange={(event) => take(event.target.files?.[0])}
      />

      <div className="flex items-center gap-3">
        <DropZone
          file={file}
          invalid={Boolean(error)}
          onOpen={() => inputRef.current?.click()}
          onDropped={take}
        />

        {file && (
          <button
            type="button"
            onClick={clear}
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
