import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";

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

const BASE = `
  inline-flex items-center justify-center gap-2 rounded-xl font-semibold
  transition disabled:cursor-not-allowed disabled:opacity-50
`;

interface Shared {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

/**
 * With `href` it renders an anchor, otherwise a button.
 *
 * The distinction is not cosmetic: something that goes to an address has to be
 * a link, or the browser cannot open it in a new tab, offer "save as", or let
 * a screen reader announce it as a link. Styling one as the other is the usual
 * way those get lost.
 */
export type ButtonProps =
  | (Shared &
      Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
        href?: undefined;
      })
  | (Shared &
      Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children"> & {
        href: string;
      });

export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...rest
}: ButtonProps) {
  const classes = `${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`;

  if (typeof rest.href === "string") {
    const anchor = rest as AnchorHTMLAttributes<HTMLAnchorElement>;
    return (
      <a className={classes} {...anchor}>
        {children}
      </a>
    );
  }

  const { type = "button", ...button } =
    rest as ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    // Defaults to "button": an untyped button inside a form submits it, which
    // has caused accidental saves in this codebase before.
    <button type={type} className={classes} {...button}>
      {children}
    </button>
  );
}
