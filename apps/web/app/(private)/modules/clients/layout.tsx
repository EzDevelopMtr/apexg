import type { ReactNode } from "react";
import { ModuleLayout } from "@apexg/ui";
import ModuleSidebar from "../../../../components/module-sidebar";
import RequireModule from "../../../../components/require-module";

export default function ClientsLayout({ children }: { children: ReactNode }) {
  return (
    <RequireModule moduleId="clients">
      <ModuleLayout
        sidebar={
          <ModuleSidebar
            moduleId="clients"
            title="CLIENTES"
            icon="users"
            basePath="/modules/clients"
          />
        }
      >
        {children}
      </ModuleLayout>
    </RequireModule>
  );
}
