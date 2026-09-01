import type { ReactNode } from "react";

import { ModuleLayout } from "@apexg/ui";

import PagosSidebar from "../../../../components/pagos-sidebar";

export default function LayoutPagos({ children }: { children: ReactNode }) {
  return <ModuleLayout sidebar={<PagosSidebar />}>{children}</ModuleLayout>;
}
