import { Button } from "@apexg/ui";

export type PanelTab = "companies" | "settings";

export interface PanelHeaderProps {
  adminName: string;
  tab: PanelTab;
  onTab: (tab: PanelTab) => void;
  onCreate: () => void;
  onSignOut: () => void;
}

const TABS: readonly { id: PanelTab; label: string }[] = [
  { id: "companies", label: "Gimnasios" },
  { id: "settings", label: "Ajustes" },
];

export default function PanelHeader({ adminName, tab, onTab, onCreate, onSignOut }: PanelHeaderProps) {
  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-body">Panel de plataforma</h1>
          <p className="mt-1 text-body-soft">{adminName}</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={onCreate}>Nuevo gimnasio</Button>
          <Button variant="ghost" onClick={onSignOut}>
            Cerrar sesión
          </Button>
        </div>
      </header>
      <nav className="flex gap-2" aria-label="Secciones del panel">
        {TABS.map((item) => (
          <Button
            key={item.id}
            variant={tab === item.id ? "primary" : "ghost"}
            onClick={() => onTab(item.id)}
          >
            {item.label}
          </Button>
        ))}
      </nav>
    </>
  );
}
