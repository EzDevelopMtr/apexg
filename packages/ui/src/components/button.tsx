import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { ButtonSize, ButtonVariant } from "./button-classes";
import { buttonClasses } from "./button-classes";

export type { ButtonSize, ButtonVariant } from "./button-classes";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

export default function Button({
  variant = "primary",
  size = "md",
  type = "button",
  className = "",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      // Defaults to "button": an untyped button inside a form submits it,
      // which has caused accidental saves in this codebase before.
      type={type}
      className={`${buttonClasses(variant, size)} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
