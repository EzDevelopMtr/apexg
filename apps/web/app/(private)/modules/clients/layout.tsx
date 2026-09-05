import type { ReactNode } from "react";
import { ModuleLayout } from "@apexg/ui";
import ClientsProviders from "../../../../components/clients-providers";
import ClientsSidebar from "../../../../components/clients-sidebar";

export default function ClientsLayout({ children }: { children: ReactNode }) {
  return (
    <ClientsProviders>
      <ModuleLayout sidebar={<ClientsSidebar />}>{children}</ModuleLayout>
    </ClientsProviders>
  );
}
