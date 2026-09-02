import type { ReactNode } from "react";

import { ModuleLayout } from "@apexg/ui";

import EntrenadoresSidebar from "../../../../components/entrenadores-sidebar";
import RequiereModulo from "../../../../components/requiere-modulo";

export default function LayoutEntrenadores({ children }: { children: ReactNode }) {
  return (
    <RequiereModulo moduloId="entrenadores">
      <ModuleLayout sidebar={<EntrenadoresSidebar />}>{children}</ModuleLayout>
    </RequiereModulo>
  );
}
