import type { ReactNode } from "react";
import { ModuleLayout } from "@apexg/ui";
import ModuleTopBar from "../../../../components/module-top-bar";
import RequireModule from "../../../../components/require-module";

export default function PaymentsLayout({ children }: { children: ReactNode }) {
  return (
    <RequireModule moduleId="payments">
      <ModuleLayout
        topBar={
          <ModuleTopBar moduleId="payments" basePath="/modules/payments" />
        }
      >
        {children}
      </ModuleLayout>
    </RequireModule>
  );
}
