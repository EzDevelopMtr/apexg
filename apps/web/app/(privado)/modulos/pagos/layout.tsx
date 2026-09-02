import type { ReactNode } from "react";

import { ModuleLayout } from "@apexg/ui";

import PagosSidebar from "../../../../components/pagos-sidebar";
import RequiereModulo from "../../../../components/requiere-modulo";

export default function LayoutPagos({ children }: { children: ReactNode }) {
  return (
    <RequiereModulo moduloId="pagos">
      <ModuleLayout sidebar={<PagosSidebar />}>{children}</ModuleLayout>
    </RequiereModulo>
  );
}
