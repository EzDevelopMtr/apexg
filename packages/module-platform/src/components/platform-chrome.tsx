"use client";

import { LayoutGrid, LogOut } from "lucide-react";
import { SegmentedControl, materialButton } from "@apexg/ui";
import { initials } from "../gym-rules";
import type { PanelTab } from "../hooks/use-panel-view";
import { useScrolled } from "../hooks/use-scrolled";

const TABS = [
  { id: "gyms", label: "Gimnasios" },
  { id: "settings", label: "Ajustes" },
] as const;

export interface PlatformChromeProps {
  readonly tab: PanelTab;
  readonly onTab: (tab: PanelTab) => void;
  readonly adminName: string;
  readonly adminEmail: string;
  readonly onSignOut: () => void;
}

/**
 * The panel's top bar: a translucent layer the content scrolls under. It is
 * the platform's own chrome — no gym's name or logo, because it manages all
 * of them. Its edge appears only when there is content beneath it.
 */
export default function PlatformChrome({ tab, onTab, adminName, adminEmail, onSignOut }: PlatformChromeProps) {
  const scrolled = useScrolled();
  return (
    <header className="sticky top-0 z-20 bg-shell/60 backdrop-blur-[20px] backdrop-saturate-[1.8] transparency-reduce:bg-shell transparency-reduce:backdrop-blur-none contrast-more:border-b contrast-more:border-body-faint">
      <div className="mx-auto grid max-w-[1120px] grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2.5 px-4 py-2.5 md:h-16 md:grid-cols-[1fr_auto_1fr] md:px-6 md:py-0">
        <div className="col-start-1 row-start-1 flex items-center gap-2.5">
          <span aria-hidden className="grid size-8 place-items-center rounded-[10px] bg-brand-soft text-brand-ink shadow-tile">
            <LayoutGrid size={17} />
          </span>
          <span className="leading-tight">
            <span className="block font-bold tracking-[0.01em]">Plataforma</span>
            <span className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-body-faint">Administración</span>
          </span>
        </div>
        <div className="col-span-full row-start-2 md:col-span-1 md:col-start-2 md:row-start-1">
          <SegmentedControl options={TABS} value={tab} onChange={onTab} label="Secciones del panel" />
        </div>
        <div className="col-start-2 row-start-1 flex items-center justify-self-end gap-2.5 md:col-start-3">
          <span className="hidden text-right leading-tight sm:block">
            <b className="block text-[13px] font-semibold">{adminName}</b>
            <span className="text-xs text-body-faint">{adminEmail}</span>
          </span>
          <span aria-hidden className="grid size-8 place-items-center rounded-full bg-brand-soft text-xs font-bold text-brand-ink">
            {initials(adminName) || "SA"}
          </span>
          <button type="button" onClick={onSignOut} aria-label="Cerrar sesión" title="Cerrar sesión" className={`${materialButton("tinted", "icon")} text-body-soft`}>
            <LogOut size={17} />
          </button>
        </div>
      </div>
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-x-0 top-full h-[18px] bg-gradient-to-b from-shell/55 to-transparent transition-opacity duration-200 ${scrolled ? "opacity-100" : "opacity-0"}`}
      />
    </header>
  );
}
