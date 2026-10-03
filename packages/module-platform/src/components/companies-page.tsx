"use client";

import { useState } from "react";
import { Button, Card, CardBody, Modal } from "@apexg/ui";
import { usePlatformCompanies } from "../hooks/use-platform-companies";
import CompaniesTable from "./companies-table";
import CompanyEditor from "./company-editor";
import CompanyForm from "./company-form";

export interface CompaniesPageProps {
  adminName: string;
  onSignOut: () => void;
}

/** The super admin's only screen: every gym on the platform. */
export default function CompaniesPage({ adminName, onSignOut }: CompaniesPageProps) {
  const platform = usePlatformCompanies();
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const editing = platform.companies.find((company) => company.id === editingId);

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-body">Gimnasios</h1>
          <p className="mt-1 text-body-soft">Panel de plataforma · {adminName}</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => setCreating(true)}>Nuevo gimnasio</Button>
          <Button variant="ghost" onClick={onSignOut}>
            Cerrar sesión
          </Button>
        </div>
      </header>

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

      <Modal open={creating} title="Nuevo gimnasio" onClose={() => setCreating(false)}>
        <CompanyForm create={platform.create} />
      </Modal>

      <Modal open={editing !== undefined} title={editing?.name ?? ""} onClose={() => setEditingId(null)}>
        {editing && <CompanyEditor key={editing.id} company={editing} actions={platform} />}
      </Modal>
    </main>
  );
}
