import type { ReactNode } from "react";
import { Check, Info } from "lucide-react";

export interface TextFieldProps {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly placeholder?: string;
  /** Fixed text before the value, e.g. "@" or "…ts.net/". */
  readonly prefix?: string;
  readonly mono?: boolean;
  /** Validation message: present means invalid. Shown as it is typed. */
  readonly error?: string | null;
  /** Shown when there is no error; `confirmed` marks it as a valid result. */
  readonly hint?: ReactNode;
  readonly confirmed?: boolean;
}

/** Label, input and an inline line that validates while typing, not on submit. */
export default function TextField(props: TextFieldProps) {
  const { id, label, value, onChange, placeholder, prefix, mono, error, hint, confirmed } = props;
  const lineId = `${id}-line`;
  return (
    <div className="[&+&]:mt-3">
      <label htmlFor={id} className="mb-1.5 block text-[13px] text-body-soft">
        {label}
      </label>
      <div
        className={`flex h-[42px] items-center rounded-[11px] border bg-fill-2 px-3 transition-[border-color,box-shadow] duration-150 focus-within:border-brand focus-within:ring-[3px] focus-within:ring-brand-soft ${error ? "border-danger-ink" : "border-transparent"}`}
      >
        {prefix && <span className="whitespace-nowrap text-sm text-body-faint">{prefix}</span>}
        <input
          id={id}
          value={value}
          placeholder={placeholder}
          spellCheck={!mono}
          autoComplete="off"
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error || hint ? lineId : undefined}
          onChange={(event) => onChange(event.target.value)}
          className={`min-w-0 flex-1 border-0 bg-transparent outline-none placeholder:text-body-faint ${mono ? "font-mono text-sm" : "text-[15px]"}`}
        />
      </div>
      {(error || hint) && (
        <p id={lineId} className={`mt-1.5 flex min-h-[18px] items-center gap-1.5 text-xs ${error ? "text-danger-ink" : "text-body-faint"}`}>
          {error ? <Info size={13} /> : confirmed ? <Check size={13} /> : null}
          {error ?? hint}
        </p>
      )}
    </div>
  );
}
