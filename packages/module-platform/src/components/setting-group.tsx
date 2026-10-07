import type { PlatformCompany, PlatformSetting } from "@apexg/core";
import { Switch } from "@apexg/ui";
import type { PlatformSettingsActions } from "../hooks/use-platform-settings";
import { generalValue } from "../hooks/use-platform-settings";
import { describeValue, SETTING_COPY } from "./setting-copy";
import SettingExceptions from "./setting-exceptions";
import SettingValue from "./setting-value";

export interface SettingGroupProps {
  readonly setting: PlatformSetting;
  readonly companies: readonly PlatformCompany[];
  readonly actions: PlatformSettingsActions;
}

const CELL = "flex min-h-14 items-center justify-between gap-4 px-[18px] py-2.5";

/** One setting: its value for every gym, whether it is binding, and who is the exception. */
export default function SettingGroup({ setting, companies, actions }: SettingGroupProps) {
  const copy = SETTING_COPY[setting.key];
  const Icon = copy.icon;
  const enforced = setting.platform?.enforced ?? false;
  return (
    <section>
      <h2 className="mx-1 mb-2 mt-7 flex items-center gap-2 text-[13px] font-semibold text-body-soft">
        <Icon size={16} className="text-brand-ink" /> {copy.title}
      </h2>
      <p className="mx-1 -mt-1 mb-2.5 text-[13px] text-body-faint">{copy.help}</p>
      <div className="overflow-hidden rounded-2xl bg-panel shadow-tile contrast-more:border contrast-more:border-body-faint">
        {copy.kind === "days" ? (
          <div className={CELL}>
            <div>
              <div className="text-[15px] font-medium">Para todos los gimnasios</div>
              <div className="text-xs text-body-faint">Por defecto: {describeValue(setting.defaultValue)}</div>
            </div>
            <SettingValue settingKey={setting.key} value={generalValue(setting)} onChange={(v) => actions.setGeneralValue(setting, v)} />
          </div>
        ) : (
          <SettingValue settingKey={setting.key} value={generalValue(setting)} onChange={(v) => actions.setGeneralValue(setting, v)} />
        )}
        <div className={`${CELL} border-t border-hairline`}>
          <div>
            <div className="text-[15px] font-medium">Obligatorio para todos</div>
            <div className="text-xs text-body-faint">Ignora las excepciones de cada gimnasio</div>
          </div>
          <Switch checked={enforced} onChange={(on) => void actions.setEnforced(setting, on, copy.title)} label={`${copy.title}: obligatorio para todos`} />
        </div>
      </div>
      <h3 className="mx-1 mb-2 mt-3.5 text-[13px] font-medium text-body-faint">Solo para un gimnasio</h3>
      <SettingExceptions setting={setting} companies={companies} actions={actions} />
    </section>
  );
}
