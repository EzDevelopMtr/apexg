"use client";

import { LayoutGrid, LogOut } from "lucide-react";
import { Logo } from "@apexg/ui";

export interface SelectorSidebarProps {
  onSignOut: () => void;
}

const ITEM =
  "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition";

/**
 * The rail beside the module selector.
 *
 * It carries only what exists: where you are, and the way out. Profile,
 * settings and help are in the design but have no screen behind them yet, so
 * they are left out rather than shipped as links that go nowhere.
 */
export default function SelectorSidebar({ onSignOut }: SelectorSidebarProps) {
  return (
    <aside className="relative hidden w-72 shrink-0 overflow-hidden bg-shell lg:flex lg:flex-col">
      <div className="px-8 pb-8 pt-10">
        <Logo size="md" />
      </div>

      <nav className="flex flex-col gap-2 px-5">
        <span
          aria-current="page"
          className={`${ITEM} bg-brand text-brand-contrast`}
        >
          <LayoutGrid size={18} />
          Módulos
        </span>
        <button
          type="button"
          onClick={onSignOut}
          className={`${ITEM} text-shell-muted hover:bg-panel/10 hover:text-body`}
        >
          <LogOut size={18} />
          Cerrar sesión
        </button>
      </nav>

      <div className="mt-10 px-8">
        <span className="block h-px w-12 bg-brand" />
        <p className="mt-5 text-sm font-bold uppercase leading-snug tracking-wider text-body-faint">
          Disciplina hoy,
          <br />
          resultados <span className="text-brand">mañana</span>
        </p>
      </div>

      {/* Atmosphere, not information — it sits under everything and fades out. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-cover bg-center opacity-25"
        style={{
          backgroundImage: "url('/login-hero.jpg')",
          maskImage: "linear-gradient(to bottom, transparent, black 60%)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent, black 60%)",
        }}
      />
    </aside>
  );
}
