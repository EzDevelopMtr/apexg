"use client";

import { Info } from "lucide-react";
import type { PlatformCompany } from "@apexg/core";
import { usePlatformSettings } from "../hooks/use-platform-settings";
import type { Notify } from "../hooks/use-toast";
import SettingGroup from "./setting-group";

export interface SettingsViewProps {
  readonly companies: readonly PlatformCompany[];
  readonly notify: Notify;
}

/** Every setting: a value for all gyms, and exceptions where one is needed. */
export default function SettingsView({ companies, notify }: SettingsViewProps) {
  const settings = usePlatformSettings(notify);
  return (
    <div className="max-w-[760px]">
      <h1 className="text-[clamp(2rem,4vw,2.75rem)] font-bold leading-[1.05] tracking-[-0.02em]">Ajustes</h1>
      <p className="mb-7 mt-2 text-[15px] text-body-soft">Un valor para todos los gimnasios, y excepciones donde haga falta. Se guardan al cambiarlos.</p>

      <div className="flex gap-3.5 rounded-2xl bg-fill-1 px-[18px] py-4 text-sm text-body-muted">
        <Info size={18} className="mt-0.5 shrink-0 text-brand-ink" />
        <div>
          <b className="font-semibold text-body">Cómo se decide el valor de cada gimnasio</b>
          <ol className="mt-1.5 list-decimal pl-[18px] text-body-soft">
            <li>Si el valor general es obligatorio, vale para todos.</li>
            <li>Si el gimnasio tiene una excepción, usa la suya.</li>
            <li>Si no, el valor general.</li>
            <li>Si nadie cambió nada, el de siempre.</li>
          </ol>
        </div>
      </div>

      {settings.error && (
        <p role="alert" className="mt-4 text-danger-ink">
          {settings.error}
        </p>
      )}
      {settings.settings.map((setting) => (
        <SettingGroup key={setting.key} setting={setting} companies={companies} actions={settings} />
      ))}
    </div>
  );
}
