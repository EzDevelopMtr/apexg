import type { SelectHTMLAttributes } from "react";
import Field from "./field";
import { controlClasses, describedBy, errorId } from "./control-classes";

/** One choice in a {@link Select}. Labels are user-facing Spanish. */
export interface SelectOption {
  readonly value: string;
  readonly label: string;
  readonly disabled?: boolean;
}

export interface SelectProps extends Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "children"
> {
  label?: string;
  error?: string;
  options: readonly SelectOption[];
  /** Shown as a disabled first entry when no value is selected. */
  placeholder?: string;
}

/**
 * Options are passed as data rather than as `<option>` children, so callers
 * feed them straight from a catalogue in `@apexg/core` instead of hardcoding
 * business values in markup.
 */
export default function Select({
  label,
  error,
  options,
  placeholder,
  className = "",
  id,
  "aria-describedby": describedByProp,
  ...rest
}: SelectProps) {
  const invalid = Boolean(error);
  const messageId = errorId(id, error);

  return (
    <Field label={label} error={error} htmlFor={id} errorId={messageId}>
      <select
        id={id}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy(messageId, describedByProp)}
        className={controlClasses(invalid, `px-4 ${className}`)}
        {...rest}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}
