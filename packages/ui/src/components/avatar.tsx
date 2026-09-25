"use client";

import { UserRound } from "lucide-react";

export type AvatarSize = "sm" | "md";

const SIZES: Record<AvatarSize, string> = {
  sm: "h-10 w-10 text-sm",
  md: "h-12 w-12 text-base",
};

export interface AvatarProps {
  /** Nombre completo, para las iniciales y el texto alternativo. */
  name: string;
  /** Dónde está la foto, o undefined si no tiene. */
  photoUrl?: string;
  size?: AvatarSize;
  /** Presente cuando la foto se puede abrir en grande. */
  onOpen?: () => void;
}

function initials(name: string): string {
  const letters = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();
  return letters;
}

/**
 * La cara de un cliente, o sus iniciales.
 *
 * Sin foto no se deja un hueco gris: las iniciales distinguen igual de bien
 * entre dos personas de la misma fila, y el hueco sugeriría que falta algo
 * por cargar.
 */
export default function Avatar({
  name,
  photoUrl,
  size = "sm",
  onOpen,
}: AvatarProps) {
  const shared = `flex shrink-0 items-center justify-center overflow-hidden rounded-full font-bold ${SIZES[size]}`;

  const content = photoUrl ? (
    // `src` a secas: mismo origen, así que el navegador manda la cookie de
    // sesión y el proxy añade el token del lado del servidor. No hace falta
    // traerla a un blob, y ningún token llega a este componente.
    <img
      src={photoUrl}
      alt={`Foto de ${name}`}
      className="h-full w-full object-cover"
    />
  ) : initials(name) ? (
    <span>{initials(name)}</span>
  ) : (
    <UserRound size={19} aria-hidden="true" />
  );

  // Sin foto no hay nada que ampliar, así que no se ofrece un botón que
  // abriría un recuadro vacío.
  if (!photoUrl || !onOpen) {
    return (
      <div className={`${shared} bg-brand-soft text-brand-ink`}>{content}</div>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Ver la foto de ${name} en grande`}
      className={`${shared} bg-brand-soft text-brand-ink transition hover:ring-2 hover:ring-brand focus:outline-none focus-visible:ring-2 focus-visible:ring-brand`}
    >
      {content}
    </button>
  );
}
