import type { ReactNode } from "react";

import { ModuleLayout } from "@apexg/ui";

import InventarioSidebar from "../../../../components/inventario-sidebar";

export default function LayoutInventario({ children }: { children: ReactNode }) {
  return <ModuleLayout sidebar={<InventarioSidebar />}>{children}</ModuleLayout>;
}
