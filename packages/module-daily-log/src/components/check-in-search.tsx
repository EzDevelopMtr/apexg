"use client";

import { useState } from "react";
import type { FocusEvent, ReactNode } from "react";
import { Search } from "lucide-react";
import { Input } from "@apexg/ui";

export interface CheckInSearchProps {
  value: string;
  onChange: (value: string) => void;
  /** Las filas que se muestran mientras la caja tiene el foco. */
  children: ReactNode;
}

/** Tres filas: sugiere que hay más abajo sin enterrar la bitácora del día. */
const THREE_ROWS = "max-h-60";

/**
 * La caja de búsqueda y su lista desplegable.
 *
 * Quién sale en la lista lo decide quien la usa; esto solo sabe cuándo
 * mostrarla y cuándo esconderla.
 */
export default function CheckInSearch({
  value,
  onChange,
  children,
}: CheckInSearchProps) {
  const [open, setOpen] = useState(false);

  /**
   * Se cierra solo cuando el foco sale del bloque entero, no del campo.
   *
   * Un `onBlur` a secas en el campo se dispararía antes de que el clic sobre
   * un resultado aterrizara, así que la lista desaparecía bajo el puntero y
   * el botón no llegaba a pulsarse. `relatedTarget` es hacia dónde va el
   * foco: mientras siga dentro, la lista debe quedarse abierta.
   */
  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
  };

  return (
    <div onFocus={() => setOpen(true)} onBlur={handleBlur}>
      <Input
        id="attendance-search"
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        icon={<Search size={20} />}
        placeholder="Nombre del cliente..."
        aria-label="Buscar cliente para registrar ingreso"
        aria-expanded={open}
      />

      {open && (
        <div
          className={`mt-3 space-y-3 overflow-y-auto ${THREE_ROWS}`}
          role="listbox"
          aria-label="Clientes"
        >
          {children}
        </div>
      )}
    </div>
  );
}
