import type { ReactNode } from "react";

import { ModuleLayout } from "@apexg/ui";

import FinanzasSidebar from "../../../../components/finanzas-sidebar";
import RequiereModulo from "../../../../components/requiere-modulo";

export default function LayoutFinanzas({ children }: { children: ReactNode }) {
  return (
    <RequiereModulo moduloId="finanzas">
      <ModuleLayout sidebar={<FinanzasSidebar />}>{children}</ModuleLayout>
    </RequiereModulo>
  );
}
