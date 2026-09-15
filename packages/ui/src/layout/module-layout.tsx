import type { ReactNode } from "react";

export interface ModuleLayoutProps {
  sidebar: ReactNode;
  children: ReactNode;
}

/** Shell shared by every module page: fixed sidebar plus offset content. */
export default function ModuleLayout({ sidebar, children }: ModuleLayoutProps) {
  return (
    <div className="ground-grain min-h-screen">
      {sidebar}
      <main className="min-h-screen pl-20">{children}</main>
    </div>
  );
}
