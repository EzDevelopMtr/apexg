import type { ReactNode } from "react";
import { ModuleLayout } from "@apexg/ui";
import ModuleSidebar from "../../../../components/module-sidebar";
import RequireModule from "../../../../components/require-module";

export default function TrainersLayout({ children }: { children: ReactNode }) {
  return (
    <RequireModule moduleId="trainers">
      <ModuleLayout
        sidebar={
          <ModuleSidebar
            moduleId="trainers"
            title="ENTRENADORES"
            icon="dumbbell"
            basePath="/modules/trainers"
          />
        }
      >
        {children}
      </ModuleLayout>
    </RequireModule>
  );
}
