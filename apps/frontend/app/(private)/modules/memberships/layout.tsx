import type { ReactNode } from "react";
import { ModuleLayout } from "@apexg/ui";
import ModuleSidebar from "../../../../components/module-sidebar";
import RequireModule from "../../../../components/require-module";

export default function MembershipsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <RequireModule moduleId="memberships">
      <ModuleLayout
        sidebar={
          <ModuleSidebar
            moduleId="memberships"
            basePath="/modules/memberships"
          />
        }
      >
        {children}
      </ModuleLayout>
    </RequireModule>
  );
}
