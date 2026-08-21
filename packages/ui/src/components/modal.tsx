import type { ReactNode } from "react";

import { X } from "lucide-react";

/*
  =====================================================
  MODAL
  =====================================================

  Ventana que aparece encima del contenido.

  Es un componente controlado: quien lo usa decide
  si esta abierto (propiedad abierto) y que ocurre
  al cerrarlo (propiedad onCerrar).
*/

interface ModalProps {

  // Si el modal se muestra o no.
  abierto: boolean;

  // Titulo del encabezado.
  titulo: string;

  // Se ejecuta al pulsar la X o el fondo oscuro.
  onCerrar: () => void;

  children: ReactNode;
}

export default function Modal({
  abierto,
  titulo,
  onCerrar,
  children,
}: ModalProps) {

  /*
    Si esta cerrado no dibujamos nada.
  */

  if (!abierto) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

      {/* FONDO OSCURO */}

      <button
        type="button"
        aria-label="Cerrar"
        onClick={onCerrar}
        className="absolute inset-0 bg-slate-950/50"
      />

      {/* CONTENIDO */}

      <div
        role="dialog"
        aria-modal="true"
        className="
          relative
          z-10
          max-h-[90vh]
          w-full
          max-w-2xl
          overflow-y-auto
          rounded-2xl
          bg-white
          shadow-xl
        "
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-900">
            {titulo}
          </h2>

          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="
              rounded-lg
              p-2
              text-slate-400
              transition
              hover:bg-slate-100
              hover:text-slate-900
            "
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
