import type { ReactNode } from "react";
import { ModuleLayout } from "@apexg/ui";
import ModuleTopBar from "../../../../components/module-top-bar";
import RequireModule from "../../../../components/require-module";

export default function InventoryLayout({ children }: { children: ReactNode }) {
  return (
    <RequireModule moduleId="inventory">
      <ModuleLayout
        topBar={
          <ModuleTopBar moduleId="inventory" basePath="/modules/inventory" />
        }
      >
        {children}
      </ModuleLayout>
    </RequireModule>
  );
}
