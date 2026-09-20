/** Lo mínimo para decidir cuál de dos membresías de un cliente es la vigente. */
export interface MembershipPrecedence {
  state: number;
  startDate: string;
  createdAt: string | null;
}

/**
 * Cuál de dos membresías del mismo cliente es la vigente.
 *
 * La activa gana siempre. Entre dos activas, la que empieza después; y si
 * empiezan el mismo día —cambiar de plan a media mañana— desempata la hora de
 * creación, porque `start_date` es una fecha sin hora y las dos serían iguales.
 */
export function isNewer(
  candidate: MembershipPrecedence,
  current: MembershipPrecedence,
): boolean {
  if (candidate.state !== current.state) return candidate.state === 1;
  if (candidate.startDate !== current.startDate) {
    return candidate.startDate > current.startDate;
  }
  return (candidate.createdAt ?? "") > (current.createdAt ?? "");
}
