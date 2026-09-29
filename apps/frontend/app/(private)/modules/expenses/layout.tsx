import type { ReactNode } from "react";
import { ModuleLayout } from "@apexg/ui";
import ModuleTopBar from "../../../../components/module-top-bar";
import RequireModule from "../../../../components/require-module";

export default function ExpensesLayout({ children }: { children: ReactNode }) {
  return (
    <RequireModule moduleId="expenses">
      <ModuleLayout
        topBar={
          <ModuleTopBar moduleId="expenses" basePath="/modules/expenses" />
        }
      >
        {children}
      </ModuleLayout>
    </RequireModule>
  );
}
