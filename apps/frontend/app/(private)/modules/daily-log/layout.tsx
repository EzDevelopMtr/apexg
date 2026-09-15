import type { ReactNode } from "react";
import { ModuleLayout } from "@apexg/ui";
import ModuleSidebar from "../../../../components/module-sidebar";
import RequireModule from "../../../../components/require-module";

export default function DailyLogLayout({ children }: { children: ReactNode }) {
  return (
    <RequireModule moduleId="dailyLog">
      <ModuleLayout
        sidebar={
          <ModuleSidebar
            moduleId="dailyLog"
            title="APARTADO DIARIO"
            icon="notebook"
            basePath="/modules/daily-log"
          />
        }
      >
        {children}
      </ModuleLayout>
    </RequireModule>
  );
}
