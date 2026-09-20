import { BadRequestException } from "@nestjs/common";

import { toCents } from "../shared/money-amount.util.js";

/** Vista fusionada (existente + patch) que se valida como un todo (RF-12). */
export interface MembershipTypePlan {
  price: string;
  minimumPayment: string | null;
  trainerShare: string | null;
  businessShare: string | null;
  allowsPartialPayment: boolean;
  isPromotional: boolean;
}

/**
 * Reglas de negocio de un plan (RF-12, SRS §4.1, §4.4).
 *
 * Se valida la combinación completa, no campo por campo, porque las
 * invariantes cruzan varios campos: en un PATCH que solo cambia `price`,
 * hay que volver a comprobar que siga cuadrando con `trainerShare` +
 * `businessShare` ya guardados, no solo con lo que llegó en el body.
 */
export function validateMembershipTypePlan(plan: MembershipTypePlan): void {
  const priceCents = toCents(plan.price);
  if (priceCents <= 0) {
    throw new BadRequestException("El valor del plan debe ser mayor que cero.");
  }

  if (plan.minimumPayment !== null) {
    const minimumCents = toCents(plan.minimumPayment);
    if (minimumCents <= 0) {
      throw new BadRequestException("El abono mínimo debe ser mayor que cero.");
    }
    if (minimumCents > priceCents) {
      throw new BadRequestException(
        "El abono mínimo no puede superar el valor del plan.",
      );
    }
  }

  if (
    plan.isPromotional &&
    (plan.allowsPartialPayment || plan.minimumPayment !== null)
  ) {
    throw new BadRequestException(
      "Las promociones se pagan de forma completa: no admiten abono.",
    );
  }

  const hasTrainerShare = plan.trainerShare !== null;
  const hasBusinessShare = plan.businessShare !== null;
  if (hasTrainerShare !== hasBusinessShare) {
    throw new BadRequestException(
      "trainerShare y businessShare deben definirse juntos, o ninguno de los dos.",
    );
  }

  if (hasTrainerShare && hasBusinessShare) {
    // El `if` de arriba garantiza que ambos son no-nulos aquí.
    const sum =
      toCents(plan.trainerShare as string) +
      toCents(plan.businessShare as string);
    if (sum !== priceCents) {
      throw new BadRequestException(
        "trainerShare + businessShare debe ser igual al valor del plan.",
      );
    }
  }
}
