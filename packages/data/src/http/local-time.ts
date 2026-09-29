/**
 * `HH:MM` local from a UTC instant.
 *
 * Read through a real `Date` rather than sliced off the ISO string: the
 * backend stores TIMESTAMPTZ, and slicing would show UTC's clock, which is
 * five hours ahead of Colombia's.
 */
export function localTime(instant: string): string {
  return new Date(instant).toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
