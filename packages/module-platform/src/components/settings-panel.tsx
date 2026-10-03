"use client";

import type { PlatformCompany } from "@apexg/core";
import { usePlatformSettings } from "../hooks/use-platform-settings";
import SettingCard from "./setting-card";

/** Every setting, each with its general value and per-gym exceptions. */
export default function SettingsPanel({
  companies,
}: {
  companies: readonly PlatformCompany[];
}) {
  const settings = usePlatformSettings();
  return (
    <div className="space-y-4">
      {settings.error && (
        <p role="alert" className="text-danger-ink">
          {settings.error}
        </p>
      )}
      {settings.settings.map((setting) => (
        <SettingCard
          // Remount on every reload so the draft starts from what was saved.
          key={`${setting.key}:${JSON.stringify(setting.platform)}:${setting.overrides.length}`}
          setting={setting}
          companies={companies}
          actions={settings}
        />
      ))}
    </div>
  );
}
