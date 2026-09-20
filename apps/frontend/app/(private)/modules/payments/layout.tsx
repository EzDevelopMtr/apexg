import type { ReactNode } from "react";
import { ModuleLayout } from "@apexg/ui";
import ModuleSidebar from "../../../../components/module-sidebar";
import RequireModule from "../../../../components/require-module";

export default function PaymentsLayout({ children }: { children: ReactNode }) {
  return (
    <RequireModule moduleId="payments">
      <ModuleLayout
        sidebar={
          <ModuleSidebar moduleId="payments" basePath="/modules/payments" />
        }
      >
        {children}
      </ModuleLayout>
    </RequireModule>
  );
}
