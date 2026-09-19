/**
 * Accent names used to tell one module apart from another at a glance.
 *
 * Like {@link IconName}, these are names rather than colours: `core` knows
 * nothing about CSS, and `@apexg/ui` resolves each one to real classes.
 *
 * They mark identity, never state. The status family (ok / warn / danger)
 * still owns meaning — a module tile and an "Activo" badge never share a
 * screen, so a green tile cannot be mistaken for a green signal.
 *
 * No blue: the brand accent is one, and a card that borrowed it would read as
 * "the current one" rather than as itself.
 */
export type AccentName =
  | "green"
  | "violet"
  | "fuchsia"
  | "orange"
  | "teal"
  | "rose"
  | "lime"
  | "amber";
