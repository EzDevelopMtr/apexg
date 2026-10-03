"use client";

import type { PlatformCompany, PlatformSetting } from "@apexg/core";
import { Button } from "@apexg/ui";
import type { PlatformSettingsActions } from "../hooks/use-platform-settings";
import type { useSettingDraft } from "../hooks/use-setting-draft";
import { describeValue } from "./setting-copy";
import SettingValueInput from "./setting-value-input";

export interface SettingExceptionsSectionProps {
  setting: PlatformSetting;
  companies: readonly PlatformCompany[];
  draft: ReturnType<typeof useSettingDraft>;
  actions: PlatformSettingsActions;
}

/** Gyms that get their own value instead of the general one. */
export default function SettingExceptionsSection({
  setting,
  companies,
  draft,
  actions,
}: SettingExceptionsSectionProps) {
  const candidates = companies.filter(
    (company) => !setting.overrides.some((o) => o.companyId === company.id),
  );

  return (
    <section className="mt-6 space-y-3 border-t border-line pt-4">
      <p className="text-sm font-semibold text-body">Solo para un gimnasio</p>
      {setting.platform?.enforced && setting.overrides.length > 0 && (
        <p className="text-sm text-warn-ink">
          El valor general es obligatorio: estas excepciones no se aplican mientras lo sea.
        </p>
      )}
      {setting.overrides.length === 0 && <p className="text-sm text-body-soft">Ninguno.</p>}
      {setting.overrides.map((override) => (
        <div key={override.companyId} className="flex items-center justify-between gap-3 text-sm">
          <span className="text-body">
            {override.name}: <span className="text-body-soft">{describeValue(override.value)}</span>
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => void actions.clearOverride(setting.key, override.companyId)}
          >
            Quitar
          </Button>
        </div>
      ))}
      {candidates.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <select
            aria-label="Gimnasio de la excepción"
            value={draft.exceptionCompanyId}
            onChange={(e) => draft.setExceptionCompanyId(e.target.value)}
            className="rounded-lg border border-line bg-surface px-3 py-1.5 text-sm text-body"
          >
            <option value="">Elige un gimnasio…</option>
            {candidates.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
          <SettingValueInput
            settingKey={setting.key}
            value={draft.exceptionValue}
            onChange={draft.setExceptionValue}
          />
          <Button
            size="sm"
            variant="secondary"
            disabled={!draft.exceptionCompanyId}
            onClick={() =>
              void actions.setOverride(setting.key, draft.exceptionCompanyId, draft.exceptionValue)
            }
          >
            Agregar excepción
          </Button>
        </div>
      )}
    </section>
  );
}
