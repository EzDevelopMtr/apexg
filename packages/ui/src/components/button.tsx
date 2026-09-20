import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md";

// The two filled variants take opposite foregrounds, and neither is a matter
// of taste: the brand blue carries white at 5.5:1, while the danger fill is a
// pale salmon that only reaches 2.3:1 against it and needs the dark ink.
const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-brand text-brand-contrast hover:bg-brand-strong",
  secondary: "border border-line bg-panel text-body-muted hover:bg-surface",
  ghost: "text-body-soft hover:bg-surface hover:text-body",
  danger: "bg-danger-ink text-ink-on-light hover:bg-danger-strong",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-5 py-3",
};

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
      className={`
        inline-flex items-center justify-center gap-2 rounded-xl font-semibold
        transition disabled:cursor-not-allowed disabled:opacity-50
        ${VARIANTS[variant]} ${SIZES[size]} ${className}
      `}
      {...rest}
    >
      {children}
    </button>
  );
}
