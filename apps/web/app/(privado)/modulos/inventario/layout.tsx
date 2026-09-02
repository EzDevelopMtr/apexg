import type { ReactNode } from "react";

import { ModuleLayout } from "@apexg/ui";

import InventarioSidebar from "../../../../components/inventario-sidebar";
import RequiereModulo from "../../../../components/requiere-modulo";

export default function LayoutInventario({ children }: { children: ReactNode }) {
  return (
    <RequiereModulo moduloId="inventario">
      <ModuleLayout sidebar={<InventarioSidebar />}>{children}</ModuleLayout>
    </RequiereModulo>
  );
}
