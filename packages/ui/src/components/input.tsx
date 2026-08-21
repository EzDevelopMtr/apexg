import type { InputHTMLAttributes, ReactNode } from "react";

/*
  =====================================================
  CAMPO DE TEXTO
  =====================================================

  Incluye etiqueta, icono opcional y mensaje de error.
*/

interface InputProps
  extends InputHTMLAttributes<HTMLInputElement> {

  // Texto de la etiqueta.
  etiqueta?: string;

  // Icono que aparece a la izquierda.
  icono?: ReactNode;

  // Mensaje de error debajo del campo.
  error?: string;
}

export default function Input({
  etiqueta,
  icono,
  error,
  className = "",
  id,
  ...resto
}: InputProps) {

  return (
    <div>
      {etiqueta && (
        <label
          htmlFor={id}
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          {etiqueta}
        </label>
      )}

      <div className="relative">
        {icono && (
          <span
            className="
              absolute
              left-4
              top-1/2
              -translate-y-1/2
              text-slate-400
            "
          >
            {icono}
          </span>
        )}

        <input
          id={id}
          className={`
            w-full
            rounded-xl
            border
            bg-white
            py-3
            text-slate-900
            outline-none
            transition
            placeholder:text-slate-400
            focus:border-blue-500
            focus:ring-2
            focus:ring-blue-100
            ${icono ? "pl-12 pr-4" : "px-4"}
            ${error ? "border-red-300" : "border-slate-200"}
            ${className}
          `}
          {...resto}
        />
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
