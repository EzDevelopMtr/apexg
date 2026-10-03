"use client";

import type { PlatformSetting } from "@apexg/core";
import { Button } from "@apexg/ui";
import type { PlatformSettingsActions } from "../hooks/use-platform-settings";
import type { useSettingDraft } from "../hooks/use-setting-draft";
import { describeValue } from "./setting-copy";
import SettingValueInput from "./setting-value-input";

export interface SettingGeneralSectionProps {
  setting: PlatformSetting;
  draft: ReturnType<typeof useSettingDraft>;
  actions: PlatformSettingsActions;
}

/** The value every gym gets unless it has an exception. */
export default function SettingGeneralSection({ setting, draft, actions }: SettingGeneralSectionProps) {
  return (
    <section className="mt-4 space-y-3">
      <p className="text-sm font-semibold text-body">
        Para todos los gimnasios{" "}
        <span className="font-normal text-body-soft">
          (por defecto: {describeValue(setting.defaultValue)})
        </span>
      </p>
      <SettingValueInput settingKey={setting.key} value={draft.general} onChange={draft.setGeneral} />
      <label className="flex items-center gap-2 text-sm text-body-soft">
        <input
          type="checkbox"
          checked={draft.enforced}
          onChange={(e) => draft.setEnforced(e.target.checked)}
        />
        Obligatorio para todos (ignora las excepciones)
      </label>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => void actions.setGeneral(setting.key, draft.general, draft.enforced)}>
          Guardar para todos
        </Button>
        {setting.platform && (
          <Button size="sm" variant="ghost" onClick={() => void actions.clearGeneral(setting.key)}>
            Volver al valor por defecto
          </Button>
        )}
      </div>
    </section>
  );
}
