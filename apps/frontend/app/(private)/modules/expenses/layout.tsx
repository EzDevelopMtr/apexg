import type { ReactNode } from "react";
import { ModuleLayout } from "@apexg/ui";
import ModuleSidebar from "../../../../components/module-sidebar";
import RequireModule from "../../../../components/require-module";

export default function ExpensesLayout({ children }: { children: ReactNode }) {
  return (
    <RequireModule moduleId="expenses">
      <ModuleLayout
        sidebar={
          <ModuleSidebar
            moduleId="expenses"
            title="EGRESOS"
            icon="receipt"
            basePath="/modules/expenses"
          />
        }
      >
        {children}
      </ModuleLayout>
    </RequireModule>
  );
}
