"use client";

import type { PlatformCompany } from "@apexg/core";
import { Sheet, Toast, pushedBack } from "@apexg/ui";
import { usePanelView } from "../hooks/use-panel-view";
import { usePlatformCompanies } from "../hooks/use-platform-companies";
import { useToast } from "../hooks/use-toast";
import { usePlatformLinks } from "../platform-context";
import GymCreator from "./gym-creator";
import GymEditor from "./gym-editor";
import GymsView from "./gyms-view";
import PlatformChrome from "./platform-chrome";
import SettingsView from "./settings-view";

export interface PlatformPageProps {
  readonly adminName: string;
  readonly adminEmail: string;
  readonly onSignOut: () => void;
}

/**
 * The platform's control centre: every gym, its brand and people, and the
 * settings that reach all of them. What is saved here is written to each
 * gym's own data, and its people see it the next time they load the app.
 */
export default function PlatformPage({ adminName, adminEmail, onSignOut }: PlatformPageProps) {
  const platform = usePlatformCompanies();
  const view = usePanelView();
  const { toast, notify } = useToast();
  const { gymLogo } = usePlatformLinks();
  const logoSrc = (company: PlatformCompany) =>
    company.hasLogo ? `${gymLogo(company.slug)}?v=${platform.logoVersion}` : undefined;
  const editing = platform.companies.find((company) => company.id === view.editingId);
  const slugsBut = (id?: string) => platform.companies.filter((c) => c.id !== id).map((c) => c.slug);
  const sheetOpen = view.sheet !== "none";

  return (
    <>
      <div className={`min-h-screen ${pushedBack(sheetOpen)}`}>
        <PlatformChrome tab={view.tab} onTab={view.setTab} adminName={adminName} adminEmail={adminEmail} onSignOut={onSignOut} />
        <main className="mx-auto max-w-[1120px] px-4 pb-24 pt-6 md:px-6 md:pt-9">
          <div key={view.tab} className={`${view.enterFrom === "right" ? "animate-enter-right" : "animate-enter-left"} motion-reduce:animate-none`}>
            {view.tab === "gyms" ? (
              <GymsView
                companies={platform.companies}
                loading={platform.loading}
                error={platform.error}
                logoSrc={logoSrc}
                onOpen={view.openEditor}
                onCreate={view.openCreator}
              />
            ) : (
              <SettingsView companies={platform.companies} notify={notify} />
            )}
          </div>
        </main>
      </div>

      <Sheet open={view.sheet === "editor"} title="Editar gimnasio" onClose={view.closeSheet}>
        {editing && (
          <GymEditor
            key={editing.id}
            company={editing}
            takenSlugs={slugsBut(editing.id)}
            logoSrc={logoSrc(editing)}
            actions={platform}
            notify={notify}
            onClose={view.closeSheet}
          />
        )}
      </Sheet>
      <Sheet open={view.sheet === "creator"} title="Nuevo gimnasio" onClose={view.closeSheet}>
        <GymCreator key={view.creation} create={platform.create} takenSlugs={slugsBut()} onClose={view.closeSheet} onAnother={view.openCreator} />
      </Sheet>
      <Toast visible={toast.visible} message={toast.message} onUndo={toast.onUndo} />
    </>
  );
}
