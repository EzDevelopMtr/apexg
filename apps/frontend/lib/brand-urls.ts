/**
 * Where a gym's uploaded logo is served (app/api/brand/[gym]/logo). Plain
 * function, no server-only imports: the gym layouts and the platform panel
 * both build it.
 */
export function logoUrl(slug: string): string {
  return `/api/brand/${encodeURIComponent(slug)}/logo`;
}
