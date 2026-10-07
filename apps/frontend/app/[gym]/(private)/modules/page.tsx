import type { Metadata } from "next";
import ModuleGrid from "../../../../components/module-grid";

export const metadata: Metadata = {
  title: "Módulos",
};

export default function ModulesPage() {
  return <ModuleGrid />;
}
