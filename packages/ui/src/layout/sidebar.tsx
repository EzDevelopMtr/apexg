import type { ReactNode } from "react";
import type { AccentName, IconName } from "@apexg/core";
import { ACCENT_TILE } from "../accents";
import Icon from "../components/icon";
import Logo from "../components/logo";

export interface SidebarShellProps {
  /** Module name, in Spanish. */
  title: string;
  /** Name of the module icon; the lookup happens inside this package. */
  iconName: IconName;
  /** The module's own colour, the same one its card carries on the selector. */
  accent: AccentName;
  children: ReactNode;
  /** Rendered at the bottom, below the navigation. */
  footer: ReactNode;
}

/** Revealed when the rail expands; hidden to assistive tech while collapsed. */
function RailLabel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`ml-4 min-w-max opacity-0 transition-opacity duration-200 group-hover:opacity-100 ${className}`}
    >
      {children}
    </span>
  );
}

/**
 * The collapsed rail that expands on hover.
 *
 * Two identities stacked, deliberately not merged: the logo says which product
 * this is and never changes, the tile below says which module you are in and
 * carries that module's accent — the same colour its card wears on the
 * selector, so arriving here confirms where the click landed.
 *
 * Presentational only: it renders whatever navigation the app hands it, so this
 * package stays free of routing.
 */
export function SidebarShell({
  title,
  iconName,
  accent,
  children,
  footer,
}: SidebarShellProps) {
  return (
    <aside
      className="
        group fixed left-0 top-0 z-40 h-screen w-20 overflow-hidden
        bg-shell text-body transition-all duration-300 hover:w-72
      "
    >
      <div className="flex h-full flex-col">
        <div className="flex h-20 items-center border-b border-shell-line px-5">
          <Logo size="sm" markOnly />
          <RailLabel className="text-sm font-bold tracking-[0.22em] text-body">
            APEX GYM
          </RailLabel>
        </div>

        <div className="flex h-20 items-center border-b border-shell-line px-5">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${ACCENT_TILE[accent]}`}
          >
            <Icon name={iconName} size={22} />
          </div>
          <RailLabel className="text-sm font-bold uppercase tracking-wider text-body">
            {title}
          </RailLabel>
        </div>

        <nav className="flex-1 px-3 py-6">{children}</nav>

        <div className="border-t border-shell-line p-3">{footer}</div>
      </div>
    </aside>
  );
}

/** The label beside a sidebar icon, revealed when the rail expands. */
export function SidebarLabel({ children }: { children: ReactNode }) {
  return <RailLabel className="text-sm font-medium">{children}</RailLabel>;
}
