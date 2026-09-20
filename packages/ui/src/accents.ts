import type { AccentName } from "@apexg/core";

/**
 * Resolves the accent names `@apexg/core` uses into real classes.
 *
 * Same boundary as `icons.ts`: the domain package names a thing, this file
 * decides what it looks like. Written out in full rather than interpolated
 * (`bg-accent-${name}`) because Tailwind only generates the classes it can
 * actually see in the source.
 */

/**
 * The filled tile an accent paints.
 *
 * Which ink a tile takes follows the fill's brightness: lime and amber are too
 * bright to carry white and take `ink-on-light`, the rest take `ink-on-vivid`.
 * Neither is `brand-contrast`: that one belongs to the brand fill alone.
 */
export const ACCENT_TILE: Record<AccentName, string> = {
  green: "bg-accent-green text-ink-on-vivid",
  violet: "bg-accent-violet text-ink-on-vivid",
  fuchsia: "bg-accent-fuchsia text-ink-on-vivid",
  orange: "bg-accent-orange text-ink-on-vivid",
  teal: "bg-accent-teal text-ink-on-vivid",
  rose: "bg-accent-rose text-ink-on-vivid",
  lime: "bg-accent-lime text-ink-on-light",
  amber: "bg-accent-amber text-ink-on-light",
};

/** The wash a card lifts into on hover, and the border it borrows. */
export const ACCENT_GLOW: Record<AccentName, string> = {
  green: "from-accent-green/12 group-hover:border-accent-green/40",
  violet: "from-accent-violet/12 group-hover:border-accent-violet/40",
  fuchsia: "from-accent-fuchsia/12 group-hover:border-accent-fuchsia/40",
  orange: "from-accent-orange/12 group-hover:border-accent-orange/40",
  teal: "from-accent-teal/12 group-hover:border-accent-teal/40",
  rose: "from-accent-rose/12 group-hover:border-accent-rose/40",
  lime: "from-accent-lime/12 group-hover:border-accent-lime/40",
  amber: "from-accent-amber/12 group-hover:border-accent-amber/40",
};
