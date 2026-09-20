import type { TextareaHTMLAttributes } from "react";
import Field from "./field";
import { controlClasses, describedBy, errorId } from "./control-classes";

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
  "aria-describedby": describedByProp,
  ...rest
}: TextareaProps) {
  const invalid = Boolean(error);
  const messageId = errorId(id, error);

  return (
    <Field label={label} error={error} htmlFor={id} errorId={messageId}>
      <textarea
        id={id}
        rows={rows}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy(messageId, describedByProp)}
        className={controlClasses(invalid, `px-4 ${className}`)}
        {...rest}
      />
    </Field>
  );
}
