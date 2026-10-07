import { MODULES } from "@apexg/core";
import { Switch } from "@apexg/ui";

export interface ModuleSwitchesProps {
  readonly value: readonly string[];
  readonly onChange: (value: string[]) => void;
}

/** One switch per module, in catalogue order. Two columns where there is room. */
export default function ModuleSwitches({ value, onChange }: ModuleSwitchesProps) {
  const toggle = (id: string, on: boolean) =>
    onChange(MODULES.map((m) => m.id).filter((m) => (m === id ? on : value.includes(m))));
  return (
    <div className="grid md:grid-cols-2">
      {MODULES.map((module, index) => (
        <div
          key={module.id}
          className={`flex min-h-14 items-center justify-between gap-4 px-[18px] py-2.5 ${index > 0 ? "border-t border-hairline" : ""} ${index === 1 ? "md:border-t-0" : ""} ${index % 2 === 0 ? "md:border-r md:border-r-hairline" : ""}`}
        >
          <span className="text-[15px] font-medium">{module.name}</span>
          <Switch checked={value.includes(module.id)} onChange={(on) => toggle(module.id, on)} label={module.name} />
        </div>
      ))}
    </div>
  );
}
