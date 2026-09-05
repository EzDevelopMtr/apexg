import type { InputHTMLAttributes, ReactNode } from "react";
import Field from "./field";
import { controlClasses } from "./control-classes";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: ReactNode;
  error?: string;
}

export default function Input({
  label,
  icon,
  error,
  className = "",
  id,
  ...rest
}: InputProps) {
  const invalid = Boolean(error);

  return (
    <Field label={label} error={error} htmlFor={id}>
      <div className="relative">
        {icon && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-body-faint">
            {icon}
          </span>
        )}
        <input
          id={id}
          aria-invalid={invalid || undefined}
          className={controlClasses(
            invalid,
            `${icon ? "pl-12 pr-4" : "px-4"} ${className}`,
          )}
          {...rest}
        />
      </div>
    </Field>
  );
}
