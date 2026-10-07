"use client";

import { Lock, Plus } from "lucide-react";
import type { PlatformCompany, PlatformSetting } from "@apexg/core";
import { useExceptionAdder } from "../hooks/use-exception-adder";
import type { PlatformSettingsActions } from "../hooks/use-platform-settings";
import { generalValue } from "../hooks/use-platform-settings";
import ExceptionAdder from "./exception-adder";
import ExceptionRow from "./exception-row";

export interface SettingExceptionsProps {
  readonly setting: PlatformSetting;
  readonly companies: readonly PlatformCompany[];
  readonly actions: PlatformSettingsActions;
}

/** Gyms that get their own value instead of the general one. */
export default function SettingExceptions({ setting, companies, actions }: SettingExceptionsProps) {
  const adder = useExceptionAdder(() => generalValue(setting));
  const enforced = setting.platform?.enforced ?? false;
  const candidates = companies.filter((c) => !setting.overrides.some((o) => o.companyId === c.id));
  const nameOf = (id: string) => companies.find((c) => c.id === id)?.name ?? "";

  const add = () =>
    void actions.addOverride(setting.key, adder.companyId, adder.value, nameOf(adder.companyId)).then(adder.stop);

  return (
    <div className="overflow-hidden rounded-2xl bg-panel shadow-tile contrast-more:border contrast-more:border-body-faint">
      {enforced && setting.overrides.length > 0 && (
        <p className="flex items-center gap-2 bg-fill-1 px-[18px] py-2.5 text-xs text-body-soft">
          <Lock size={14} /> Las excepciones no se aplican mientras el valor general sea obligatorio.
        </p>
      )}
      {setting.overrides.map((o) => (
        <ExceptionRow
          key={o.companyId}
          settingKey={setting.key}
          name={o.name}
          color={companies.find((c) => c.id === o.companyId)?.brandColor ?? null}
          value={o.value}
          muted={enforced}
          expanded={adder.editing === o.companyId}
          onToggle={() => adder.toggleEditing(o.companyId)}
          onChange={(value) => actions.setOverrideValue(setting.key, o.companyId, value)}
          onRemove={() => void actions.removeOverride(setting, o.companyId)}
        />
      ))}
      {adder.open && (
        <ExceptionAdder
          settingKey={setting.key}
          candidates={candidates}
          companyId={adder.companyId}
          onCompany={adder.setCompanyId}
          value={adder.value}
          onValue={adder.setValue}
          onAdd={add}
          onCancel={adder.stop}
        />
      )}
      {!adder.open && candidates.length > 0 && (
        <button
          type="button"
          onClick={() => adder.start(candidates[0]?.id ?? "")}
          className={`flex min-h-14 w-full items-center gap-2.5 px-[18px] text-sm font-semibold text-brand-ink transition-colors hover:bg-fill-1 ${setting.overrides.length ? "border-t border-hairline" : ""}`}
        >
          <Plus size={16} /> Agregar excepción para un gimnasio
        </button>
      )}
      {!adder.open && candidates.length === 0 && setting.overrides.length === 0 && (
        <p className="px-[18px] py-4 text-sm text-body-faint">Aún no hay gimnasios.</p>
      )}
    </div>
  );
}
