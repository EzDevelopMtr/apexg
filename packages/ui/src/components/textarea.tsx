import type { TextareaHTMLAttributes } from "react";
import Field from "./field";
import { controlClasses } from "./control-classes";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export default function Textarea({
  label,
  error,
  className = "",
  id,
  rows = 3,
  ...rest
}: TextareaProps) {
  const invalid = Boolean(error);

  return (
    <Field label={label} error={error} htmlFor={id}>
      <textarea
        id={id}
        rows={rows}
        aria-invalid={invalid || undefined}
        className={controlClasses(invalid, `px-4 ${className}`)}
        {...rest}
      />
    </Field>
  );
}
