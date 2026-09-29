import type { ReactNode } from "react";
import { ModuleLayout } from "@apexg/ui";
import ModuleTopBar from "../../../../components/module-top-bar";
import RequireModule from "../../../../components/require-module";

export default function FinancesLayout({ children }: { children: ReactNode }) {
  return (
    <RequireModule moduleId="finances">
      <ModuleLayout
        topBar={
          <ModuleTopBar moduleId="finances" basePath="/modules/finances" />
        }
      >
        {children}
      </ModuleLayout>
    </RequireModule>
  );
}
