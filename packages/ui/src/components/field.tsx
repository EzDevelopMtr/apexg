import type { ReactNode } from "react";

export interface FieldProps {
  /** User-facing label, in Spanish. */
  label?: string;
  /** Validation message. Its presence also marks the control as invalid. */
  error?: string;
  /** Id of the control being labelled. */
  htmlFor?: string;
  children: ReactNode;
}

/**
 * Label, control and error message.
 *
 * Extracted so `Input`, `Select` and `Textarea` share one layout instead of
 * each repeating the same markup and Tailwind classes.
 */
export default function Field({ label, error, htmlFor, children }: FieldProps) {
  return (
    <div>
      {label && (
        <label
          htmlFor={htmlFor}
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          {label}
        </label>
      )}
      {children}
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
