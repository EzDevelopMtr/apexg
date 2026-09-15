import type { ReactNode } from "react";
import { ModuleLayout } from "@apexg/ui";
import ModuleSidebar from "../../../../components/module-sidebar";
import RequireModule from "../../../../components/require-module";

export default function FinancesLayout({ children }: { children: ReactNode }) {
  return (
    <RequireModule moduleId="finances">
      <ModuleLayout
        sidebar={
          <ModuleSidebar
            moduleId="finances"
            title="FINANZAS"
            icon="chart"
            basePath="/modules/finances"
          />
        }
      >
        {children}
      </ModuleLayout>
    </RequireModule>
  );
}
