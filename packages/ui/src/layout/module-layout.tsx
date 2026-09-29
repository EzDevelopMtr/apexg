import type { ReactNode } from "react";

export interface ModuleLayoutProps {
  topBar: ReactNode;
  children: ReactNode;
}

/**
 * Esqueleto de cada pantalla de módulo: barra superior y contenido.
 *
 * El contenido ocupa el ancho completo; antes cedía 80 px a la izquierda para
 * el riel lateral.
 */
export default function ModuleLayout({ topBar, children }: ModuleLayoutProps) {
  return (
    <div className="ground-grain min-h-screen">
      {topBar}
      <main className="min-h-[calc(100vh-5rem)]">{children}</main>
    </div>
  );
}
