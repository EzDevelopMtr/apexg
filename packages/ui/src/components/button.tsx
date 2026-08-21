import type { ButtonHTMLAttributes, ReactNode } from "react";

/*
  =====================================================
  BOTON
  =====================================================

  Variantes disponibles:

    primario    → azul relleno (accion principal)
    secundario  → borde gris (accion secundaria)
    fantasma    → sin fondo (acciones discretas)
    peligro     → rojo (eliminar, cerrar sesion)
*/

type VarianteBoton =
  | "primario"
  | "secundario"
  | "fantasma"
  | "peligro";

type TamanoBoton = "sm" | "md";

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: VarianteBoton;
  tamano?: TamanoBoton;
  children: ReactNode;
}

const variantes: Record<VarianteBoton, string> = {
  primario:
    "bg-blue-600 text-white hover:bg-blue-700 disabled:hover:bg-blue-600",
  secundario:
    "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
  fantasma:
    "text-slate-500 hover:text-slate-900",
  peligro:
    "bg-red-600 text-white hover:bg-red-700",
};

const tamanos: Record<TamanoBoton, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-5 py-3",
};

export default function Button({
  variante = "primario",
  tamano = "md",
  className = "",
  children,
  ...resto
}: ButtonProps) {
  return (
    <button
      className={`
        inline-flex
        items-center
        justify-center
        gap-2
        rounded-xl
        font-semibold
        transition
        disabled:cursor-not-allowed
        disabled:opacity-50
        ${variantes[variante]}
        ${tamanos[tamano]}
        ${className}
      `}
      {...resto}
    >
      {children}
    </button>
  );
}
