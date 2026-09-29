import { BadRequestException } from '@nestjs/common';

import { toCents } from '../shared/money-amount.util.js';

/** RF-19: rechaza montos inválidos; el abono mínimo no aplica si el pago salda. */
export function checkAmount(
  amountCents: number,
  balanceBeforeCents: number,
  plan: { minimumPayment: string | null; allowsPartialPayment: boolean },
): void {
  if (amountCents <= 0) {
    throw new BadRequestException('El monto debe ser mayor que cero.');
  }
  if (amountCents > balanceBeforeCents) {
    throw new BadRequestException('El monto no puede superar el saldo pendiente.');
  }

  const settles = amountCents === balanceBeforeCents;
  if (settles) {
    return;
  }

  if (!plan.allowsPartialPayment) {
    throw new BadRequestException(
      'Este plan no admite abonos: debe pagarse de forma completa.',
    );
  }
  if (plan.minimumPayment !== null && amountCents < toCents(plan.minimumPayment)) {
    throw new BadRequestException(
      `El abono mínimo para este plan es ${plan.minimumPayment}.`,
    );
  }
}
