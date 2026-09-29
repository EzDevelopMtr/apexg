import type { ReactNode } from "react";
import { ModuleLayout } from "@apexg/ui";
import ModuleTopBar from "../../../../components/module-top-bar";
import RequireModule from "../../../../components/require-module";

export default function DailyLogLayout({ children }: { children: ReactNode }) {
  return (
    <RequireModule moduleId="dailyLog">
      <ModuleLayout
        topBar={
          <ModuleTopBar moduleId="dailyLog" basePath="/modules/daily-log" />
        }
      >
        {children}
      </ModuleLayout>
    </RequireModule>
  );
}
