import type { ReactNode } from "react";
import { ModuleLayout } from "@apexg/ui";
import ModuleTopBar from "../../../../components/module-top-bar";
import RequireModule from "../../../../components/require-module";

export default function MembershipsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <RequireModule moduleId="memberships">
      <ModuleLayout
        topBar={
          <ModuleTopBar
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
