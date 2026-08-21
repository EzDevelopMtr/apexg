import type { ReactNode } from "react";

/*
  =====================================================
  TARJETA
  =====================================================

  Contenedor blanco con borde y sombra suave.
  Es la base visual de casi todas las pantallas.
*/

interface CardProps {
  children: ReactNode;

  // Clases extra para casos particulares.
  className?: string;
}

export default function Card({
  children,
  className = "",
}: CardProps) {
  return (
    <div
      className={`
        rounded-2xl
        border
        border-slate-200
        bg-white
        shadow-sm
        ${className}
      `}
    >
      {children}
    </div>
  );
}

/*
  -----------------------------------------------------
  ENCABEZADO DE LA TARJETA
  -----------------------------------------------------
*/

export function CardHeader({
  titulo,
  descripcion,
}: {
  titulo: string;
  descripcion?: string;
}) {
  return (
    <div className="border-b border-slate-200 px-6 py-4">
      <h2 className="font-bold text-slate-900">{titulo}</h2>

      {descripcion && (
        <p className="mt-1 text-sm text-slate-500">
          {descripcion}
        </p>
      )}
    </div>
  );
}

/*
  -----------------------------------------------------
  CUERPO DE LA TARJETA
  -----------------------------------------------------
*/

export function CardBody({
  children,
  className = "",
}: CardProps) {
  return (
    <div className={`p-6 ${className}`}>{children}</div>
  );
}
