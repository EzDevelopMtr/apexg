"use client";

import { MODULES } from "@apexg/core";
import type { PlatformSettingKey } from "@apexg/core";
import { SETTING_COPY } from "./setting-copy";

export interface SettingValueInputProps {
  settingKey: PlatformSettingKey;
  value: unknown;
  onChange: (value: unknown) => void;
}

/** Edits one value of a setting, shaped by its kind. */
export default function SettingValueInput({ settingKey, value, onChange }: SettingValueInputProps) {
  if (SETTING_COPY[settingKey].kind === "days") {
    return (
      <input
        type="number"
        min={0}
        aria-label={SETTING_COPY[settingKey].title}
        value={typeof value === "number" ? value : 0}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-24 rounded-lg border border-line bg-surface px-3 py-1.5 text-body"
      />
    );
  }
  const enabled = Array.isArray(value) ? (value as string[]) : [];
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1">
      {MODULES.map((module) => (
        <label key={module.id} className="flex items-center gap-1.5 text-sm text-body-soft">
          <input
            type="checkbox"
            checked={enabled.includes(module.id)}
            onChange={(e) =>
              onChange(
                e.target.checked
                  ? [...enabled, module.id]
                  : enabled.filter((id) => id !== module.id),
              )
            }
          />
          {module.name}
        </label>
      ))}
    </div>
  );
}
