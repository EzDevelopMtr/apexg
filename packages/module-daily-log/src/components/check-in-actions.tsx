"use client";

import { LogIn, LogOut } from "lucide-react";
import { Button } from "@apexg/ui";

export interface CheckInActionsProps {
  inside: boolean;
  blocked: boolean;
  /** Bloqueado por algo que un cobro resuelve: mora o cupo agotado. */
  payable: boolean;
  onCheckIn: () => void;
  onCheckOut: () => void;
  onCharge: () => void;
}

/**
 * El único botón que tiene sentido para esta persona ahora mismo.
 *
 * Quien ya está dentro solo puede salir, nunca entrar dos veces. A quien está
 * bloqueado se le ofrece el cobro en vez de un botón apagado: la persona está
 * en el mostrador, y el paso útil es cobrarle. Retirado o sin membresía no
 * tiene nada que cobrar aquí, así que no se ofrece nada.
 */
export default function CheckInActions({
  inside,
  blocked,
  payable,
  onCheckIn,
  onCheckOut,
  onCharge,
}: CheckInActionsProps) {
  if (inside) {
    return (
      <Button variant="secondary" size="sm" onClick={onCheckOut}>
        <LogOut size={16} />
        Registrar salida
      </Button>
    );
  }

  if (payable) {
    return (
      <Button size="sm" onClick={onCharge}>
        Renovar o pagar día
      </Button>
    );
  }

  if (blocked) return null;

  return (
    <Button variant="secondary" size="sm" onClick={onCheckIn}>
      <LogIn size={16} />
      Registrar ingreso
    </Button>
  );
}
