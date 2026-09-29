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

/**
 * Las clases de un botón, aparte del componente.
 *
 * Para que un enlace que navega —la acción principal de un listado— se vea
 * exactamente como un botón sin tener que ser uno: un `<button>` que llama a
 * `router.push` pierde abrir en otra pestaña y el clic con la rueda.
 */
export function buttonClasses(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
): string {
  return `
    inline-flex items-center justify-center gap-2 rounded-xl font-semibold
    transition disabled:cursor-not-allowed disabled:opacity-50
    ${VARIANTS[variant]} ${SIZES[size]}
  `;
}
