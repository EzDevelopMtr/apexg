import type { ReactNode } from "react";
import { ModuleLayout } from "@apexg/ui";
import ModuleTopBar from "../../../../components/module-top-bar";
import RequireModule from "../../../../components/require-module";

export default function ClientsLayout({ children }: { children: ReactNode }) {
  return (
    <RequireModule moduleId="clients">
      <ModuleLayout
        topBar={
          <ModuleTopBar moduleId="clients" basePath="/modules/clients" />
        }
      >
        {children}
      </ModuleLayout>
    </RequireModule>
  );
}
