import { Minus } from "lucide-react";
import type { PlatformSettingKey } from "@apexg/core";
import GymAvatar from "./gym-avatar";
import { describeValue, SETTING_COPY } from "./setting-copy";
import SettingValue from "./setting-value";

export interface ExceptionRowProps {
  readonly settingKey: PlatformSettingKey;
  readonly name: string;
  readonly color: string | null;
  readonly value: unknown;
  /** The general value is enforced: the exception is shown but does not apply. */
  readonly muted: boolean;
  readonly expanded: boolean;
  readonly onToggle: () => void;
  readonly onChange: (value: unknown) => void;
  readonly onRemove: () => void;
}

const REMOVE =
  "grid size-7 place-items-center rounded-full text-body-faint transition-[color,background-color,transform] duration-100 hover:bg-danger-soft hover:text-danger-ink active:scale-90";

/** One gym's own value. Days edit in place; a module list opens its switches below. */
export default function ExceptionRow(props: ExceptionRowProps) {
  const { settingKey, name, color, value, muted, expanded, onToggle, onChange, onRemove } = props;
  const isDays = SETTING_COPY[settingKey].kind === "days";
  return (
    <div className="border-t border-hairline first:border-t-0">
      <div className={`flex min-h-14 items-center justify-between gap-3 px-[18px] py-2.5 ${muted ? "opacity-45" : ""}`}>
        <span className="flex min-w-0 items-center gap-3">
          <GymAvatar name={name} color={color} size="sm" />
          <span className="truncate text-[15px] font-medium">{name}</span>
        </span>
        <span className="flex items-center gap-2.5">
          {isDays ? (
            <SettingValue settingKey={settingKey} value={value} onChange={onChange} />
          ) : (
            <button type="button" aria-expanded={expanded} onClick={onToggle} className="rounded-full bg-fill-2 px-2.5 py-[3px] text-[13px] font-semibold text-body-muted hover:bg-fill-3">
              {describeValue(value)}
            </button>
          )}
          <button type="button" aria-label={`Quitar excepción de ${name}`} onClick={onRemove} className={REMOVE}>
            <Minus size={16} />
          </button>
        </span>
      </div>
      {!isDays && expanded && <SettingValue settingKey={settingKey} value={value} onChange={onChange} />}
    </div>
  );
}
