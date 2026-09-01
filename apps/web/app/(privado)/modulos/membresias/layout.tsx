import type { ReactNode } from "react";
import { ModuleLayout } from "@apexg/ui";
import MembresiasSidebar from "../../../../components/membresias-sidebar";

export default function LayoutMembresias({ children }: { children: ReactNode }) {
  return <ModuleLayout sidebar={<MembresiasSidebar />}>{children}</ModuleLayout>;
}
