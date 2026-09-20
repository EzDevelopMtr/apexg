import type { ReactNode } from "react";
import { ModuleLayout } from "@apexg/ui";
import ModuleSidebar from "../../../../components/module-sidebar";
import RequireModule from "../../../../components/require-module";

export default function InventoryLayout({ children }: { children: ReactNode }) {
  return (
    <RequireModule moduleId="inventory">
      <ModuleLayout
        sidebar={
          <ModuleSidebar moduleId="inventory" basePath="/modules/inventory" />
        }
      >
        {children}
      </ModuleLayout>
    </RequireModule>
  );
}
