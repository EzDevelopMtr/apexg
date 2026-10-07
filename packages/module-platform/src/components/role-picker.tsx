import type { PlatformRole } from "@apexg/core";
import { SegmentedControl } from "@apexg/ui";
import { roleHelp } from "./role-copy";

export interface RolePickerProps {
  readonly roles: readonly PlatformRole[];
  readonly value: number | undefined;
  readonly onChange: (role: PlatformRole) => void;
}

/** The gym's profiles as a segmented choice, with what the chosen one can do. */
export default function RolePicker({ roles, value, onChange }: RolePickerProps) {
  const options = roles.map((role) => ({ id: String(role.id), label: role.name }));
  const selected = roles.find((role) => role.id === value);
  return (
    <div>
      <span className="mb-1.5 block text-[13px] text-body-soft">Perfil</span>
      <SegmentedControl
        options={options}
        value={String(value ?? "")}
        onChange={(id) => {
          const role = roles.find((candidate) => String(candidate.id) === id);
          if (role) onChange(role);
        }}
        label="Perfil"
        size="sm"
      />
      {selected && <p className="mt-1.5 text-xs text-body-faint">{roleHelp(selected.name)}</p>}
    </div>
  );
}
