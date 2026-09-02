import type { ReactNode } from "react";
import { ModuleLayout } from "@apexg/ui";
import MembresiasSidebar from "../../../../components/membresias-sidebar";
import RequiereModulo from "../../../../components/requiere-modulo";

export default function LayoutMembresias({ children }: { children: ReactNode }) {
  return (
    <RequiereModulo moduloId="membresias">
      <ModuleLayout sidebar={<MembresiasSidebar />}>{children}</ModuleLayout>
    </RequiereModulo>
  );
}
