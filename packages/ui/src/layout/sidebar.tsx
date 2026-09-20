import type { ReactNode } from "react";
import Logo from "../components/logo";

export interface SidebarShellProps {
  /** Module name, in Spanish. */
  title: string;
  children: ReactNode;
  /** Rendered at the bottom, below the navigation. */
  footer: ReactNode;
}

/** Revealed when the rail expands. */
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
 * One line at the top: the mark, then the module you are in. The module's own
 * accent is deliberately NOT used here — those belong to the selector and
 * nowhere else, because inside a module they would sit beside the status
 * badges, where a green would stop meaning "Activo".
 *
 * Presentational only: it renders whatever navigation the app hands it, so this
 * package stays free of routing.
 */
export function SidebarShell({ title, children, footer }: SidebarShellProps) {
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
