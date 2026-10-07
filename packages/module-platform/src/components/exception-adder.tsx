import type { PlatformCompany, PlatformSettingKey } from "@apexg/core";
import { materialButton } from "@apexg/ui";
import { SETTING_COPY } from "./setting-copy";
import SettingValue from "./setting-value";

export interface ExceptionAdderProps {
  readonly settingKey: PlatformSettingKey;
  readonly candidates: readonly PlatformCompany[];
  readonly companyId: string;
  readonly onCompany: (id: string) => void;
  readonly value: unknown;
  readonly onValue: (value: unknown) => void;
  readonly onAdd: () => void;
  readonly onCancel: () => void;
}

/** Inline: pick a gym and its value, in the same list, without leaving the screen. */
export default function ExceptionAdder(props: ExceptionAdderProps) {
  const { settingKey, candidates, companyId, onCompany, value, onValue, onAdd, onCancel } = props;
  const isDays = SETTING_COPY[settingKey].kind === "days";
  return (
    <div className="border-t border-hairline bg-fill-1 px-[18px] py-3 first:border-t-0">
      <div className="flex flex-wrap items-center gap-2.5">
        <select
          aria-label="Gimnasio de la excepción"
          value={companyId}
          onChange={(event) => onCompany(event.target.value)}
          className="h-9 rounded-[10px] border border-transparent bg-fill-2 px-3 text-sm outline-none focus:border-brand"
        >
          {candidates.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>
        {isDays && <SettingValue settingKey={settingKey} value={value} onChange={onValue} />}
        <button type="button" className={materialButton("primary", "sm")} onClick={onAdd}>
          Agregar
        </button>
        <button type="button" className={materialButton("plain", "sm")} onClick={onCancel}>
          Cancelar
        </button>
      </div>
      {!isDays && (
        <div className="-mx-[18px] mt-2">
          <SettingValue settingKey={settingKey} value={value} onChange={onValue} />
        </div>
      )}
    </div>
  );
}
