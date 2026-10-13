import type { PlatformSettingKey } from "@apexg/core";
import { Stepper, Textarea } from "@apexg/ui";
import ModuleSwitches from "./module-switches";
import { days, SETTING_COPY } from "./setting-copy";

export interface SettingValueProps {
  readonly settingKey: PlatformSettingKey;
  readonly value: unknown;
  readonly onChange: (value: unknown) => void;
}

/** Edits a value the way its kind asks: a stepper for days, switches for modules, a box for text. */
export default function SettingValue({ settingKey, value, onChange }: SettingValueProps) {
  const copy = SETTING_COPY[settingKey];
  if (copy.kind === "modules") {
    return <ModuleSwitches value={Array.isArray(value) ? (value as string[]) : []} onChange={onChange} />;
  }
  if (copy.kind === "text") {
    return (
      <div className="px-[18px] py-3">
        <Textarea
          aria-label={copy.title}
          rows={3}
          maxLength={500}
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    );
  }
  return (
    <Stepper
      value={typeof value === "number" ? value : (copy.min ?? 0)}
      min={copy.min ?? 0}
      max={copy.max ?? 365}
      onChange={onChange}
      format={days}
      label={copy.title}
    />
  );
}
