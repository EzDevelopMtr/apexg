import type { ReactNode } from "react";

export interface FilterBarProps {
  /** Para qué son los filtros, leído por lectores de pantalla. */
  label: string;
  children: ReactNode;
}

/**
 * Fila de filtros sobre una tabla.
 *
 * Los filtros eran secciones del menú lateral ("Clientes activos", "En
 * mora"): un clic para salir de la tabla y otro para volver. Encima de la
 * tabla se leen como lo que son — otra forma de ver la misma lista.
 */
export default function FilterBar({ label, children }: FilterBarProps) {
  return (
    <div
      role="group"
      aria-label={label}
      className="flex flex-wrap items-center gap-2"
    >
      {children}
    </div>
  );
}
