"use client";

import { useState } from "react";
import { Card, CardBody, Modal } from "@apexg/ui";
import { usePlatformCompanies } from "../hooks/use-platform-companies";
import CompaniesTable from "./companies-table";
import CompanyEditor from "./company-editor";
import CompanyForm from "./company-form";
import PanelHeader from "./panel-header";
import type { PanelTab } from "./panel-header";
import SettingsPanel from "./settings-panel";

export interface CompaniesPageProps {
  adminName: string;
  onSignOut: () => void;
}

/** The super admin's panel: every gym on the platform, and the settings. */
export default function CompaniesPage({ adminName, onSignOut }: CompaniesPageProps) {
  const platform = usePlatformCompanies();
  const [tab, setTab] = useState<PanelTab>("companies");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const editing = platform.companies.find((company) => company.id === editingId);

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-8">
      <PanelHeader
        adminName={adminName}
        tab={tab}
        onTab={setTab}
        onCreate={() => setCreating(true)}
        onSignOut={onSignOut}
      />

      {tab === "settings" && <SettingsPanel companies={platform.companies} />}

      {tab === "companies" && (
        <Card>
          <CardBody>
            {platform.loading && <p className="text-body-soft">Cargando gimnasios…</p>}
            {platform.error && (
              <p role="alert" className="text-danger-ink">
                {platform.error}
              </p>
            )}
            {!platform.loading && !platform.error && (
              <CompaniesTable companies={platform.companies} onEdit={setEditingId} />
            )}
          </CardBody>
        </Card>
      )}

      <Modal open={creating} title="Nuevo gimnasio" onClose={() => setCreating(false)}>
        <CompanyForm create={platform.create} />
      </Modal>

      <Modal open={editing !== undefined} title={editing?.name ?? ""} onClose={() => setEditingId(null)}>
        {editing && <CompanyEditor key={editing.id} company={editing} actions={platform} />}
      </Modal>
    </main>
  );
}
