import type { IsoDate } from "./calendar";
import type { Money } from "./money";
import { ZERO, add, atLeastZero, subtract } from "./money";

declare const savingsPocketIdBrand: unique symbol;
export type SavingsPocketId = string & {
  readonly [savingsPocketIdBrand]: true;
};

export function toSavingsPocketId(value: string): SavingsPocketId {
  return value as SavingsPocketId;
}

declare const savingsContributionIdBrand: unique symbol;
export type SavingsContributionId = string & {
  readonly [savingsContributionIdBrand]: true;
};

export function toSavingsContributionId(
  value: string,
): SavingsContributionId {
  return value as SavingsContributionId;
}

/**
 * Un destino al que el gimnasio aparta plata: una máquina nueva, el arriendo
 * de diciembre, una reforma.
 *
 * `goal` es a lo que se quiere llegar, no un tope: nada impide seguir
 * abonando después de alcanzarlo — quien ahorra para una máquina de tres
 * millones no rechaza el aporte que la deja en tres y medio.
 */
export interface SavingsPocket {
  readonly id: SavingsPocketId;
  /** Nombre visible, en español. */
  readonly name: string;
  readonly goal: Money;
  /** Cerrado: ya se gastó o se descartó. No admite aportes nuevos. */
  readonly closed: boolean;
  readonly createdOn: IsoDate;
}

/**
 * Plata apartada hacia un bolsillo.
 *
 * Es un registro financiero: se agrega, nunca se reescribe (RNF-07), igual
 * que un pago o un egreso. Para deshacer un aporte se registra otro en
 * contra, y así queda el rastro de ambos.
 */
export interface SavingsContribution {
  readonly id: SavingsContributionId;
  readonly pocketId: SavingsPocketId;
  readonly amount: Money;
  readonly contributedOn: IsoDate;
  /** Por qué se apartó, en español. Puede ir vacío. */
  readonly notes: string;
  /** Usuario que lo registró (RNF-07: los movimientos son trazables). */
  readonly recordedBy: string;
}

/** Lo que una tarjeta de bolsillo necesita mostrar. */
export interface PocketProgress {
  readonly pocket: SavingsPocket;
  readonly saved: Money;
  /** Lo que falta para la meta. Nunca negativo: pasada la meta, es cero. */
  readonly remaining: Money;
  /** 0 a 100. Se recorta en 100 aunque lo ahorrado supere la meta. */
  readonly percent: number;
  readonly reached: boolean;
}

/** Lo ahorrado en un bolsillo, sumando sus aportes. */
export function savedInPocket(
  contributions: readonly SavingsContribution[],
  pocketId: SavingsPocketId,
): Money {
  return contributions
    .filter((contribution) => contribution.pocketId === pocketId)
    .reduce<Money>((running, one) => add(running, one.amount), ZERO);
}

export function totalSaved(
  contributions: readonly SavingsContribution[],
): Money {
  return contributions.reduce<Money>(
    (running, one) => add(running, one.amount),
    ZERO,
  );
}

const FULL_PERCENT = 100;

/**
 * El avance, partiendo de un total ya sumado.
 *
 * Existe aparte de `pocketProgress` porque el backend suma los aportes en la
 * base: traerlos todos al navegador solo para volver a sumarlos crecería con
 * los años. El reparto entre meta y ahorrado sigue siendo dominio, así que
 * vive aquí y no en un hook.
 */
export function progressFromSaved(
  pocket: SavingsPocket,
  saved: Money,
): PocketProgress {
  // Una meta en cero no tiene porcentaje que calcular; se informa como
  // alcanzada en vez de dividir por cero.
  const percent =
    pocket.goal === 0
      ? FULL_PERCENT
      : Math.min(
          FULL_PERCENT,
          Math.round((saved / pocket.goal) * FULL_PERCENT),
        );

  return {
    pocket,
    saved,
    remaining: atLeastZero(subtract(pocket.goal, saved)),
    percent,
    reached: saved >= pocket.goal,
  };
}

export function pocketProgress(
  pocket: SavingsPocket,
  contributions: readonly SavingsContribution[],
): PocketProgress {
  return progressFromSaved(pocket, savedInPocket(contributions, pocket.id));
}

export type ContributionRefusal =
  | "notPositive"
  | "pocketClosed"
  | "unknownPocket";

export const CONTRIBUTION_REFUSAL_LABELS: Record<
  ContributionRefusal,
  string
> = {
  notPositive: "El monto debe ser mayor que cero.",
  pocketClosed: "Ese bolsillo está cerrado: no admite aportes nuevos.",
  unknownPocket: "Ese bolsillo ya no existe.",
};

/**
 * Por qué no se puede registrar este aporte, o `null` si sí se puede.
 *
 * No rechaza superar la meta a propósito: la meta orienta, no limita.
 */
export function contributionRefusal(
  pocket: SavingsPocket | undefined,
  amount: Money,
): ContributionRefusal | null {
  if (!pocket) return "unknownPocket";
  if (pocket.closed) return "pocketClosed";
  return amount <= 0 ? "notPositive" : null;
}

/** Los bolsillos abiertos, que son los que admiten aportes. */
export function openPockets(
  pockets: readonly SavingsPocket[],
): readonly SavingsPocket[] {
  return pockets.filter((pocket) => !pocket.closed);
}
