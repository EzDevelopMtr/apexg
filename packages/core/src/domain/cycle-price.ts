import type { Money } from "./money";

/**
 * The price a membership cycle is billed at.
 *
 * The cycle in course keeps the price agreed when it began, whatever the
 * catalogue says now: editing a plan affects future enrolments, not the ones
 * already registered — the edit dialog promises exactly that, and the backend
 * validates every payment against `client_memberships.agreed_price` (RNF-07).
 * A renewal opens a new cycle, priced at the plan's current price.
 *
 * `agreed` is absent only for clients loaded without it (older fixtures); then
 * the catalogue price is the best information there is.
 */
export function cyclePrice(catalogPrice: Money, agreed: Money | undefined, renews: boolean): Money {
  if (renews || agreed === undefined) return catalogPrice;
  return agreed;
}
