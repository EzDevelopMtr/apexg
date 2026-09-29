import type { ReactNode } from "react";
import { ModuleLayout } from "@apexg/ui";
import ModuleTopBar from "../../../../components/module-top-bar";
import RequireModule from "../../../../components/require-module";

export default function TrainersLayout({ children }: { children: ReactNode }) {
  return (
    <RequireModule moduleId="trainers">
      <ModuleLayout
        topBar={
          <ModuleTopBar moduleId="trainers" basePath="/modules/trainers" />
        }
      >
        {children}
      </ModuleLayout>
    </RequireModule>
  );
}
