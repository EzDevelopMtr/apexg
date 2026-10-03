"use client";

import type { PlatformCompany, PlatformSetting } from "@apexg/core";
import { Card, CardBody } from "@apexg/ui";
import type { PlatformSettingsActions } from "../hooks/use-platform-settings";
import { useSettingDraft } from "../hooks/use-setting-draft";
import { SETTING_COPY } from "./setting-copy";
import SettingExceptionsSection from "./setting-exceptions-section";
import SettingGeneralSection from "./setting-general-section";

export interface SettingCardProps {
  setting: PlatformSetting;
  companies: readonly PlatformCompany[];
  actions: PlatformSettingsActions;
}

/** One setting: its value for every gym, and the gyms that are the exception. */
export default function SettingCard({ setting, companies, actions }: SettingCardProps) {
  const draft = useSettingDraft(setting);
  const copy = SETTING_COPY[setting.key];
  return (
    <Card>
      <CardBody>
        <h2 className="text-lg font-bold text-body">{copy.title}</h2>
        <p className="mt-1 text-sm text-body-soft">{copy.help}</p>
        <SettingGeneralSection setting={setting} draft={draft} actions={actions} />
        <SettingExceptionsSection
          setting={setting}
          companies={companies}
          draft={draft}
          actions={actions}
        />
      </CardBody>
    </Card>
  );
}
