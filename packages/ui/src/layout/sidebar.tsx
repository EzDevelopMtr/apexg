import type { ReactNode } from "react";
import type { IconName } from "@apexg/core";
import Icon from "../components/icon";

export interface SidebarShellProps {
  /** Module name, in Spanish. */
  title: string;
  subtitle: string;
  /** Name of the module icon; the lookup happens inside this package. */
  iconName: IconName;
  children: ReactNode;
  /** Rendered at the bottom, below the navigation. */
  footer: ReactNode;
}

/**
 * The collapsed rail that expands on hover.
 *
 * Presentational only: it renders whatever navigation the app hands it, so this
 * package stays free of routing.
 */
export function SidebarShell({
  title,
  subtitle,
  iconName,
  children,
  footer,
}: SidebarShellProps) {
  return (
    <aside
      className="
        group fixed left-0 top-0 z-40 h-screen w-20 overflow-hidden
        bg-slate-950 text-white transition-all duration-300 hover:w-72
      "
    >
      <div className="flex h-full flex-col">
        <div className="flex h-20 items-center border-b border-white/10 px-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600">
            <Icon name={iconName} size={22} />
          </div>
          <div className="ml-4 min-w-max opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <p className="font-bold">{title}</p>
            <p className="text-xs text-slate-400">{subtitle}</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-6">{children}</nav>

        <div className="border-t border-white/10 p-3">{footer}</div>
      </div>
    </aside>
  );
}

/** The label beside a sidebar icon, revealed when the rail expands. */
export function SidebarLabel({ children }: { children: ReactNode }) {
  return (
    <span className="ml-4 min-w-max text-sm font-medium opacity-0 transition-opacity duration-200 group-hover:opacity-100">
      {children}
    </span>
  );
}
