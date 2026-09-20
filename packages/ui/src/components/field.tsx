import type { ReactNode } from "react";

export interface FieldProps {
  /** User-facing label, in Spanish. */
  label?: string;
  /** Validation message. Its presence also marks the control as invalid. */
  error?: string;
  /** Id of the control being labelled. */
  htmlFor?: string;
  /**
   * Id given to the error message so the control can point at it with
   * `aria-describedby`. Without it `aria-invalid` tells a screen reader that
   * something is wrong but never what.
   */
  errorId?: string;
  children: ReactNode;
}

/**
 * Label, control and error message.
 *
 * Extracted so `Input`, `Select` and `Textarea` share one layout instead of
 * each repeating the same markup and Tailwind classes.
 */
export default function Field({
  label,
  error,
  htmlFor,
  errorId,
  children,
}: FieldProps) {
  return (
    <div>
      {label && (
        <label
          htmlFor={htmlFor}
          className="mb-2 block text-sm font-medium text-body-muted"
        >
          {label}
        </label>
      )}
      {children}
      {error && (
        <p id={errorId} role="alert" className="mt-2 text-sm text-danger-ink">
          {error}
        </p>
      )}
    </div>
  );
}
