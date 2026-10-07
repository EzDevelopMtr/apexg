export type MaterialButtonVariant = "primary" | "tinted" | "plain" | "destructive";
export type MaterialButtonSize = "md" | "sm" | "icon";

/*
  Buttons of the translucent "material" screens (the platform panel).

  Feedback lands on pointer-down, not on release: `active:scale-[0.97]` in
  100 ms, the press response of the apple-design guide. `destructive` is for
  actions that remove access; it is the only one that borrows a status hue.
*/
const BASE = [
  "inline-flex shrink-0 items-center justify-center gap-2 font-semibold tracking-[-0.005em]",
  "transition-[transform,background-color,color,opacity] duration-100 ease-out active:scale-[0.97]",
  "disabled:pointer-events-none disabled:opacity-40",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ink",
].join(" ");

const VARIANTS: Record<MaterialButtonVariant, string> = {
  primary: "bg-brand text-brand-contrast shadow-tile hover:bg-brand-strong",
  tinted: "bg-fill-2 text-body hover:bg-fill-3",
  plain: "text-brand-ink hover:bg-fill-1",
  destructive: "bg-danger-soft text-danger-ink hover:brightness-125",
};

const SIZES: Record<MaterialButtonSize, string> = {
  md: "h-10 rounded-xl px-4 text-sm",
  sm: "h-[34px] rounded-[10px] px-3 text-[13px]",
  icon: "size-[34px] rounded-full",
};

export function materialButton(
  variant: MaterialButtonVariant = "tinted",
  size: MaterialButtonSize = "md",
): string {
  return `${BASE} ${VARIANTS[variant]} ${SIZES[size]}`;
}

/** Classes for the page behind an open sheet: it dims and steps back. */
export function pushedBack(open: boolean): string {
  return `origin-top transition-[transform,filter] duration-600 ease-spring motion-reduce:transition-none ${open ? "scale-[0.985] brightness-[0.8] motion-reduce:scale-100" : ""}`;
}
